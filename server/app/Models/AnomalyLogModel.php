<?php

namespace App\Models;

use CodeIgniter\Model;

/**
 * Model for the anomaly_log table.
 *
 * Manages persistent records of detected meteorological anomaly events.
 * Each row represents a single anomaly episode with an optional end date
 * when the condition resolved. Consumed by the Anomaly controller, the
 * AnomalyModel orchestrator, and the DetectAnomalies / BackfillAnomalyLog
 * CLI commands.
 *
 * @package App\Models
 */
class AnomalyLogModel extends Model
{
    protected $table            = 'anomaly_log';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $allowedFields    = [
        'type',
        'start_date',
        'end_date',
        'peak_value',
        'description',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $validationRules = [
        'type'        => 'required|max_length[64]',
        'start_date'  => 'required|valid_date',
        'end_date'    => 'permit_empty|valid_date',
        'peak_value'  => 'permit_empty|decimal',
        'description' => 'permit_empty|max_length[512]',
    ];

    protected $validationMessages = [];

    protected $skipValidation = false;

    /**
     * Opens a new anomaly episode. Inserts a row with no end_date (still active).
     *
     * @param string      $type        Anomaly type key (e.g. 'heat_wave').
     * @param string      $date        Start date in 'Y-m-d' format.
     * @param float|null  $peakValue   Optional peak metric value.
     * @param string|null $description Optional human-readable description.
     * @return int Inserted row ID.
     */
    public function openAnomaly(
        string $type,
        string $date,
        ?float $peakValue = null,
        ?string $description = null
    ): int {
        $this->insert([
            'type'        => $type,
            'start_date'  => $date,
            'end_date'    => null,
            'peak_value'  => $peakValue,
            'description' => $description,
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
            ]);
        }
    }

    /**
     * Closes an open anomaly episode by setting its end_date (the last ACTIVE day, inclusive).
     *
     * @param int    $id      Row ID to close.
     * @param string $endDate End date in 'Y-m-d' format.
     * @return void
     */
    public function closeAnomaly(int $id, string $endDate): void
    {
        $this->update($id, [
            'end_date' => $endDate,
        ]);
    }

    /**
     * Returns the most recent episode (by start_date) of the given type, open or closed.
     *
     * @param string $type Anomaly type key.
     * @return array|null Row data or null.
     */
    public function getLatestByType(string $type): ?array
    {
        $row = $this
            ->where('type', $type)
            ->orderBy('start_date', 'DESC')
            ->orderBy('id', 'DESC')
            ->first();

        return $row ? (array) $row : null;
    }

    /**
     * Removes every anomaly_log row (used by the forced backfill before it replays history).
     *
     * @return void
     */
    public function deleteAllRows(): void
    {
        $this->where('id >', 0)->delete();
    }

    /**
     * Applies one evaluated day of one anomaly type to the log. Idempotent: evaluating
     * the same day again changes nothing, and days must be fed in ascending order.
     *
     * An episode runs from start_date to end_date, both inclusive (end_date = the last
     * ACTIVE day, NULL while still active at the last evaluated day).
     *
     * Active day:
     *   - no episode yet / the latest one ended before the previous day: open a new one;
     *   - the latest one is open or already covers the day: keep it (peak updated);
     *   - the latest one ended the previous day: re-open it (no duplicate row).
     * Inactive day:
     *   - an open episode is closed with end_date = the previous day; an episode that
     *     started on this very day is dropped (the day was evaluated active before).
     *
     * @param string      $type        Anomaly type key.
     * @param bool        $active      Whether the anomaly is active on $date.
     * @param string      $date        Evaluated day, 'Y-m-d'.
     * @param float|null  $peakValue   Peak metric of the day.
     * @param string|null $description Description for a newly opened episode.
     * @param array|null  $latest      Latest episode of the type as returned by getLatestByType().
     * @return array{action: string, row: array|null} action is opened|reopened|updated|closed|dropped|none;
     *                                                row is the episode now latest for the type.
     */
    public function applyDayState(
        string $type,
        bool $active,
        string $date,
        ?float $peakValue,
        ?string $description,
        ?array $latest
    ): array {
        $start = $latest !== null ? substr((string) $latest['start_date'], 0, 10) : null;
        $end   = $latest !== null && $latest['end_date'] !== null ? substr((string) $latest['end_date'], 0, 10) : null;
        $prev  = (new \DateTime($date))->modify('-1 day')->format('Y-m-d');

        if ($active) {
            if ($latest === null || $end !== null && $end < $prev) {
                $id = $this->openAnomaly($type, $date, $peakValue, $description);

                return ['action' => 'opened', 'row' => [
                    'id' => $id, 'type' => $type, 'start_date' => $date, 'end_date' => null, 'peak_value' => $peakValue,
                ]];
            }

            if ($start > $date) {
                return ['action' => 'none', 'row' => $latest];
            }

            $action = 'updated';

            if ($end === $prev) {
                $this->update((int) $latest['id'], ['end_date' => null]);
                $latest['end_date'] = null;
                $action             = 'reopened';
            }

            $stored = $latest['peak_value'] !== null ? (float) $latest['peak_value'] : null;

            if ($peakValue !== null && ($stored === null || abs($peakValue) > abs($stored))) {
                $this->updatePeakIfHigher((int) $latest['id'], $peakValue);
                $latest['peak_value'] = round($peakValue, 4);
            }

            return ['action' => $action, 'row' => $latest];
        }

        if ($latest === null || $end !== null || $start > $date) {
            return ['action' => 'none', 'row' => $latest];
        }

        if ($start === $date) {
            $this->delete((int) $latest['id']);

            return ['action' => 'dropped', 'row' => $this->getLatestByType($type)];
        }

        $this->closeAnomaly((int) $latest['id'], $prev);
        $latest['end_date'] = $prev;

        return ['action' => 'closed', 'row' => $latest];
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
     *   start_date <= $date AND (end_date IS NULL OR end_date >= $date).
     *
     * @param string $date Date in 'Y-m-d' format.
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
     * Returns anomaly_log rows whose start_date or end_date falls within the
     * given inclusive date window. Used by the Events feed to surface
     * anomaly_started / anomaly_ended entries — reuses the existing
     * anomaly_log table rather than persisting anything new.
     *
     * @param string $startDate Window start, 'Y-m-d' format.
     * @param string $endDate   Window end, 'Y-m-d' format.
     * @return array
     */
    public function getAnomaliesTouchingWindow(string $startDate, string $endDate): array
    {
        return $this
            ->groupStart()
                ->where('start_date >=', $startDate)
                ->where('start_date <=', $endDate)
            ->groupEnd()
            ->orGroupStart()
                ->where('end_date >=', $startDate)
                ->where('end_date <=', $endDate)
            ->groupEnd()
            ->orderBy('start_date', 'DESC')
            ->findAll();
    }

    /**
     * Returns the most recent $limit rows (open and closed), ordered by
     * start_date descending.
     *
     * @param int $limit Maximum number of rows to return.
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
     * @param string $type Anomaly type key.
     * @return array|null Row data or null.
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
     *   start_date <= date AND (end_date IS NULL OR end_date >= date).
     *
     * For today's date, merges current anomaly states from the detector with
     * anomaly_log (anomaly is active if detector says so OR there is an open
     * log record).
     *
     * @param int   $days          Number of past days to cover.
     * @param array $currentStates Current anomaly states from AnomalyDetector (optional).
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
