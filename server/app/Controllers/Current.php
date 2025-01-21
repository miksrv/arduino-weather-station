<?php

namespace App\Controllers;

use App\Entities\WeatherData;
use App\Models\ForecastWeatherDataModel;
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
        $weatherData = $this->_getWeatherData();

        return $this->respond(new WeatherData($weatherData));
    }

    /**
     * Get current weather data
     * @return ResponseInterface
     * @throws Exception
     */
    public function getCurrentTextWeather(): ResponseInterface
    {
        $weatherForecastModel = new ForecastWeatherDataModel();

        $hourlyForecast = $weatherForecastModel->getHourlyAverages();
        $weatherData    = $this->_getWeatherData();

        // Преобразуем текущую дату в объект DateTime
        $currentDateTime = new \DateTime($weatherData['date']);

        // Находим первый объект прогноза, у которого дата больше текущей
        $nextForecast = null;
        foreach ($hourlyForecast as $forecast) {
            $forecastDate = new \DateTime($forecast['date']);
            if ($forecastDate > $currentDateTime) {
                $nextForecast = $forecast;
                break;
            }
        }

        // For now, the forecast for an hour ahead only takes into account precipitation, if you need to expand
        // then you can include other parameters here
        $forecast = isset($nextForecast['precipitation']) && (float) $nextForecast['precipitation'] > 0 ? -1 : 1;

        $formattedResponse = $this->_formatWeatherDataToText($weatherData, $forecast);

        return $this
            ->respond()
            ->setBody($formattedResponse)
            ->setContentType('text/plain');
    }

    /**
     * Formats weather data into text
     * @param array $data
     * @param number $forecast
     * @return string
     */
    private function _formatWeatherDataToText(array $data, string $forecast = null): string
    {
        $formattedDate = (new \DateTime($data['date']))->format('Y/m/d H:i:s');
        $formattedData = "dataGMTTime={$formattedDate}" . PHP_EOL;

        foreach ($data as $key => $item) {
            if ($key === 'date') {
                continue;
            }

            $formattedData .= "{$key}={$item}" . PHP_EOL;
        }

        if ($forecast) {
            $formattedData .= "forecast={$forecast}" . PHP_EOL;
        }

        return $formattedData;
    }

    /**
     * Gets the current weather data and returns it as an array of values
     * @return array
     */
    private function _getWeatherData(): array
    {
        try {
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

            return array_merge(['date' => $latestDate], $recentAverages, $latestData);
        } catch (\Exception $e) {
            log_message('error', 'Failed to get current weather data, errors: ' . $e);
            return $this->failServerError('An error occurred while retrieving current weather data.');
        }
    }
}
