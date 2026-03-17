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
 * the anomaly_log table. Intended to run daily via cron after calculateDailyAverages.
 *
 * Usage:
 *   php spark system:detectAnomalies
 *
 * @package App\Commands
 */
class DetectAnomalies extends BaseCommand
{
    /** @var string Command group */
    protected $group = 'system';

    /** @var string Command name */
    protected $name = 'system:detectAnomalies';

    /** @var string Command description */
    protected $description = 'Checks all meteorological anomaly conditions and updates the anomaly_log table.';

    /**
     * Executes the anomaly detection workflow:
     * 1. Fetch today's daily row and last 3 hourly rows.
     * 2. Run AnomalyDetector::checkAllAnomalies().
     * 3. Open new anomaly log entries for newly active conditions.
     * 4. Close open entries for conditions that are no longer active.
     * 5. Log a summary.
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
            $today       = new \DateTime('today');
            $todayStr    = $today->format('Y-m-d');

            // Fetch today's daily row
            $todayRow = $dailyModel
                ->where('date >=', $todayStr . ' 00:00:00')
                ->where('date <=', $todayStr . ' 23:59:59')
                ->first();

            $todayArr = $todayRow instanceof \CodeIgniter\Entity\Entity
                ? $todayRow->toRawArray()
                : (is_array($todayRow) ? $todayRow : (array) $todayRow);

            // Fetch all hourly rows for today (DESC)
            $recentHourly = $hourlyModel
                ->where('date >=', $todayStr . ' 00:00:00')
                ->where('date <=', $todayStr . ' 23:59:59')
                ->orderBy('date', 'DESC')
                ->findAll();

            $recentHourlyArr = array_map(
                fn($r) => $r instanceof \CodeIgniter\Entity\Entity
                    ? $r->toRawArray()
                    : (is_array($r) ? $r : (array) $r),
                $recentHourly
            );

            // Run all anomaly checks
            $anomalyStates = $detector->checkAllAnomalies($today, $recentHourlyArr, $todayArr);

            $opened = 0;
            $closed = 0;

            foreach ($anomalyStates as $type => $state) {
                $isActive  = (bool) $state['active'];
                $openRow   = $logModel->getOpenByType($type);
                $peakValue = $this->_extractPeakValue($state);

                if ($isActive && $openRow === null) {
                    // New episode — open with peak_value and description
                    $logModel->openAnomaly(
                        $type,
                        $todayStr,
                        $peakValue,
                        $this->_buildDescription($type, $state)
                    );
                    CLI::write("[OPENED] {$type}", 'green');
                    $opened++;
                } elseif ($isActive && $openRow !== null) {
                    // Ongoing episode — update peak if current value is higher
                    $logModel->updatePeakIfHigher((int) $openRow['id'], $peakValue);
                    CLI::write("[OK]     {$type} — still active", 'dark_gray');
                } elseif (!$isActive && $openRow !== null) {
                    // Episode ended — close it
                    $logModel->closeAnomaly((int) $openRow['id'], $todayStr);
                    CLI::write("[CLOSED] {$type}", 'yellow');
                    $closed++;
                } else {
                    CLI::write("[OK]     {$type} — not active", 'dark_gray');
                }
            }

            $summary = "system:detectAnomalies completed for {$todayStr}: {$opened} opened, {$closed} closed.";
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
