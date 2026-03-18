<?php

namespace App\Commands;

use App\Libraries\OpenWeatherAPILibrary;
use App\Libraries\VisualCrossingAPILibrary;
use App\Libraries\WeatherAPILibrary;
use App\Models\ForecastWeatherDataModel;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Exception;

/**
 * Class GetForecastWeather
 *
 * Spark CLI command that fetches forecast weather data from all configured
 * external API sources (OpenWeatherMap, WeatherAPI, VisualCrossing) and
 * bulk-inserts or bulk-updates records in the forecast_weather_data table.
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
     * forecast records need inserting versus updating based on forecast_time,
     * then executes bulk insert and update operations.
     *
     * @param array $params CLI parameters (unused)
     * @return void
     */
    public function run(array $params): void
    {
        try {
            $forecastWeatherDataModel = new ForecastWeatherDataModel();

            $clients = [
                new OpenWeatherAPILibrary(),
                new WeatherAPILibrary(),
                new VisualCrossingAPILibrary(),
            ];

            $totalInserted = 0;
            $totalUpdated  = 0;

            foreach ($clients as $weatherClient) {
                $sourceName = $this->_shortName($weatherClient);
                $dataArray  = $weatherClient->getForecastWeatherData();

                if ($dataArray === false) {
                    CLI::write('[SKIP]  ' . $sourceName . ' — no forecast data', 'yellow');
                    continue;
                }

                // Determine the time window covered by the returned data
                $times   = array_column($dataArray, 'forecast_time');
                $minTime = min($times);
                $maxTime = max($times);

                // Load all existing records within that window
                $existingRecords = $forecastWeatherDataModel
                    ->select('id, forecast_time')
                    ->where('forecast_time >=', $minTime)
                    ->where('forecast_time <=', $maxTime)
                    ->findAll();

                // Index existing records by their forecast_time string for O(1) lookup
                $existingMap = [];
                foreach ($existingRecords as $record) {
                    $existingMap[$record->forecast_time->toDateTimeString()] = $record->id;
                }

                // Partition incoming data into inserts and updates
                $insertData = [];
                $updateData = [];

                foreach ($dataArray as $data) {
                    $currentTimeString = $data['forecast_time']->toDateTimeString();

                    if (isset($existingMap[$currentTimeString])) {
                        $data['id']   = $existingMap[$currentTimeString];
                        $updateData[] = array_merge($data, ['forecast_time' => $currentTimeString]);
                    } else {
                        $insertData[] = array_merge($data, ['forecast_time' => $currentTimeString]);
                    }
                }

                $sourceInserted = 0;
                $sourceUpdated  = 0;

                if (!empty($insertData)) {
                    if (!$forecastWeatherDataModel->insertBatch($insertData)) {
                        log_message('error', 'Failed to insert forecast weather data from ' . get_class($weatherClient) . ', errors: [' . print_r($forecastWeatherDataModel->errors(), true) . ']');
                        CLI::write('[ERROR] ' . $sourceName . ' — insert failed', 'red');
                    } else {
                        $sourceInserted = count($insertData);
                    }
                }

                if (!empty($updateData)) {
                    if (!$forecastWeatherDataModel->updateBatch($updateData, 'id')) {
                        log_message('error', 'Failed to update forecast weather data from ' . get_class($weatherClient) . ', errors: [' . print_r($forecastWeatherDataModel->errors(), true) . ']');
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

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Returns the short, human-readable API source name for CLI output.
     * Strips the 'APILibrary' suffix from the class short name.
     *
     * @param object $client An instantiated API library object
     * @return string
     */
    private function _shortName(object $client): string
    {
        return str_replace('APILibrary', '', (new \ReflectionClass($client))->getShortName());
    }
}
