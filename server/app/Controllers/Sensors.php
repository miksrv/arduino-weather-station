<?php

namespace App\Controllers;

use App\Entities\WeatherDataEntity;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use DateTime;
use Exception;

/**
 * Class Sensors
 *
 * Receives and persists sensor readings posted by the Arduino/ESP32 weather station.
 *
 * @package App\Controllers
 */
class Sensors extends ResourceController
{
    protected $format = 'json';

    protected RawWeatherDataModel $weatherDataModel;
    protected WeatherDataEntity   $weatherDataEntity;

    /**
     * Initialises the raw weather data model and entity.
     */
    public function __construct()
    {
        $this->weatherDataModel  = new RawWeatherDataModel();
        $this->weatherDataEntity = new WeatherDataEntity();
    }

    /**
     * Validates the Arduino token, parses the POST payload, and persists the reading.
     *
     * Expected query parameter:
     *   - token (required): shared secret configured via app.arduino.token env variable
     *
     * Expected POST body fields:
     *   - t  (float): temperature
     *   - p  (float): pressure
     *   - h  (float): humidity
     *   - ws (float): wind speed
     *   - wd (int):   wind direction in degrees
     *   - uv (float): UV index
     *
     * @return ResponseInterface
     * @throws Exception
     */
    public function setWeather(): ResponseInterface
    {
        $token       = $this->request->getGet('token');
        $secretToken = getenv('app.arduino.token');

        // Constant-time comparison; fail closed when the server token is unset/empty.
        if (!is_string($token) || !is_string($secretToken) || $secretToken === '' || !hash_equals($secretToken, $token)) {
            log_message('warning', 'Sensors::setWeather - invalid or missing token');
            return $this->failUnauthorized('Invalid token');
        }

        $data = $this->request->getPost();

        if (empty($data)) {
            log_message('warning', 'Sensors::setWeather - empty POST payload');
            return $this->failValidationErrors('Empty data');
        }

        try {
            $parsedData = [
                'date'        => new DateTime('now'),
                'temperature' => $data['t']  ?? null,
                'pressure'    => $data['p']  ?? null,
                'humidity'    => $data['h']  ?? null,
                'wind_speed'  => $data['ws'] ?? null,
                'wind_deg'    => $data['wd'] ?? null,
                'uv_index'    => $data['uv'] ?? null,
                'source'      => RawWeatherDataModel::SOURCE_CUSTOMSTATION,
            ];

            $measurements = array_filter(
                array_diff_key($parsedData, ['date' => true, 'source' => true]),
                static fn ($value): bool => $value !== null
            );

            if (empty($measurements)) {
                log_message('warning', 'Sensors::setWeather - payload contains no known measurements');
                return $this->failValidationErrors('No measurements provided');
            }

            $this->weatherDataEntity->fill($parsedData);

            if (!$this->weatherDataModel->save($this->weatherDataEntity)) {
                log_message('warning', 'Sensors::setWeather - validation failed: ' . json_encode($this->weatherDataModel->errors()));
                return $this->failValidationErrors($this->weatherDataModel->errors());
            }

            return $this->respondCreated();
        } catch (Exception $e) {
            log_message('error', 'Sensors::setWeather - failed to save weather data: ' . $e->getMessage());
            return $this->failServerError('Internal server error.');
        }
    }
}
