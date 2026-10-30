<?php

namespace App\Libraries;

use App\Models\RawWeatherDataModel;
use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;

/**
 * Pure helpers deciding the safety values of the plain-text feed
 * (`/current/text`) that drives the observatory's INDI Weather Watcher.
 *
 * A false alarm there closes the roof and ends the night, and a single bad
 * reading from one weather API is enough to raise one. So a value only turns
 * unsafe when it is confirmed:
 * - by at least {@see self::MIN_CONFIRMING_SOURCES} independent API sources, or
 * - by the station's own sensor, as the median of its readings, so one spike does not count.
 * Without a confirmation the value is reported as safe (0 / forecast 1). These
 * values are always present in the feed: the driver only creates the
 * parameters whose keys it sees when it connects.
 *
 * Input rows are raw rows (snake_case, `date` / `forecast_time` in UTC).
 *
 * @package App\Libraries
 */
class ObservatorySafety
{
    /** Number of independent API sources that must agree before a value counts. */
    public const MIN_CONFIRMING_SOURCES = 2;

    /** How far back the latest report of every API source is taken (current weather is polled hourly). */
    public const REPORT_WINDOW_MINUTES = 90;

    /** How far back the station's wind readings are taken for the median. */
    public const STATION_WINDOW_MINUTES = 30;

    /** How many hours after the current one the forecast flag looks at. */
    public const FORECAST_LOOKAHEAD_HOURS = 2;

    /**
     * Current precipitation, mm. Non-zero only when at least two API sources
     * report a wet hour ({@see ForecastAggregator::WET_HOUR_MM}); the station has no rain sensor.
     *
     * @param array<int, array<string, mixed>> $rows Raw observation rows of the last {@see self::REPORT_WINDOW_MINUTES} minutes.
     * @param DateTimeInterface                $now  Reference time.
     * @return float
     */
    public static function precipitation(array $rows, DateTimeInterface $now): float
    {
        $confirmed = self::_confirmedBySources(self::_latestBySource($rows, 'precipitation', $now));

        return $confirmed !== null && $confirmed >= ForecastAggregator::WET_HOUR_MM ? $confirmed : 0.0;
    }

    /**
     * Current wind speed, m/s: the higher of the station's median and the
     * level confirmed by API sources.
     *
     * @param array<int, array<string, mixed>> $rows Raw observation rows of the last {@see self::REPORT_WINDOW_MINUTES} minutes.
     * @param DateTimeInterface                $now  Reference time.
     * @return float
     */
    public static function windSpeed(array $rows, DateTimeInterface $now): float
    {
        return max(
            self::_stationMedian($rows, 'wind_speed', $now) ?? 0.0,
            self::_confirmedBySources(self::_latestBySource($rows, 'wind_speed', $now)) ?? 0.0
        );
    }

    /**
     * Current wind gust, m/s: the level confirmed by API sources (the station
     * does not measure gusts), never below the confirmed wind speed.
     *
     * @param array<int, array<string, mixed>> $rows Raw observation rows of the last {@see self::REPORT_WINDOW_MINUTES} minutes.
     * @param DateTimeInterface                $now  Reference time.
     * @return float
     */
    public static function windGust(array $rows, DateTimeInterface $now): float
    {
        return max(
            self::windSpeed($rows, $now),
            self::_confirmedBySources(self::_latestBySource($rows, 'wind_gust', $now)) ?? 0.0
        );
    }

    /**
     * Current cloud cover, %: the median of the latest reports of the API
     * sources (the station has no cloud sensor), so one source can not move it
     * on its own. 0 when fewer than two sources report.
     *
     * @param array<int, array<string, mixed>> $rows Raw observation rows of the last {@see self::REPORT_WINDOW_MINUTES} minutes.
     * @param DateTimeInterface                $now  Reference time.
     * @return float
     */
    public static function clouds(array $rows, DateTimeInterface $now): float
    {
        $values = array_values(self::_latestBySource($rows, 'clouds', $now));

        if (count($values) < self::MIN_CONFIRMING_SOURCES) {
            return 0.0;
        }

        return self::_median($values);
    }

    /**
     * Precipitation forecast flag: -1 when, in the current hour or the next
     * {@see self::FORECAST_LOOKAHEAD_HOURS}, at least two sources forecast a wet
     * hour; 1 otherwise, including when there is no forecast data.
     *
     * @param array<int, array<string, mixed>> $rows Raw forecast rows (`forecast_time`, `source`, `precipitation`).
     * @param DateTimeInterface                $now  Reference time.
     * @return int 1 = no confirmed precipitation ahead, -1 = confirmed precipitation ahead.
     */
    public static function forecastFlag(array $rows, DateTimeInterface $now): int
    {
        $utc       = new DateTimeZone('UTC');
        $hourStart = DateTimeImmutable::createFromInterface($now)->setTimezone($utc);
        $hourStart = $hourStart->setTime((int) $hourStart->format('G'), 0);
        $windowEnd = $hourStart->modify('+' . (self::FORECAST_LOOKAHEAD_HOURS + 1) . ' hours');

        // Wettest forecast of every source, per hour
        $hours = [];

        foreach ($rows as $row) {
            if (!isset($row['forecast_time'], $row['source'], $row['precipitation'])) {
                continue;
            }

            $time = new DateTimeImmutable((string) $row['forecast_time'], $utc);

            if ($time < $hourStart || $time >= $windowEnd) {
                continue;
            }

            $hour   = $time->format('Y-m-d H');
            $source = (string) $row['source'];

            $hours[$hour][$source] = max($hours[$hour][$source] ?? 0.0, (float) $row['precipitation']);
        }

        foreach ($hours as $sources) {
            $wet = array_filter($sources, static fn (float $mm): bool => $mm >= ForecastAggregator::WET_HOUR_MM);

            if (count($wet) >= self::MIN_CONFIRMING_SOURCES) {
                return -1;
            }
        }

        return 1;
    }

    /**
     * The latest report of every API source within the report window. A source
     * whose latest row has no value for the field does not report it (e.g.
     * OpenWeatherMap leaves out precipitation when it is dry).
     *
     * @param array<int, array<string, mixed>> $rows  Raw observation rows.
     * @param string                           $field Column name.
     * @param DateTimeInterface                $now   Reference time.
     * @return array<string, float> Value per source.
     */
    private static function _latestBySource(array $rows, string $field, DateTimeInterface $now): array
    {
        $since  = self::_minutesAgo($now, self::REPORT_WINDOW_MINUTES);
        $latest = [];

        foreach ($rows as $row) {
            $source = (string) ($row['source'] ?? '');

            if ($source === '' || $source === RawWeatherDataModel::SOURCE_CUSTOMSTATION) {
                continue;
            }

            $time = self::_rowTime($row);

            if ($time === null || $time < $since || $time > $now) {
                continue;
            }

            if (!isset($latest[$source]) || $time > $latest[$source]['time']) {
                $latest[$source] = ['time' => $time, 'value' => $row[$field] ?? null];
            }
        }

        $values = [];

        foreach ($latest as $source => $report) {
            if ($report['value'] !== null && $report['value'] !== '') {
                $values[$source] = (float) $report['value'];
            }
        }

        return $values;
    }

    /**
     * The highest value that at least {@see self::MIN_CONFIRMING_SOURCES} sources reach.
     *
     * @param array<string, float> $values Value per source.
     * @return float|null Null when too few sources report.
     */
    private static function _confirmedBySources(array $values): ?float
    {
        if (count($values) < self::MIN_CONFIRMING_SOURCES) {
            return null;
        }

        rsort($values);

        return $values[self::MIN_CONFIRMING_SOURCES - 1];
    }

    /**
     * Median of the station's readings within the station window.
     *
     * @param array<int, array<string, mixed>> $rows  Raw observation rows.
     * @param string                           $field Column name.
     * @param DateTimeInterface                $now   Reference time.
     * @return float|null Null when the station has no readings.
     */
    private static function _stationMedian(array $rows, string $field, DateTimeInterface $now): ?float
    {
        $since  = self::_minutesAgo($now, self::STATION_WINDOW_MINUTES);
        $values = [];

        foreach ($rows as $row) {
            if (($row['source'] ?? null) !== RawWeatherDataModel::SOURCE_CUSTOMSTATION) {
                continue;
            }

            $time = self::_rowTime($row);

            if ($time === null || $time < $since || $time > $now || !isset($row[$field]) || $row[$field] === '') {
                continue;
            }

            $values[] = (float) $row[$field];
        }

        return $values === [] ? null : self::_median($values);
    }

    /**
     * @param array<int, float> $values Non-empty list of values.
     * @return float
     */
    private static function _median(array $values): float
    {
        sort($values);
        $middle = intdiv(count($values), 2);

        return count($values) % 2 === 1 ? $values[$middle] : ($values[$middle - 1] + $values[$middle]) / 2;
    }

    /**
     * @param DateTimeInterface $now     Reference time.
     * @param int               $minutes Minutes back.
     * @return DateTimeImmutable
     */
    private static function _minutesAgo(DateTimeInterface $now, int $minutes): DateTimeImmutable
    {
        return DateTimeImmutable::createFromInterface($now)->modify('-' . $minutes . ' minutes');
    }

    /**
     * @param array<string, mixed> $row Raw observation row.
     * @return DateTimeImmutable|null Row time (UTC), or null when it has none.
     */
    private static function _rowTime(array $row): ?DateTimeImmutable
    {
        $date = $row['date'] ?? null;

        if ($date instanceof DateTimeInterface) {
            return DateTimeImmutable::createFromInterface($date);
        }

        return empty($date) ? null : new DateTimeImmutable((string) $date, new DateTimeZone('UTC'));
    }
}
