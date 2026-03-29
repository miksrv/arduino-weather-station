<?php

namespace App\Models;

use CodeIgniter\Model;

/**
 * Class AnomalyLogModel
 *
 * Manages persistent records of detected meteorological anomaly events
 * in the anomaly_log table. Each row represents a single anomaly episode
 * with an optional end date when the condition resolved.
 *
 * @package App\Models
 */
class AnomalyLogModel extends Model
{
    protected $table         = 'anomaly_log';
    protected $primaryKey    = 'id';
    protected $allowedFields = [
        'type',
        'start_date',
        'end_date',
        'peak_value',
        'description',
        'created_at',
        'updated_at',
    ];
    protected $useTimestamps = true;

    /**
     * Opens a new anomaly episode. Inserts a row with no end_date (still active).
     *
     * @param string      $type        Anomaly type key (e.g. 'heat_wave')
     * @param string      $date        Start date in 'Y-m-d' format
     * @param float|null  $peakValue   Optional peak metric value
     * @param string|null $description Optional human-readable description
     * @return int Inserted row ID
     */
    public function openAnomaly(
        string $type,
        string $date,
        ?float $peakValue = null,
        ?string $description = null
    ): int {
        $now = date('Y-m-d H:i:s');

        $this->insert([
            'type'        => $type,
            'start_date'  => $date,
            'end_date'    => null,
            'peak_value'  => $peakValue,
            'description' => $description,
            'created_at'  => $now,
            'updated_at'  => null,
        ]);

        return (int) $this->getInsertID();
    }

    /**
     * Updates peak_value for a row if |$newValue| > |current peak_value|.
     * No-op if $newValue is null or the row already has a higher absolute value.
     *
     * @param int        $id
     * @param float|null $newValue
     * @return void
     */
    public function updatePeakIfHigher(int $id, ?float $newValue): void
    {
        if ($newValue === null) {
            return;
        }

        $row = $this->find($id);

        if (!$row) {
            return;
        }

        $rowArr     = is_array($row) ? $row : (array) $row;
        $storedPeak = isset($rowArr['peak_value']) && $rowArr['peak_value'] !== null
            ? (float) $rowArr['peak_value']
            : null;

        if ($storedPeak === null || abs($newValue) > abs($storedPeak)) {
            $this->update($id, [
                'peak_value' => round($newValue, 4),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
        }
    }

    /**
     * Closes an open anomaly episode by setting its end_date.
     *
     * @param int    $id      Row ID to close
     * @param string $endDate End date in 'Y-m-d' format
     * @return void
     */
    public function closeAnomaly(int $id, string $endDate): void
    {
        $this->update($id, [
            'end_date'   => $endDate,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Returns all anomaly rows that are currently open (end_date IS NULL),
     * ordered by start_date descending.
     *
     * @return array
     */
    public function getActiveAnomalies(): array
    {
        return $this
            ->where('end_date IS NULL')
            ->orderBy('start_date', 'DESC')
            ->findAll();
    }

    /**
     * Returns all anomaly_log rows that were active on the given calendar date:
     *   start_date <= $date AND (end_date IS NULL OR end_date >= $date)
     *
     * This is the same predicate used by getCalendarData() for each calendar day,
     * ensuring that anomaly list consumers can apply the identical "active on date"
     * definition rather than the narrower "still open" (end_date IS NULL) check.
     *
     * @param string $date Date in 'Y-m-d' format
     * @return array
     */
    public function getAnomaliesActiveOnDate(string $date): array
    {
        return $this
            ->where('start_date <=', $date)
            ->groupStart()
                ->where('end_date IS NULL')
                ->orWhere('end_date >=', $date)
            ->groupEnd()
            ->orderBy('start_date', 'DESC')
            ->findAll();
    }

    /**
     * Returns the most recent $limit rows (open and closed), ordered by
     * start_date descending.
     *
     * @param int $limit Maximum number of rows to return
     * @return array
     */
    public function getHistory(int $limit = 50): array
    {
        return $this
            ->orderBy('start_date', 'DESC')
            ->findAll($limit);
    }

    /**
     * Returns the currently open row for the given anomaly type, or null if
     * no open row exists. Used to prevent duplicate open entries.
     *
     * @param string $type Anomaly type key
     * @return array|null Row data or null
     */
    public function getOpenByType(string $type): ?array
    {
        $row = $this
            ->where('type', $type)
            ->where('end_date IS NULL')
            ->first();

        return $row ? (array) $row : null;
    }

    /**
     * Returns daily active-anomaly counts for the past $days calendar days.
     *
     * For each date, counts how many anomaly_log rows were active on that date:
     *   start_date <= date AND (end_date IS NULL OR end_date >= date)
     *
     * For today's date, merges current anomaly states from detector with anomaly_log
     * (anomaly is active if detector says so OR there's an open log record).
     *
     * @param int   $days          Number of past days to cover
     * @param array $currentStates Current anomaly states from AnomalyDetector (optional)
     * @return array Array of ['date' => 'Y-m-d', 'activeCount' => int, 'types' => string[]]
     */
    public function getCalendarData(int $days = 365, array $currentStates = []): array
    {
        $result   = [];
        $today    = new \DateTime('today');
        $todayStr = $today->format('Y-m-d');
        $allRows  = $this->findAll();

        for ($i = $days - 1; $i >= 0; $i--) {
            $date    = (clone $today)->modify("-{$i} days")->format('Y-m-d');

            // For today, merge detector states with anomaly_log
            if ($date === $todayStr && !empty($currentStates)) {
                $types = [];

                // First, collect types from anomaly_log that are active today
                foreach ($allRows as $row) {
                    $rowArr    = is_array($row) ? $row : (array) $row;
                    $startDate = substr((string) ($rowArr['start_date'] ?? ''), 0, 10);
                    $endDate   = isset($rowArr['end_date']) && $rowArr['end_date'] !== null
                        ? substr((string) $rowArr['end_date'], 0, 10)
                        : null;

                    if ($startDate <= $date && ($endDate === null || $endDate >= $date)) {
                        $type = (string) ($rowArr['type'] ?? 'unknown');
                        if (!in_array($type, $types, true)) {
                            $types[] = $type;
                        }
                    }
                }

                // Then, add types from detector that are active but not yet in log
                foreach ($currentStates as $type => $state) {
                    if (!empty($state['active']) && !in_array((string) $type, $types, true)) {
                        $types[] = (string) $type;
                    }
                }

                $result[] = ['date' => $date, 'activeCount' => count($types), 'types' => $types];
                continue;
            }

            // For past dates, use anomaly_log
            $active  = 0;
            $types   = [];

            foreach ($allRows as $row) {
                $rowArr    = is_array($row) ? $row : (array) $row;
                $startDate = substr((string) ($rowArr['start_date'] ?? ''), 0, 10);
                $endDate   = isset($rowArr['end_date']) && $rowArr['end_date'] !== null
                    ? substr((string) $rowArr['end_date'], 0, 10)
                    : null;

                if ($startDate <= $date && ($endDate === null || $endDate >= $date)) {
                    $active++;
                    $types[] = (string) ($rowArr['type'] ?? 'unknown');
                }
            }

            $result[] = ['date' => $date, 'activeCount' => $active, 'types' => $types];
        }

        return $result;
    }
}
