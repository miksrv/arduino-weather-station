<?php

namespace App\Controllers;

use App\Entities\WeatherDataEntity;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\I18n\Time;
use Exception;

/**
 * Set current weather data from weather source
 *
 * This method receives weather data from a weather station via a POST request and saves it to the database.
 *
 * Example POST request:
 * POST https://SERVER/sensors?token=TOKEN
 *
 * Body parameters:
 * - t: Temperature value
 * - p: Pressure value
 * - h: Humidity value
 * - ws: Wind speed value
 * - wd: Wind direction value
 * - uv: UV index value
 *
 * @return ResponseInterface
 * @throws Exception
 */
class Sensors extends ResourceController {
    /**
     * Set current weather data from weather source
     * @return ResponseInterface
     * @throws Exception
     */
    public function setWeather(): ResponseInterface
    {
        $token = $this->request->getGet('token', FILTER_SANITIZE_SPECIAL_CHARS);

        if (!$token || $token !== getenv('app.arduino.token')) {
            log_message('warning', 'Invalid token');
            return $this->failUnauthorized('Invalid token');
        }

        $data = $this->request->getPost();
        $time = new \DateTime('now');

        if (empty($data)) {
            log_message('warning', 'Empty data');
            return $this->failValidationErrors('Empty data');
        }

        try {
            $parsedData = [
                'date'        => new \DateTime('now'),
                'temperature' => $data['t'] ?? null,
                'pressure'    => $data['p'] ?? null,
                'humidity'    => $data['h'] ?? null,
                'wind_speed'  => $data['ws'] ?? null,
                'wind_deg'    => $data['wd'] ?? null,
                'uv_index'    => $data['uv'] ?? null,
                'source'      => RawWeatherDataModel::SOURCE_CUSTOMSTATION
            ];

            $weatherDataModel  = new RawWeatherDataModel();
            $weatherDataEntity = new WeatherDataEntity();
            $weatherDataEntity->fill($parsedData);

            $weatherDataModel->save($weatherDataEntity);

            return $this->respondCreated();
        } catch (Exception $e) {
            log_message('error', 'Error saving weather data: {e}', ['e' => $e->getMessage()]);
            return $this->failServerError('Failed to save weather data: ' . $e->getMessage());
        }
    }
}
