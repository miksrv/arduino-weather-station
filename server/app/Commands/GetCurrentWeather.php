<?php

namespace App\Commands;

use App\Entities\WeatherDataEntity;
use App\Libraries\OpenWeatherAPILibrary;
use App\Libraries\VisualCrossingAPILibrary;
use App\Libraries\WeatherAPILibrary;
use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Exception;
use ReflectionException;

/**
 * Class GetCurrentWeather
 *
 * Spark CLI command that fetches current weather observations from all configured
 * external API sources (VisualCrossing, WeatherAPI, OpenWeatherMap), persists any
 * new records to raw_weather_data, then recalculates and upserts hourly and daily
 * averages.
 *
 * Usage:
 *   php spark system:getCurrentWeather
 *
 * @package App\Commands
 */
class GetCurrentWeather extends BaseCommand
{
    /** @var string Command group */
    protected $group = 'system';

    /** @var string Command name */
    protected $name = 'system:getCurrentWeather';

    /** @var string Command description */
    protected $description = 'Fetches current weather from all external APIs and recalculates hourly/daily averages.';

    /**
     * Iterates over each configured weather API client, inserts new observations,
     * then delegates to private helpers to upsert hourly and daily averages.
     *
     * @param array $params CLI parameters (unused)
     * @return void
     */
    public function run(array $params): void
    {
        try {
            $weatherDataModel    = new RawWeatherDataModel();
            $hourlyAveragesModel = new HourlyAveragesModel();
            $dailyAveragesModel  = new DailyAveragesModel();

            $clients = [
                new VisualCrossingAPILibrary(),
                new WeatherAPILibrary(),
                new OpenWeatherAPILibrary(),
            ];

            foreach ($clients as $weatherClient) {
                $sourceName = $this->_shortName($weatherClient);
                $data       = $weatherClient->getWeatherData();

                if ($data === false) {
                    CLI::write('[SKIP]  ' . $sourceName . ' — no data', 'yellow');
                    continue;
                }

                $existing = $weatherDataModel
                    ->select('id')
                    ->where('date', $data['date'])
                    ->where('source', $data['source'])
                    ->first();

                if ($existing) {
                    CLI::write('[SKIP]  ' . $sourceName . ' — already saved for ' . $data['date'], 'dark_gray');
                    continue;
                }

                $weatherDataEntity = new WeatherDataEntity();
                $weatherDataEntity->fill($data);

                if (!$weatherDataModel->save($weatherDataEntity)) {
                    log_message('error', 'Failed to save weather data from ' . get_class($weatherClient) . ', errors: ' . json_encode($weatherDataModel->errors()));
                    CLI::write('[ERROR] ' . $sourceName . ' — save failed', 'red');
                } else {
                    CLI::write('[OK]    ' . $sourceName . ' — saved for ' . $data['date'], 'green');
                }
            }

            $hourlySaved = $this->_saveHourlyAverages($weatherDataModel, $hourlyAveragesModel);
            $dailySaved  = $this->_saveDailyAverages($weatherDataModel, $dailyAveragesModel);

            CLI::write('Hourly averages: ' . $hourlySaved . ' records saved.', 'white');
            CLI::write('Daily averages: ' . $dailySaved . ' records saved.', 'white');

            $summary = 'system:getCurrentWeather completed.';
            CLI::write($summary, 'white');
            log_message('info', $summary);
        } catch (Exception $e) {
            $msg = 'system:getCurrentWeather failed: ' . $e->getMessage();
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

    /**
     * Fetches hourly averages from raw_weather_data and upserts each row into
     * hourly_averages. Returns the number of records processed.
     *
     * @param RawWeatherDataModel  $weatherDataModel    Source model
     * @param HourlyAveragesModel  $hourlyAveragesModel Target model
     * @return int
     * @throws ReflectionException
     */
    private function _saveHourlyAverages(
        RawWeatherDataModel $weatherDataModel,
        HourlyAveragesModel $hourlyAveragesModel
    ): int {
        $hourlyData = $weatherDataModel->getHourlyAverages();
        $count      = 0;

        foreach ($hourlyData as $data) {
            $existingRecordData  = $hourlyAveragesModel->select('id')->where('date', $data['date'])->first();
            $hourlyAverageEntity = new WeatherDataEntity();
            $hourlyAverageEntity->fill($data);

            if ($existingRecordData) {
                $hourlyAverageEntity->id = $existingRecordData->id;
            }

            $hourlyAveragesModel->save($hourlyAverageEntity);
            $count++;
        }

        return $count;
    }

    /**
     * Fetches daily averages from raw_weather_data and upserts each row into
     * daily_averages. Returns the number of records processed.
     *
     * @param RawWeatherDataModel $weatherDataModel   Source model
     * @param DailyAveragesModel  $dailyAveragesModel Target model
     * @return int
     * @throws ReflectionException
     * @throws Exception
     */
    private function _saveDailyAverages(
        RawWeatherDataModel $weatherDataModel,
        DailyAveragesModel  $dailyAveragesModel
    ): int {
        $dailyData = $weatherDataModel->getDailyAverages();
        $count     = 0;

        foreach ($dailyData as $data) {
            $existingRecordData = $dailyAveragesModel->select('id')->where('date', $data['date'])->first();
            $dailyAverageEntity = new WeatherDataEntity();
            $dailyAverageEntity->fill($data);

            if ($existingRecordData) {
                $dailyAverageEntity->id = $existingRecordData->id;
            }

            $dailyAveragesModel->save($dailyAverageEntity);
            $count++;
        }

        return $count;
    }
}
