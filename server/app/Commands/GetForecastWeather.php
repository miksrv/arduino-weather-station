<?php

namespace App\Commands;

use App\Libraries\WeatherProviderInterface;
use App\Models\ForecastWeatherDataModel;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Exception;

/**
 * Class GetForecastWeather
 *
 * Spark CLI command that fetches forecast weather data from all configured
 * external API sources and bulk-inserts or bulk-updates records in the
 * forecast_weather_data table, one row per source and forecast time.
 *
 * Usage:
 *   php spark system:getForecastWeather
 *
 * @package App\Commands
 */
class GetForecastWeather extends BaseCommand
{
    /** @var string Command group */
    protected $group = 'system';

    /** @var string Command name */
    protected $name = 'system:getForecastWeather';

    /** @var string Command description */
    protected $description = 'Fetches forecast weather from all external APIs and upserts records into forecast_weather_data.';

    /**
     * Iterates over each configured weather API client, determines which
     * forecast records need inserting versus updating based on source and forecast_time,
     * then executes bulk insert and update operations.
     *
     * @param array $params CLI parameters (unused)
     * @return void
     */
    public function run(array $params): void
    {
        try {
            $forecastWeatherDataModel = new ForecastWeatherDataModel();

            /** @var WeatherProviderInterface[] $clients */
            $clients = array_map(
                static fn (string $class): WeatherProviderInterface => new $class(),
                config('WeatherProviders')->providers
            );

            $totalInserted = 0;
            $totalUpdated  = 0;

            foreach ($clients as $weatherClient) {
                $sourceName = $weatherClient->getSourceName();

                try {
                    $dataArray = $weatherClient->getForecastWeatherData();
                } catch (\Throwable $e) {
                    log_message('error', 'getForecastWeatherData failed for ' . $sourceName . ': ' . $e->getMessage());
                    CLI::write('[ERROR] ' . $sourceName . ' — ' . $e->getMessage(), 'red');
                    continue;
                }

                if ($dataArray === false || empty($dataArray)) {
                    CLI::write('[SKIP]  ' . $sourceName . ' — no forecast data', 'yellow');
                    continue;
                }

                // Determine the time window covered by the returned data
                $times   = array_column($dataArray, 'forecast_time');
                $minTime = min($times);
                $maxTime = max($times);

                // Existing records of this source within that window, keyed by forecast_time.
                // The source must be part of the match: every provider forecasts the same hours,
                // and matching by time alone made each provider overwrite the previous one's rows
                $existingMap = $forecastWeatherDataModel->getExistingIds(
                    (string) ($dataArray[0]['source'] ?? $sourceName),
                    $minTime,
                    $maxTime
                );

                // Partition incoming data into inserts and updates
                $insertData = [];
                $updateData = [];

                foreach ($dataArray as $data) {
                    $currentTimeString = $data['forecast_time']->format('Y-m-d H:i:s');

                    if (isset($existingMap[$currentTimeString])) {
                        $data['id'] = $existingMap[$currentTimeString];
                        $updateData[] = $data;
                    } else {
                        $insertData[] = $data;
                    }
                }

                $sourceInserted = 0;
                $sourceUpdated  = 0;

                if (!empty($insertData)) {
                    $insertResult = $forecastWeatherDataModel->insertBatch($insertData);
                    if ($insertResult === false) {
                        log_message('error', 'Failed to insert forecast weather data from ' . get_class($weatherClient) . ', errors: ' . json_encode($forecastWeatherDataModel->errors()));
                        CLI::write('[ERROR] ' . $sourceName . ' — insert failed', 'red');
                    } else {
                        $sourceInserted = count($insertData);
                    }
                }

                if (!empty($updateData)) {
                    $updateResult = $forecastWeatherDataModel->updateBatch($updateData, 'id');
                    if ($updateResult === false) {
                        log_message('error', 'Failed to update forecast weather data from ' . get_class($weatherClient) . ', errors: ' . json_encode($forecastWeatherDataModel->errors()));
                        CLI::write('[ERROR] ' . $sourceName . ' — update failed', 'red');
                    } else {
                        $sourceUpdated = count($updateData);
                    }
                }

                if ($sourceInserted > 0 || $sourceUpdated > 0) {
                    CLI::write('[OK]    ' . $sourceName . ' — inserted: ' . $sourceInserted . ', updated: ' . $sourceUpdated, 'green');
                }

                $totalInserted += $sourceInserted;
                $totalUpdated  += $sourceUpdated;
            }

            $summary = 'system:getForecastWeather completed — total inserted: ' . $totalInserted . ', updated: ' . $totalUpdated . '.';
            CLI::write($summary, 'white');
            log_message('info', $summary);
        } catch (Exception $e) {
            $msg = 'system:getForecastWeather failed: ' . $e->getMessage();
            log_message('error', $msg);
            CLI::write('[ERROR] ' . $msg, 'red');
        }
    }
}
