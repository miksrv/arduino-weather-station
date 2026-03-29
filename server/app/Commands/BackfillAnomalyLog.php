<?php

namespace App\Commands;

use App\Libraries\AnomalyDetector;
use App\Models\AnomalyLogModel;
use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

/**
 * Class BackfillAnomalyLog
 *
 * Spark CLI command that iterates through all historical daily records —
 * starting from the very first row in daily_averages — and populates the
 * anomaly_log table from scratch. Intended for bootstrapping a fresh server
 * where anomaly_log is empty.
 *
 * Usage:
 *   php spark system:backfillAnomalyLog
 *   php spark system:backfillAnomalyLog --force
 *
 * The --force flag bypasses the guard clause that prevents accidental
 * double-population when anomaly_log already contains rows.
 *
 * @package App\Commands
 */
class BackfillAnomalyLog extends BaseCommand
{
    /** @var string Command group */
    protected $group = 'system';

    /** @var string Command name */
    protected $name = 'system:backfillAnomalyLog';

    /** @var string Command description */
    protected $description = 'Iterates all historical daily records and populates the anomaly_log table from scratch. Safe to run when anomaly_log is empty.';

    /**
     * Executes the backfill workflow:
     * 1. Guard clause — abort if anomaly_log is non-empty unless --force is passed.
     * 2. Fetch all daily rows ordered ASC by date.
     * 3. For each day, run AnomalyDetector::checkAllAnomalies() and open/close anomaly_log rows.
     * 4. Track open anomalies in-memory to avoid a DB query per type per day.
     * 5. Report progress every 100 rows and print a final summary.
     *
     * @param array $params CLI parameters (unused; options read via CLI::getOption)
     * @return void
     */
    public function run(array $params): void
    {
        try {
            $dailyModel  = new DailyAveragesModel();
            $hourlyModel = new HourlyAveragesModel();
            $detector    = new AnomalyDetector($dailyModel, $hourlyModel);
            $logModel    = new AnomalyLogModel();

            // ----------------------------------------------------------------
            // Guard clause: abort if anomaly_log already has rows
            // ----------------------------------------------------------------
            $existingCount = $logModel->countAllResults();
            $force         = CLI::getOption('force') !== null;

            if ($existingCount > 0 && !$force) {
                CLI::write(
                    "[WARNING] anomaly_log already contains {$existingCount} row(s). "
                    . 'Run with --force to bypass this check.',
                    'yellow'
                );
                return;
            }

            if ($existingCount > 0 && $force) {
                CLI::write(
                    "[FORCE] anomaly_log contains {$existingCount} row(s) — proceeding anyway.",
                    'yellow'
                );
            }

            // ----------------------------------------------------------------
            // Fetch all daily rows, ASC by date
            // ----------------------------------------------------------------
            $allDailyRows = $dailyModel
                ->orderBy('date', 'ASC')
                ->findAll();

            $total = count($allDailyRows);

            if ($total === 0) {
                CLI::write('[INFO] No daily rows found in daily_averages. Nothing to backfill.', 'cyan');
                return;
            }

            CLI::write("[INFO] Starting backfill over {$total} daily records...", 'cyan');

            // ----------------------------------------------------------------
            // Pre-load any already-open anomaly rows into the in-memory map.
            // This matters when --force is used and there are partial records.
            // ----------------------------------------------------------------
            $openAnomalies = [];   // [ type => ['id' => int, 'peak' => ?float] ]

            $existingOpen = $logModel->getActiveAnomalies();
            foreach ($existingOpen as $row) {
                $rowArr = is_array($row) ? $row : (array) $row;
                $openAnomalies[(string) $rowArr['type']] = [
                    'id'   => (int) $rowArr['id'],
                    'peak' => isset($rowArr['peak_value']) ? (float) $rowArr['peak_value'] : null,
                ];
            }

            // ----------------------------------------------------------------
            // Iterate day by day
            // ----------------------------------------------------------------
            $opened = 0;
            $closed = 0;

            foreach ($allDailyRows as $index => $dailyRow) {
                // DailyAveragesModel returns WeatherDataEntity objects; toRawArray()
                // gives snake_case column keys (temperature, dew_point, wind_speed …).
                $rowArr = $dailyRow instanceof \CodeIgniter\Entity\Entity
                    ? $dailyRow->toRawArray()
                    : (is_array($dailyRow) ? $dailyRow : (array) $dailyRow);

                $dateStr = substr((string) ($rowArr['date'] ?? ''), 0, 10);

                if ($dateStr === '') {
                    continue;
                }

                $date = new \DateTime($dateStr);

                // Fetch all hourly rows for this specific day (DESC)
                $recentHourlyRaw = $hourlyModel
                    ->where('date >=', $dateStr . ' 00:00:00')
                    ->where('date <=', $dateStr . ' 23:59:59')
                    ->orderBy('date', 'DESC')
                    ->findAll();

                $recentHourlyArr = array_map(
                    fn($r) => $r instanceof \CodeIgniter\Entity\Entity
                        ? $r->toRawArray()
                        : (is_array($r) ? $r : (array) $r),
                    $recentHourlyRaw
                );

                // Run all anomaly checks for this day
                $anomalyStates = $detector->checkAllAnomalies($date, $recentHourlyArr, $rowArr);

                foreach ($anomalyStates as $type => $state) {
                    $isActive  = (bool) $state['active'];
                    $isOpen    = isset($openAnomalies[$type]);
                    $peakValue = $this->_extractPeakValue($state);

                    if ($isActive && !$isOpen) {
                        // Open new episode
                        $id = $logModel->openAnomaly(
                            $type,
                            $dateStr,
                            $peakValue,
                            $this->_buildDescription($type, $state)
                        );
                        $openAnomalies[$type] = ['id' => $id, 'peak' => $peakValue];
                        $opened++;
                    } elseif ($isActive && $isOpen) {
                        // Update in-memory peak if higher (avoid DB write every day)
                        $storedPeak = $openAnomalies[$type]['peak'];
                        if ($peakValue !== null && ($storedPeak === null || abs($peakValue) > abs($storedPeak))) {
                            $logModel->updatePeakIfHigher((int) $openAnomalies[$type]['id'], $peakValue);
                            $openAnomalies[$type]['peak'] = $peakValue;
                        }
                    } elseif (!$isActive && $isOpen) {
                        // Close episode
                        $logModel->closeAnomaly((int) $openAnomalies[$type]['id'], $dateStr);
                        unset($openAnomalies[$type]);
                        $closed++;
                    }
                    // else: not active, not open — do nothing
                }

                // Progress report every 100 rows
                $processed = $index + 1;
                if ($processed % 100 === 0) {
                    CLI::write("Processed {$processed} / {$total} days...", 'cyan');
                }
            }

            // ----------------------------------------------------------------
            // Final summary
            // ----------------------------------------------------------------
            $summary = "system:backfillAnomalyLog completed: {$total} days processed, "
                . "{$opened} anomalies opened, {$closed} anomalies closed.";

            CLI::write($summary, 'green');
            log_message('info', $summary);

            // Report any anomalies left open at the end of history
            $stillOpen = array_keys($openAnomalies);
            if (!empty($stillOpen)) {
                $stillOpenTypes = implode(', ', $stillOpen);
                CLI::write(
                    '[INFO] ' . count($stillOpen) . " anomaly type(s) remain open at end of history: {$stillOpenTypes}",
                    'cyan'
                );
                log_message('info', "system:backfillAnomalyLog — open at end of history: {$stillOpenTypes}");
            }
        } catch (\Exception $e) {
            $msg = 'system:backfillAnomalyLog failed: ' . $e->getMessage();
            log_message('error', $msg);
            CLI::write('[ERROR] ' . $msg, 'red');
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Extracts the best scalar peak value from an anomaly state array.
     * Prefers zScore; falls back to extraMetric['value']; else null.
     *
     * @param array $state From AnomalyDetector::checkAllAnomalies()
     * @return float|null
     */
    private function _extractPeakValue(array $state): ?float
    {
        if (isset($state['zScore']) && $state['zScore'] !== null) {
            return round((float) $state['zScore'], 4);
        }

        $v = $state['extraMetric']['value'] ?? null;

        return $v !== null ? round((float) $v, 4) : null;
    }

    /**
     * Builds a human-readable description for an anomaly episode.
     *
     * @param string $type  Anomaly type key
     * @param array  $state From AnomalyDetector::checkAllAnomalies()
     * @return string
     */
    private function _buildDescription(string $type, array $state): string
    {
        $z  = $state['zScore'] !== null ? round((float) $state['zScore'], 2) : null;
        $em = $state['extraMetric'] ?? null;

        $descriptions = [
            'heat_wave'         => 'Heat wave' . ($z !== null ? sprintf(' (temp Z-score: %+.2f)', $z) : ''),
            'cold_snap'         => 'Cold snap' . ($z !== null ? sprintf(' (temp Z-score: %+.2f)', $z) : ''),
            'pressure_collapse' => 'Rapid pressure collapse (≥5 hPa drop in 3 hours)',
            'freezing_rain'     => 'Freezing rain (precipitation with temperature between -5°C and +1.5°C)',
            'fog_risk'          => 'Fog risk (dew-point spread ≤2.5°C, wind <2 m/s, clouds <40%)',
            'drought_spi30'     => 'Drought' . ($em ? sprintf(' (SPI-30: %+.2f)', (float) $em['value']) : ''),
            'extreme_uv'        => 'Extreme UV index (≥7)' . ($z !== null ? sprintf(' (UV Z-score: %+.2f)', $z) : ''),
            'pressure_high'     => 'Anomalously high pressure' . ($z !== null ? sprintf(' (pressure Z-score: %+.2f)', $z) : ''),
            'strong_wind'       => 'Strong wind (>12 m/s)' . ($z !== null ? sprintf(' (wind Z-score: %+.2f)', $z) : ''),
            'fire_risk'         => 'Fire risk (low humidity, strong wind)' . ($em ? sprintf(' (7-day precip: %.1f mm)', (float) $em['value']) : ''),
            'late_frost'        => 'Late frost after warm period' . ($z !== null ? sprintf(' (temp Z-score: %+.2f)', $z) : ''),
            'heat_stress'       => 'Heat stress (heat index >36°C)',
        ];

        return $descriptions[$type] ?? ucwords(str_replace('_', ' ', $type));
    }
}
