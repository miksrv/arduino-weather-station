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
 * Handles retrieval of hourly and daily forecast weather data.
 *
 * @package App\Controllers
 */
class Forecast extends ResourceController
{
    protected $format = 'json';

    protected ForecastWeatherDataModel $weatherForecastModel;

    /**
     * Initialises the forecast weather data model.
     */
    public function __construct()
    {
        $this->weatherForecastModel = new ForecastWeatherDataModel();
    }

    /**
     * Returns daily forecast weather data.
     *
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
        } catch (Exception $e) {
            log_message('error', 'Forecast::getForecastDaily - failed to get daily forecast data: ' . $e->getMessage());
            return $this->failServerError('An error occurred while retrieving daily forecast data.');
        }
    }

    /**
     * Returns hourly forecast weather data.
     *
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
        } catch (Exception $e) {
            log_message('error', 'Forecast::getForecastHourly - failed to get hourly forecast data: ' . $e->getMessage());
            return $this->failServerError('An error occurred while retrieving hourly forecast data.');
        }
    }
}
