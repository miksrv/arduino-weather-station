<?php

namespace App\Commands;

use App\Libraries\AnomalyDetector;
use App\Models\AnomalyLogModel;
use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

/**
 * Class DetectAnomalies
 *
 * Spark CLI command that runs all meteorological anomaly checks and updates
 * the anomaly_log table for the last complete UTC days. Intended to run once a day via cron after midnight UTC.
 *
 * Usage:
 *   php spark system:detectAnomalies
 *
 * @package App\Commands
 */
class DetectAnomalies extends BaseCommand
{
    /** @var int Number of last complete days evaluated per run (catches up skipped runs) */
    public const DAYS_LOOKBACK = 3;

    /** @var string Command group */
    protected $group = 'system';

    /** @var string Command name */
    protected $name = 'system:detectAnomalies';

    /** @var string Command description */
    protected $description = 'Checks all meteorological anomaly conditions and updates the anomaly_log table.';

    /**
     * Executes the anomaly detection workflow:
     * 1. Take the last COMPLETE UTC days (yesterday and the DAYS_LOOKBACK - 1 days before it,
     *    so a skipped cron run is caught up). Today is never evaluated: its partial
     *    averages would be compared with full-day climatology.
     * 2. For each day with a daily_averages row, run AnomalyDetector::evaluateDay()
     *    (the same evaluation the backfill uses).
     * 3. Apply each state to anomaly_log via AnomalyLogModel::applyDayState() (idempotent).
     * 4. Log a summary.
     *
     * @param array $params CLI parameters (unused)
     * @return void
     */
    public function run(array $params): void
    {
        try {
            $dailyModel  = new DailyAveragesModel();
            $hourlyModel = new HourlyAveragesModel();
            $detector    = new AnomalyDetector($dailyModel, $hourlyModel);
            $logModel    = new AnomalyLogModel();
            $yesterday   = new \DateTime('yesterday', new \DateTimeZone('UTC'));

            $opened = 0;
            $closed = 0;
            $days   = 0;

            for ($offset = self::DAYS_LOOKBACK - 1; $offset >= 0; $offset--) {
                $date    = (clone $yesterday)->modify("-{$offset} days");
                $dateStr = $date->format('Y-m-d');
                $states  = $detector->evaluateDay($date);

                if ($states === null) {
                    CLI::write("[SKIP]   {$dateStr} — no daily averages", 'dark_gray');
                    continue;
                }

                $days++;

                foreach ($states as $type => $state) {
                    $result = $logModel->applyDayState(
                        $type,
                        (bool) $state['active'],
                        $dateStr,
                        $this->_extractPeakValue($state),
                        $this->_buildDescription($type, $state),
                        $logModel->getLatestByType($type)
                    );

                    if ($result['action'] === 'opened') {
                        CLI::write("[OPENED] {$type} ({$dateStr})", 'green');
                        $opened++;
                    } elseif ($result['action'] === 'closed') {
                        CLI::write("[CLOSED] {$type} ({$dateStr})", 'yellow');
                        $closed++;
                    }
                }
            }

            $summary = "system:detectAnomalies completed for {$days} day(s) up to {$yesterday->format('Y-m-d')}: {$opened} opened, {$closed} closed.";
            CLI::write($summary, 'white');
            log_message('info', $summary);
        } catch (\Exception $e) {
            $msg = 'system:detectAnomalies failed: ' . $e->getMessage();
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
            'freezing_rain'     => 'Freezing rain (precipitation with temperature between -4°C and +1°C)',
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
