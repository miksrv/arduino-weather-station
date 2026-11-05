<?php

namespace App\Commands;

use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use DateTimeImmutable;
use DateTimeZone;
use Throwable;

/**
 * Class RebuildAverages
 *
 * Spark CLI command that recalculates hourly_averages from raw_weather_data and
 * then daily_averages from hourly_averages, month by month, with the current
 * aggregation rules. Run it once after the aggregation rules change (e.g. daily
 * precipitation becoming a daily total instead of an hourly mean).
 *
 * Only the hours and days that have source data are replaced; aggregate rows
 * without it are left as they are.
 *
 * Usage:
 *   php spark system:rebuildAverages
 *   php spark system:rebuildAverages --since 2024-01-01
 *
 * @package App\Commands
 */
class RebuildAverages extends BaseCommand
{
    /** @var string Command group */
    protected $group = 'system';

    /** @var string Command name */
    protected $name = 'system:rebuildAverages';

    /** @var string Command description */
    protected $description = 'Recalculates hourly_averages and daily_averages from raw_weather_data, month by month.';

    /** @var array<string, string> Command options */
    protected $options = [
        '--since' => 'First month to rebuild (Y-m-d); default: the first raw_weather_data row.',
    ];

    /** @var string[] Cache key patterns of the controllers that serve aggregated data */
    private const CACHE_PATTERNS = ['history_*', 'heatmap_*', 'precipitation_*'];

    /** @var int Rows per insert batch */
    private const BATCH_SIZE = 500;

    /**
     * Rebuilds the aggregates of every month from --since (or the first raw row) up to now.
     *
     * @param array $params CLI parameters (unused; options read via CLI::getOption)
     * @return void
     */
    public function run(array $params): void
    {
        try {
            $rawModel    = new RawWeatherDataModel();
            $hourlyModel = new HourlyAveragesModel();
            $dailyModel  = new DailyAveragesModel();
            $utc         = new DateTimeZone('UTC');

            $since = CLI::getOption('since') ?? $rawModel->asArray()->selectMin('date')->first()['date'] ?? null;

            if (empty($since)) {
                CLI::write('[SKIP]  raw_weather_data is empty.', 'yellow');
                return;
            }

            $month = (new DateTimeImmutable((string) $since, $utc))->modify('first day of this month')->setTime(0, 0);
            $now   = new DateTimeImmutable('now', $utc);

            while ($month <= $now) {
                $next  = $month->modify('+1 month');
                $from  = $month->format('Y-m-d H:i:s');
                $until = $next->format('Y-m-d H:i:s');

                $db = $hourlyModel->db;
                $db->transStart();
                $hours = $this->_replace($hourlyModel, $rawModel->getHourlyAverages($from, $until));
                $days  = $this->_replace($dailyModel, $hourlyModel->getDailyAverages($from, $until));
                $db->transComplete();

                if ($db->transStatus() === false) {
                    log_message('error', 'system:rebuildAverages failed for ' . $month->format('Y-m'));
                    CLI::write('[ERROR] ' . $month->format('Y-m') . ' — transaction failed', 'red');
                } else {
                    CLI::write(sprintf('[OK]    %s — %d hours, %d days', $month->format('Y-m'), $hours, $days), 'green');
                }

                $month = $next;
            }

            // History, heatmap and precipitation responses are cached; drop them so rebuilt numbers show up
            foreach (self::CACHE_PATTERNS as $pattern) {
                cache()->deleteMatching($pattern);
            }
            CLI::write('[OK]    Response caches cleared.', 'green');

            CLI::write('system:rebuildAverages completed.', 'white');
            log_message('info', 'system:rebuildAverages completed.');
        } catch (Throwable $e) {
            $msg = 'system:rebuildAverages failed: ' . $e->getMessage();
            log_message('error', $msg);
            CLI::write('[ERROR] ' . $msg, 'red');
        }
    }

    /**
     * Replaces the aggregate rows of the given dates with the recalculated ones.
     *
     * @param HourlyAveragesModel|DailyAveragesModel $model Target model
     * @param array<int, array<string, mixed>>       $rows  Recalculated rows (with `date`)
     * @return int Number of rows written.
     */
    private function _replace(HourlyAveragesModel|DailyAveragesModel $model, array $rows): int
    {
        if ($rows === []) {
            return 0;
        }

        $model->whereIn('date', array_column($rows, 'date'))->delete();

        foreach (array_chunk($rows, self::BATCH_SIZE) as $chunk) {
            $model->skipValidation(true)->insertBatch(
                array_map(static fn (array $row): array => array_diff_key($row, ['hour' => true, 'day' => true]), $chunk)
            );
        }

        return count($rows);
    }
}
