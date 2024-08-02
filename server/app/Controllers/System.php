<?php

namespace App\Controllers;

use App\Entities\WeatherDataEntity;
use App\Entities\WeatherForecastEntity;
use App\Libraries\OpenWeatherAPILibrary;
use App\Libraries\VisualCrossingAPILibrary;
use App\Libraries\WeatherAPILibrary;
use App\Models\DailyAveragesModel;
use App\Models\ForecastWeatherDataModel;
use App\Models\HourlyAveragesModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Exception;
use ReflectionException;

class System extends ResourceController {
    protected OpenWeatherAPILibrary $openWeatherApi;
    protected WeatherAPILibrary $weatherApi;
    protected VisualCrossingAPILibrary $visualCrossingApi;
    protected RawWeatherDataModel $weatherDataModel;
    protected HourlyAveragesModel $hourlyAveragesModel;
    protected DailyAveragesModel $dailyAveragesModel;
    protected ForecastWeatherDataModel $forecastWeatherDataModel;

    public function __construct()
    {
        $this->openWeatherApi    = new OpenWeatherAPILibrary();
        $this->weatherApi        = new WeatherAPILibrary();
        $this->visualCrossingApi = new VisualCrossingAPILibrary();

        $this->weatherDataModel    = new RawWeatherDataModel();
        $this->hourlyAveragesModel = new HourlyAveragesModel();
        $this->dailyAveragesModel  = new DailyAveragesModel();

        $this->forecastWeatherDataModel = new ForecastWeatherDataModel();
    }

    /**
     * Get current weather data
     * @return ResponseInterface
     * @throws Exception
     */
    public function getCurrentWeather(): ResponseInterface
    {
        try {
            foreach ([$this->visualCrossingApi, $this->weatherApi, $this->openWeatherApi] as $weatherClient) {
                $data = $weatherClient->getWeatherData();

                if ($data === false) {
                    continue;
                }

                if ($this->weatherDataModel
                    ->select('id')
                    ->where('date', $data['date'])
                    ->where('source', $data['source'])
                    ->first()
                ) {
                    continue;
                }

                $weatherDataEntity = new WeatherDataEntity();
                $weatherDataEntity->fill($data);

                if (!$this->weatherDataModel->save($weatherDataEntity)) {
                    log_message('error', 'Failed to save weather data from ' . get_class($weatherClient) . ', errors: [' . print_r($this->weatherDataModel->errors(), true) . ']');
                }
            }

            // Calculate and save hourly averages
            $this->saveHourlyAverages();

            // Calculate and save daily averages
            $this->saveDailyAverages();

            return $this->respondCreated();
        } catch (Exception $e) {
            log_message('error', 'Error saving weather data: {e}', ['e' => $e->getMessage()]);
            return $this->failServerError('Failed to save weather data.');
        }
    }

    /**
     * Get forecast weather data
     * @return ResponseInterface
     * @throws Exception
     */
    public function getForecastWeather(): ResponseInterface
    {
        try {
            foreach ([/*$this->visualCrossingApi,*/ $this->weatherApi, $this->openWeatherApi] as $weatherClient) {
                $dataArray = $weatherClient->getForecastWeatherData();

                if ($dataArray === false) {
                    continue;
                }

                // Get the minimum and maximum forecast_time values from the data array
                $times = array_column($dataArray, 'forecast_time');
                $minTime = min($times);
                $maxTime = max($times);

                // Get all existing forecast_time records within the range
                $existingRecords = $this->forecastWeatherDataModel
                    ->select('id, forecast_time')
                    ->where('forecast_time >=', $minTime)
                    ->where('forecast_time <=', $maxTime)
                    ->findAll();

                // Convert existing records into an array for quick searching
                $existingMap = [];
                foreach ($existingRecords as $record) {
                    $existingMap[$record->forecast_time->toDateTimeString()] = $record->id;
                }

                // Split data into insert and update
                $insertData = [];
                $updateData = [];
                foreach ($dataArray as $data) {
                    $currentTimeString = $data['forecast_time']->toDateTimeString();

                    if (isset($existingMap[$currentTimeString])) {
                        $data['id']   = $existingMap[$currentTimeString];
                        $updateData[] = array_merge($data, ['forecast_time' => $currentTimeString]);
                    } else {
                        $insertData[] = $data;
                    }
                }

                // Perform a bulk insert
                if (!empty($insertData)) {
                    if (!$this->forecastWeatherDataModel->insertBatch($insertData)) {
                        log_message('error', 'Failed to insert forecast weather data from ' . get_class($weatherClient) . ', errors: [' . print_r($this->forecastWeatherDataModel->errors(), true) . ']');
                    }
                }

                // Perform a bulk update
                if (!empty($updateData)) {
                    if (!$this->forecastWeatherDataModel->updateBatch($updateData, 'id')) {
                        log_message('error', 'Failed to update forecast weather data from ' . get_class($weatherClient) . ', errors: [' . print_r($this->forecastWeatherDataModel->errors(), true) . ']');
                    }
                }
            }

            return $this->respondCreated();
        } catch (Exception $e) {
            log_message('error', 'Error saving forecast weather data: {e}', ['e' => $e->getMessage()]);
            return $this->failServerError('Failed to save forecast weather data.');
        }
    }

    /**
     * @throws ReflectionException
     */
    protected function saveHourlyAverages(): void
    {
        $hourlyData = $this->weatherDataModel->getHourlyAverages();

        foreach ($hourlyData as $data) {
            $existingRecordData  = $this->hourlyAveragesModel->select('id')->where('date', $data['date'])->first();
            $hourlyAverageEntity = new WeatherDataEntity();
            $hourlyAverageEntity->fill($data);

            if ($existingRecordData) {
                $hourlyAverageEntity->id = $existingRecordData->id;
            }

            $this->hourlyAveragesModel->save($hourlyAverageEntity);
        }
    }

    /**
     * @throws ReflectionException
     * @throws Exception
     */
    protected function saveDailyAverages(): void
    {
        $hourlyData = $this->weatherDataModel->getDailyAverages();

        foreach ($hourlyData as $data) {
            $existingRecordData = $this->dailyAveragesModel->select('id')->where('date', $data['date'])->first();
            $dailyAverageEntity = new WeatherDataEntity();
            $dailyAverageEntity->fill($data);

            if ($existingRecordData) {
                $dailyAverageEntity->id = $existingRecordData->id;
            }

            $this->dailyAveragesModel->save($dailyAverageEntity);
        }
    }
}