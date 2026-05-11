<?php

namespace App\Controllers;

use App\Entities\WeatherData;
use App\Models\ForecastWeatherDataModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use DateTime;
use Exception;

/**
 * Class Current
 *
 * Handles retrieval of current weather data in JSON and plain-text formats.
 *
 * @package App\Controllers
 */
class Current extends ResourceController
{
    protected $format = 'json';

    protected RawWeatherDataModel $weatherDataModel;

    /**
     * Initialises the raw weather data model.
     */
    public function __construct()
    {
        $this->weatherDataModel = new RawWeatherDataModel();
    }

    /**
     * Returns the latest weather observation as a JSON object.
     *
     * @return ResponseInterface
     * @throws Exception
     */
    public function getCurrentWeather(): ResponseInterface
    {
        $weatherData = $this->_getWeatherData();

        if ($weatherData instanceof ResponseInterface) {
            return $weatherData;
        }

        return $this->respond(new WeatherData($weatherData));
    }

    /**
     * Returns the latest weather observation formatted as plain text, with
     * an optional one-hour precipitation forecast appended.
     *
     * @return ResponseInterface
     * @throws Exception
     */
    public function getCurrentTextWeather(): ResponseInterface
    {
        $weatherForecastModel = new ForecastWeatherDataModel();

        $hourlyForecast = $weatherForecastModel->getHourlyAverages();
        $weatherData    = $this->_getWeatherData();

        if ($weatherData instanceof ResponseInterface) {
            return $weatherData;
        }

        // Convert the current date to a DateTime object
        $currentDateTime = new DateTime($weatherData['date']);

        // Find the first forecast entry whose date is greater than the current one
        $nextForecast = null;
        foreach ($hourlyForecast as $forecast) {
            $forecastDate = new DateTime($forecast['date']);
            if ($forecastDate > $currentDateTime) {
                $nextForecast = $forecast;
                break;
            }
        }

        // Only precipitation is considered for the one-hour forecast flag
        $forecast = isset($nextForecast['precipitation']) && (float) $nextForecast['precipitation'] > 0 ? -1 : 1;

        $formattedResponse = $this->_formatWeatherDataToText($weatherData, $forecast);

        return $this->response
            ->setBody($formattedResponse)
            ->setContentType('text/plain');
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Formats a weather data array into a key=value plain-text string.
     *
     * @param array    $data     Associative weather data array.
     * @param int|null $forecast Precipitation forecast flag (1 = clear, -1 = rain, null = omit).
     * @return string
     */
    private function _formatWeatherDataToText(array $data, ?int $forecast = null): string
    {
        $formattedDate = (new DateTime($data['date']))->format('Y/m/d H:i:s');
        $formattedData = "dataGMTTime={$formattedDate}" . PHP_EOL;

        foreach ($data as $key => $item) {
            if ($key === 'date') {
                continue;
            }

            $formattedData .= "{$key}={$item}" . PHP_EOL;
        }

        if ($forecast !== null) {
            $formattedData .= "forecast={$forecast}" . PHP_EOL;
        }

        return $formattedData;
    }

    /**
     * Fetches the current weather data row from the database.
     *
     * @return array|ResponseInterface Array on success; error response on failure.
     */
    private function _getWeatherData(): array|ResponseInterface
    {
        try {
            return $this->weatherDataModel->getCurrentActualWeatherData();
        } catch (Exception $e) {
            log_message('error', 'Current::_getWeatherData - failed to get current weather data: ' . $e->getMessage());
            return $this->failServerError('An error occurred while retrieving current weather data.');
        }
    }
}
