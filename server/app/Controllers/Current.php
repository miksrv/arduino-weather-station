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
        // Get data for the last 20 minutes
        $recentAverages = $this->weatherDataModel->getRecentAverages();

        // Get the latest data for fields that are updated less frequently
        $latestData = $this->weatherDataModel->getLatestWeatherData(['precipitation']); // 'sol_energy', 'sol_radiation', 'uv_index',

        return $this->respond([
            'data'   => new WeatherData(array_merge($recentAverages, $latestData)),
            'update' => $this->weatherDataModel->getLastUpdateTime()
        ]);
    }
}