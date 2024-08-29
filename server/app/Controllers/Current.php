<?php

namespace App\Controllers;

use App\Entities\WeatherData;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Exception;

class Current extends ResourceController {
    protected RawWeatherDataModel $weatherDataModel;

    public function __construct()
    {
        $this->weatherDataModel = new RawWeatherDataModel();
    }

    /**
     * Get current weather data
     * @return ResponseInterface
     * @throws Exception
     */
    public function getCurrentWeather(): ResponseInterface
    {
        // Get the current date and time
        $currentDateTime = new \DateTime();
        // Set the interval for data sampling (last 30 minutes)
        $intervalMinutes = 30;
        $startDateTime = clone $currentDateTime;
        $startDateTime->modify("-$intervalMinutes minutes");

        // Get data for the last 20 minutes
        $recentAverages = $this->weatherDataModel->getRecentAverages($startDateTime, $currentDateTime);

        // Get the latest data for fields that are updated less frequently
        $latestData = $this->weatherDataModel->getLatestWeatherData(['precipitation', 'sol_energy', 'sol_radiation']); // 'sol_energy', 'sol_radiation', 'uv_index',
        $latestDate = $this->weatherDataModel->getLastUpdateTime();

        return $this->respond(
            new WeatherData(array_merge(['date' => $latestDate], $recentAverages, $latestData))
        );
    }
}