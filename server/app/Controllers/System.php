<?php

namespace App\Controllers;

use App\Libraries\OpenWeatherLibrary;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class System extends ResourceController {
    protected OpenWeatherLibrary $openWeather;

    public function __construct()
    {
        $this->openWeather = new OpenWeatherLibrary();
    }

    /**
     * Get current weather data for given coordinates
     * @return ResponseInterface
     */
    public function getCurrentWeather(): ResponseInterface
    {
        $data = $this->openWeather->getWeatherData();

        if ($data === false) {
            return $this->failServerError('Failed to retrieve weather data.');
        }

        return $this->respond($data);
    }

    /**
     * Получить текущие погодные данные для заданных координат
     * @return ResponseInterface
     */
    public function getHistoricalWeather(): ResponseInterface
    {
        $data = $this->openWeather->getWeatherData();

        if ($data === false) {
            return $this->failServerError('Failed to retrieve weather data.');
        }

        return $this->respond($data);
    }
}