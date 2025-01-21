<?php

namespace App\Controllers;

use App\Entities\WeatherData;
use App\Models\ForecastWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Exception;

/**
 * Class Forecast
 *
 * This class handles the retrieval of forecast weather data, both daily and hourly.
 *
 * @package App\Controllers
 *
 * Public Methods:
 * - getForecastDaily(): Retrieves and returns daily forecast weather data.
 * - getForecastHourly(): Retrieves and returns hourly forecast weather data.
 *
 * Usage:
 * $forecast = new Forecast();
 * $forecast->getForecastDaily();
 * $forecast->getForecastHourly();
 */
class Forecast extends ResourceController {
    protected ForecastWeatherDataModel $weatherForecastModel;

    public function __construct()
    {
        $this->weatherForecastModel = new ForecastWeatherDataModel();
    }

    /**
     * Get forecast weather data daily
     * @return ResponseInterface
     * @throws Exception
     */
    public function getForecastDaily(): ResponseInterface
    {
        try {
            $dailyForecast = $this->weatherForecastModel->getDailyAverages();

            if (empty($dailyForecast)) {
                return $this->failNotFound('No daily forecast data found.');
            }

            $result = [];

            foreach ($dailyForecast as $data) {
                $result[] = new WeatherData($data);
            }

            return $this->respond($result);
        } catch (\Exception $e) {
            log_message('error', 'Failed to get forecast weather data daily , errors: ' . $e);
            return $this->failServerError('An error occurred while retrieving daily forecast data.');
        }
    }

    /**
     * Get forecast weather data hourly
     * @return ResponseInterface
     * @throws Exception
     */
    public function getForecastHourly(): ResponseInterface
    {
        try {
            $hourlyForecast = $this->weatherForecastModel->getHourlyAverages();

            if (empty($hourlyForecast)) {
                return $this->failNotFound('No hourly forecast data found.');
            }

            $result = [];

            foreach ($hourlyForecast as $data) {
                $result[] = new WeatherData($data);
            }

            return $this->respond($result);
        } catch (\Exception $e) {
            log_message('error', 'Failed to get forecast weather data hourly , errors: ' . $e);
            return $this->failServerError('An error occurred while retrieving hourly forecast data.');
        }
    }
}
