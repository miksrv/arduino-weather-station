<?php

namespace App\Controllers;

use App\Entities\WeatherDataEntity;
use App\Libraries\OpenWeatherLibrary;
use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Exception;
use ReflectionException;

class System extends ResourceController {
    protected OpenWeatherLibrary $openWeather;
    protected RawWeatherDataModel $weatherDataModel;
    protected HourlyAveragesModel $hourlyAveragesModel;
    protected DailyAveragesModel $dailyAveragesModel;

    public function __construct()
    {
        $this->openWeather         = new OpenWeatherLibrary();
        $this->weatherDataModel    = new RawWeatherDataModel();
        $this->hourlyAveragesModel = new HourlyAveragesModel();
        $this->dailyAveragesModel  = new DailyAveragesModel();
    }

    /**
     * Get current weather data for given coordinates
     * @return ResponseInterface
     * @throws Exception
     */
    public function getCurrentWeather(): ResponseInterface
    {
        $data = $this->openWeather->getWeatherData();

        if ($data === false) {
            return $this->failServerError('Failed to retrieve weather data.');
        }

        try {
            if ($this->weatherDataModel->select('id')->where('date', $data['date'])->first()) {
                return $this->respond();
            }

            $weatherDataEntity = new WeatherDataEntity();
            $weatherDataEntity->fill($data);

            $this->weatherDataModel->save($weatherDataEntity);

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