<?php

namespace App\Database\Seeds;

use App\Commands\BackfillAnomalyLog;
use App\Libraries\AnomalyDetector;
use App\Libraries\DevWeatherGenerator;
use App\Models\AnomalyLogModel;
use App\Models\DailyAveragesModel;
use App\Models\ForecastWeatherDataModel;
use App\Models\HourlyAveragesModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\CLI\CLI;
use CodeIgniter\Database\Seeder;
use CodeIgniter\Entity\Entity;
use Throwable;

/**
 * Class DevWeatherSeeder
 *
 * Local-development seeder: fills the gap between the newest raw_weather_data row and "now"
 * with synthetic but plausible Orenburg weather, so every "last 24 h / today / 7 days" widget
 * has data. Idempotent: it continues from MAX(date), so re-running only fills the new gap.
 *
 * Generates raw rows (CustomStation every 5 min plus the external sources at their cron
 * cadence), recalculates hourly/daily averages via RawWeatherDataModel (same methods as
 * system:getCurrentWeather), regenerates the forecast, runs the anomaly detector over the
 * new days and clears the cache. Refuses to run in production.
 *
 * Usage:
 *   php spark db:seed DevWeatherSeeder
 *
 * @package App\Database\Seeds
 */
class DevWeatherSeeder extends Seeder
{
    /** @var int Rows per insertBatch call */
    private const BATCH_SIZE = 1000;

    /** @var int Fallback history length when raw_weather_data is empty */
    private const FALLBACK_DAYS = 400;

    /** @var int Forecast horizon in days */
    private const FORECAST_DAYS = 7;

    /**
     * Cadence of each source: [step seconds, offset seconds into the step].
     *
     * @var array<string, array{0: int, 1: int}>
     */
    private const CADENCE = [
        'CustomStation'  => [300, 0],
        'OpenWeatherMap' => [1800, 14 * 60],
        'WeatherAPI'     => [3600, 0],
        'VisualCrossing' => [3600, 30 * 60],
        'OpenMeteo'      => [3600, 0],
    ];

    /**
     * Seeds all development weather tables.
     *
     * @return void
     */
    public function run(): void
    {
        if (ENVIRONMENT === 'production') {
            log_message('error', 'DevWeatherSeeder - refused to run in production.');
            CLI::write('[ERROR] DevWeatherSeeder must not run in production.', 'red');

            return;
        }

        try {
            $now      = time();
            $rawModel = new RawWeatherDataModel();
            $maxDate  = $rawModel->asArray()->select('MAX(date) AS max_date')->first()['max_date'] ?? null;
            $start    = $maxDate !== null ? (int) strtotime($maxDate . ' UTC') : $now - self::FALLBACK_DAYS * 86400;

            if ($start >= $now) {
                CLI::write('[INFO] raw_weather_data is already up to date.', 'yellow');
            } else {
                CLI::write('[INFO] Filling gap ' . gmdate('Y-m-d H:i', $start) . ' -> ' . gmdate('Y-m-d H:i', $now) . ' UTC', 'cyan');
                $this->_seedRaw($rawModel, $start, $now);
                $this->_recalculateAverages($rawModel, $start);
                $this->_seedAnomalies($start);
            }

            $this->_seedForecast($now);

            cache()->clean();
            CLI::write('[OK] Cache cleared. DevWeatherSeeder completed.', 'green');
        } catch (Throwable $e) {
            log_message('error', 'DevWeatherSeeder failed: ' . $e->getMessage());
            CLI::write('[ERROR] DevWeatherSeeder failed: ' . $e->getMessage(), 'red');
        }
    }

    /**
     * Generates and inserts raw observations for every source between $start and $now.
     *
     * @param RawWeatherDataModel $model Raw data model
     * @param int                 $start Global gap start (unix seconds, exclusive)
     * @param int                 $now   Gap end (unix seconds, inclusive)
     * @return void
     */
    private function _seedRaw(RawWeatherDataModel $model, int $start, int $now): void
    {
        foreach (self::CADENCE as $source => [$step, $offset]) {
            // Never regenerate rows a source already has: begin after its own newest row.
            $sourceMax   = $model->asArray()->select('MAX(date) AS max_date')->where('source', $source)->first()['max_date'] ?? null;
            $sourceStart = max($start, $sourceMax !== null ? (int) strtotime($sourceMax . ' UTC') : 0);
            $slots       = DevWeatherGenerator::slots($sourceStart, $now, $step, $offset);
            $total       = 0;

            foreach (array_chunk($slots, self::BATCH_SIZE) as $chunk) {
                $rows = array_map(
                    static fn (int $ts): array => $source === 'CustomStation'
                        ? DevWeatherGenerator::customStationRow($ts)
                        : DevWeatherGenerator::externalRow($source, $ts + (int) abs(DevWeatherGenerator::hash(60, $ts) * 20)),
                    $chunk
                );

                $model->skipValidation(true)->insertBatch($this->_normalise($rows));
                $total += count($rows);
            }

            CLI::write(sprintf('[RAW]  %-15s %6d rows', $source, $total), 'white');
        }
    }

    /**
     * Rebuilds hourly_averages and daily_averages for the generated period using the same
     * RawWeatherDataModel aggregation methods as system:getCurrentWeather.
     *
     * @param RawWeatherDataModel $rawModel Raw data model
     * @param int                 $start    Gap start (unix seconds)
     * @return void
     */
    private function _recalculateAverages(RawWeatherDataModel $rawModel, int $start): void
    {
        $hourlyModel = new HourlyAveragesModel();
        $dailyModel  = new DailyAveragesModel();
        $sinceHour   = gmdate('Y-m-d H:00:00', $start);
        $sinceDay    = gmdate('Y-m-d 00:00:00', $start);

        $hourly = $rawModel->getHourlyAverages(true, $sinceHour);
        $hourlyModel->where('date >=', $sinceHour)->delete();
        $this->_insertAverages($hourlyModel, $hourly);
        CLI::write('[AVG]  hourly_averages ' . count($hourly) . ' rows', 'white');

        $daily = $rawModel->getDailyAverages(true, $sinceDay);
        $dailyModel->where('date >=', $sinceDay)->delete();
        $this->_insertAverages($dailyModel, $daily);
        CLI::write('[AVG]  daily_averages  ' . count($daily) . ' rows', 'white');
    }

    /**
     * Batch-inserts aggregate rows, dropping the helper `hour`/`day` group columns.
     *
     * @param HourlyAveragesModel|DailyAveragesModel $model Target model
     * @param array                                  $rows  Rows from RawWeatherDataModel::get*Averages()
     * @return void
     */
    private function _insertAverages(HourlyAveragesModel|DailyAveragesModel $model, array $rows): void
    {
        $allowed = array_flip(['date', 'temperature', 'feels_like', 'pressure', 'humidity', 'dew_point', 'uv_index',
            'sol_energy', 'sol_radiation', 'precipitation', 'clouds', 'visibility', 'wind_speed', 'wind_deg',
            'wind_gust', 'weather_id', 'pm2_5', 'pm10', 'co', 'no2', 'so2', 'o3']);

        foreach (array_chunk($rows, self::BATCH_SIZE) as $chunk) {
            $model->skipValidation(true)->insertBatch(
                array_map(static fn (array $row): array => array_intersect_key($row, $allowed), $chunk)
            );
        }
    }

    /**
     * Replaces forecast rows from today 00:00 UTC onward with a fresh hourly forecast
     * (OpenMeteo + WeatherAPI) covering today and the next FORECAST_DAYS days.
     *
     * @param int $now Current unix time
     * @return void
     */
    private function _seedForecast(int $now): void
    {
        $model    = new ForecastWeatherDataModel();
        $dayStart = (int) strtotime(gmdate('Y-m-d', $now) . ' 00:00:00 UTC');
        $end      = $dayStart + (self::FORECAST_DAYS + 1) * 86400 - 3600;
        $rows     = [];

        $model->where('forecast_time >=', gmdate('Y-m-d H:i:s', $dayStart))->delete();

        foreach (['OpenMeteo', 'WeatherAPI'] as $source) {
            for ($ts = $dayStart; $ts <= $end; $ts += 3600) {
                $rows[] = DevWeatherGenerator::forecastRow($source, $ts, $now);
            }
        }

        foreach (array_chunk($rows, self::BATCH_SIZE) as $chunk) {
            $model->skipValidation(true)->insertBatch($chunk);
        }

        CLI::write('[FCST] forecast_weather_data ' . count($rows) . ' rows (to ' . gmdate('Y-m-d', $end) . ')', 'white');
    }

    /**
     * Runs the anomaly detector over every day of the new period (same logic as
     * system:backfillAnomalyLog, whose helpers are reused) and updates anomaly_log.
     *
     * @param int $start Gap start (unix seconds)
     * @return void
     */
    private function _seedAnomalies(int $start): void
    {
        $dailyModel  = new DailyAveragesModel();
        $hourlyModel = new HourlyAveragesModel();
        $detector    = new AnomalyDetector($dailyModel, $hourlyModel);
        $logModel    = new AnomalyLogModel();
        $backfill    = new BackfillAnomalyLog(service('logger'), service('commands'));
        $peakOf      = new \ReflectionMethod($backfill, '_extractPeakValue');
        $describe    = new \ReflectionMethod($backfill, '_buildDescription');
        $sinceDay    = gmdate('Y-m-d', $start);

        // Drop episodes that began inside the regenerated period so a re-run cannot duplicate them.
        $logModel->where('start_date >=', $sinceDay)->delete();

        $open = [];

        foreach ($logModel->getActiveAnomalies() as $row) {
            $open[(string) $row['type']] = ['id' => (int) $row['id'], 'peak' => $row['peak_value'] !== null ? (float) $row['peak_value'] : null];
        }

        $days = $dailyModel->where('date >=', $sinceDay . ' 00:00:00')->orderBy('date', 'ASC')->findAll();
        $opened = 0;
        $closed = 0;

        foreach ($days as $dailyRow) {
            $rowArr  = $dailyRow instanceof Entity ? $dailyRow->toRawArray() : (array) $dailyRow;
            $dateStr = substr((string) $rowArr['date'], 0, 10);
            $hourly  = array_map(
                static fn ($r): array => $r instanceof Entity ? $r->toRawArray() : (array) $r,
                $hourlyModel->where('date >=', $dateStr . ' 00:00:00')->where('date <=', $dateStr . ' 23:59:59')->orderBy('date', 'DESC')->findAll()
            );

            foreach ($detector->checkAllAnomalies(new \DateTime($dateStr), $hourly, $rowArr) as $type => $state) {
                $isActive = (bool) $state['active'];
                $isOpen   = isset($open[$type]);
                $peak     = $peakOf->invoke($backfill, $state);

                if ($isActive && !$isOpen) {
                    $open[$type] = ['id' => $logModel->openAnomaly($type, $dateStr, $peak, $describe->invoke($backfill, $type, $state)), 'peak' => $peak];
                    $opened++;
                } elseif ($isActive && $peak !== null && abs($peak) > abs((float) $open[$type]['peak'])) {
                    $logModel->updatePeakIfHigher($open[$type]['id'], $peak);
                    $open[$type]['peak'] = $peak;
                } elseif (!$isActive && $isOpen) {
                    $logModel->closeAnomaly($open[$type]['id'], $dateStr);
                    unset($open[$type]);
                    $closed++;
                }
            }
        }

        CLI::write(sprintf('[ANOM] %d days scanned, %d opened, %d closed', count($days), $opened, $closed), 'white');
    }

    /**
     * Gives every row the same column set (insertBatch requires uniform keys).
     *
     * @param array $rows Raw rows with possibly differing keys
     * @return array
     */
    private function _normalise(array $rows): array
    {
        $keys = [];

        foreach ($rows as $row) {
            $keys += array_fill_keys(array_keys($row), null);
        }

        return array_map(static fn (array $row): array => array_merge($keys, $row), $rows);
    }
}
