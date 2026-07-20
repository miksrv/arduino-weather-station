<?php

namespace App\Libraries;

use App\Models\PrecipitationModel;
use CodeIgniter\I18n\Time;
use DateTime;
use DateTimeZone;

/**
 * Class EventFeedBuilder
 *
 * Dynamically derives a "recent events" feed for the /events endpoint from
 * data that already exists — raw_weather_data and anomaly_log. Nothing this
 * class computes is persisted; every call re-derives the feed from scratch.
 *
 * Event types produced:
 *   - temperature_change / pressure_change: rolling-window value deltas
 *   - wind_gust: individual readings exceeding a gust threshold
 *   - precipitation: consecutive positive readings collapsed into one entry
 *   - system_status: freshness of the most recent raw_weather_data row
 *   - anomaly_started / anomaly_ended: anomaly_log rows touching the window
 *
 * @package App\Libraries
 */
class EventFeedBuilder
{
    /** @var float Minimum temperature delta (°C) over the rolling window to emit temperature_change */
    public const TEMPERATURE_CHANGE_THRESHOLD_C = 0.5;

    /** @var float Minimum pressure delta (hPa) over the rolling window to emit pressure_change */
    public const PRESSURE_CHANGE_THRESHOLD_HPA = 1.0;

    /** @var int Rolling comparison window, in minutes, used for value-change events */
    public const CHANGE_WINDOW_MINUTES = 20;

    /** @var float Wind gust speed (m/s) above which a reading is flagged as a wind_gust event */
    public const WIND_GUST_THRESHOLD_MS = 7.0;

    /** @var int Freshness window, in minutes, within which the latest reading is considered "ok" */
    public const SYSTEM_FRESHNESS_MINUTES = 15;

    /**
     * Builds and returns the merged, sorted, capped event feed.
     *
     * @param array         $rawRows     raw_weather_data rows (toRawArray() shape, snake_case keys), ASC by date.
     * @param array         $anomalyRows anomaly_log rows touching the requested window.
     * @param DateTime      $windowStart Inclusive start of the requested window.
     * @param DateTime      $windowEnd   Inclusive end of the requested window.
     * @param mixed         $lastUpdate  Most recent raw_weather_data date (string|Time|DateTime|null).
     * @param int           $limit       Maximum number of events to return.
     * @return array Events sorted by date descending, capped at $limit.
     */
    public function build(
        array $rawRows,
        array $anomalyRows,
        DateTime $windowStart,
        DateTime $windowEnd,
        mixed $lastUpdate,
        int $limit
    ): array {
        $events = [];

        $events = array_merge($events, $this->_buildChangeEvents(
            $rawRows,
            'temperature',
            'temperature_change',
            self::TEMPERATURE_CHANGE_THRESHOLD_C
        ));

        $events = array_merge($events, $this->_buildChangeEvents(
            $rawRows,
            'pressure',
            'pressure_change',
            self::PRESSURE_CHANGE_THRESHOLD_HPA
        ));

        $events = array_merge($events, $this->_buildWindGustEvents($rawRows));
        $events = array_merge($events, $this->_buildPrecipitationEvents($rawRows));

        $systemEvent = $this->_buildSystemStatusEvent($lastUpdate);

        if ($systemEvent !== null) {
            $events[] = $systemEvent;
        }

        $events = array_merge($events, $this->_buildAnomalyEvents($anomalyRows, $windowStart, $windowEnd));

        usort($events, static fn(array $a, array $b): int => strcmp($b['date'], $a['date']));

        return array_slice($events, 0, $limit);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Detects notable value changes for a single field using non-overlapping
     * rolling-window comparison: each reading is compared against the last
     * "anchor" reading that is at least CHANGE_WINDOW_MINUTES older, and the
     * anchor advances to the current reading after every comparison.
     *
     * @param array  $rows      raw_weather_data rows, ASC by date.
     * @param string $field     Column name to compare (e.g. 'temperature').
     * @param string $type      Event type to emit (e.g. 'temperature_change').
     * @param float  $threshold Minimum absolute delta required to emit an event.
     * @return array
     */
    private function _buildChangeEvents(array $rows, string $field, string $type, float $threshold): array
    {
        $events = [];
        $anchor = null;

        foreach ($rows as $row) {
            if (!isset($row[$field], $row['date']) || $row[$field] === null) {
                continue;
            }

            $value = (float) $row[$field];
            $date  = $this->_toDateTime($row['date']);

            if ($anchor === null) {
                $anchor = ['value' => $value, 'date' => $date];
                continue;
            }

            $elapsedMinutes = ($date->getTimestamp() - $anchor['date']->getTimestamp()) / 60;

            if ($elapsedMinutes < self::CHANGE_WINDOW_MINUTES) {
                continue;
            }

            $delta = round($value - $anchor['value'], 2);

            if (abs($delta) >= $threshold) {
                $events[] = [
                    'date'      => $this->_formatDate($date),
                    'type'      => $type,
                    'direction' => $delta > 0 ? 'up' : 'down',
                    'value'     => abs($delta),
                ];
            }

            $anchor = ['value' => $value, 'date' => $date];
        }

        return $events;
    }

    /**
     * Flags individual raw readings whose wind_gust exceeds the threshold.
     *
     * @param array $rows raw_weather_data rows.
     * @return array
     */
    private function _buildWindGustEvents(array $rows): array
    {
        $events = [];

        foreach ($rows as $row) {
            if (!isset($row['wind_gust'], $row['date']) || $row['wind_gust'] === null) {
                continue;
            }

            $gust = (float) $row['wind_gust'];

            if ($gust <= self::WIND_GUST_THRESHOLD_MS) {
                continue;
            }

            $events[] = [
                'date'    => $this->_formatDate($this->_toDateTime($row['date'])),
                'type'    => 'wind_gust',
                'value'   => $gust,
                'windDeg' => isset($row['wind_deg']) ? (int) $row['wind_deg'] : null,
            ];
        }

        return $events;
    }

    /**
     * Flags precipitation readings above the noise threshold, collapsing
     * consecutive positive readings into a single accumulated event.
     *
     * @param array $rows raw_weather_data rows, ASC by date.
     * @return array
     */
    private function _buildPrecipitationEvents(array $rows): array
    {
        $events     = [];
        $runSum     = 0.0;
        $runEndDate = null;

        foreach ($rows as $row) {
            $precip = isset($row['precipitation']) ? (float) $row['precipitation'] : 0.0;

            // Noise floor for "did it actually rain" lives on PrecipitationModel
            // (single source of truth shared with the precipitation calendar stats).
            if ($precip > PrecipitationModel::RAIN_THRESHOLD_MM && isset($row['date'])) {
                $runSum    += $precip;
                $runEndDate = $this->_toDateTime($row['date']);
                continue;
            }

            if ($runEndDate !== null) {
                $events[]   = $this->_makePrecipitationEvent($runEndDate, $runSum);
                $runSum     = 0.0;
                $runEndDate = null;
            }
        }

        if ($runEndDate !== null) {
            $events[] = $this->_makePrecipitationEvent($runEndDate, $runSum);
        }

        return $events;
    }

    /**
     * Builds a single precipitation event entry.
     *
     * @param DateTime $date Timestamp of the last reading in the run.
     * @param float    $sum  Accumulated precipitation over the run, in mm.
     * @return array
     */
    private function _makePrecipitationEvent(DateTime $date, float $sum): array
    {
        return [
            'date'  => $this->_formatDate($date),
            'type'  => 'precipitation',
            'value' => round($sum, 2),
        ];
    }

    /**
     * Computes freshness of the latest raw_weather_data reading. Returns null
     * (no event) when there is no data at all, since there is nothing
     * meaningful to timestamp.
     *
     * @param mixed $lastUpdate Most recent raw_weather_data date value, or null.
     * @return array|null
     */
    private function _buildSystemStatusEvent(mixed $lastUpdate): ?array
    {
        if (empty($lastUpdate)) {
            return null;
        }

        $lastUpdateDate = $this->_toDateTime($lastUpdate);
        $now            = new DateTime('now', new DateTimeZone(app_timezone()));
        $diffMinutes    = ($now->getTimestamp() - $lastUpdateDate->getTimestamp()) / 60;

        return [
            'date'   => $this->_formatDate($lastUpdateDate),
            'type'   => 'system_status',
            'status' => $diffMinutes <= self::SYSTEM_FRESHNESS_MINUTES ? 'ok' : 'stale',
        ];
    }

    /**
     * Surfaces anomaly_started / anomaly_ended entries for anomaly_log rows
     * whose start_date or end_date falls within the requested window.
     *
     * @param array    $anomalyRows anomaly_log rows.
     * @param DateTime $windowStart Inclusive window start.
     * @param DateTime $windowEnd   Inclusive window end.
     * @return array
     */
    private function _buildAnomalyEvents(array $anomalyRows, DateTime $windowStart, DateTime $windowEnd): array
    {
        $events   = [];
        $startStr = $windowStart->format('Y-m-d');
        $endStr   = $windowEnd->format('Y-m-d');

        foreach ($anomalyRows as $row) {
            $rowArr = is_array($row) ? $row : (array) $row;
            $type   = (string) ($rowArr['type'] ?? 'unknown');
            $start  = substr((string) ($rowArr['start_date'] ?? ''), 0, 10);
            $end    = isset($rowArr['end_date']) && $rowArr['end_date'] !== null
                ? substr((string) $rowArr['end_date'], 0, 10)
                : null;

            if ($start !== '' && $start >= $startStr && $start <= $endStr) {
                $events[] = [
                    'date'        => $this->_formatDate($this->_toDateTime($start)),
                    'type'        => 'anomaly_started',
                    'anomalyType' => $type,
                ];
            }

            if ($end !== null && $end >= $startStr && $end <= $endStr) {
                $events[] = [
                    'date'        => $this->_formatDate($this->_toDateTime($end)),
                    'type'        => 'anomaly_ended',
                    'anomalyType' => $type,
                ];
            }
        }

        return $events;
    }

    /**
     * Normalises a date value (string, CodeIgniter Time, or DateTime) into a
     * DateTime instance in the application timezone.
     *
     * @param mixed $value Date value to convert.
     * @return DateTime
     */
    private function _toDateTime(mixed $value): DateTime
    {
        if ($value instanceof DateTime) {
            return $value;
        }

        if ($value instanceof Time) {
            return $value->toDateTime();
        }

        return new DateTime((string) $value, new DateTimeZone(app_timezone()));
    }

    /**
     * Formats a DateTime as an ISO 8601 string in the application timezone.
     *
     * @param DateTime $date
     * @return string
     */
    private function _formatDate(DateTime $date): string
    {
        return $date->format(DateTime::ATOM);
    }
}
