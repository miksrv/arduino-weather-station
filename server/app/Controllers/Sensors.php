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
     *   - p  (float): pressure, mmHg from the station firmware (hPa is accepted too)
     *   - h  (float): humidity
     *   - ws (float): wind speed, m/s
     *   - wd (int):   wind direction in degrees
     *   - uv (float): UV index
     *
     * Every field is checked on its own: a non-numeric or out-of-range value is dropped (and logged) instead of
     * rejecting the whole reading; negative wind speed / UV (calm anemometer, night) is clamped to 0.
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
                'temperature' => $this->_sanitize('t', $data['t'] ?? null, -80, 60),
                'pressure'    => $this->_sanitize('p', $this->_normalizePressure($data['p'] ?? null), 800, 1100, true),
                'humidity'    => $this->_sanitize('h', $data['h'] ?? null, 0, 100),
                'wind_speed'  => $this->_sanitize('ws', $data['ws'] ?? null, 0, 100, false, true),
                'wind_deg'    => $this->_sanitize('wd', $data['wd'] ?? null, 0, 360, true),
                'uv_index'    => $this->_sanitize('uv', $data['uv'] ?? null, 0, 20, false, true),
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

    /**
     * Converts the posted pressure to whole hPa as stored in the database.
     *
     * The station firmware sends mmHg with one decimal (e.g. 752.3); values below 800 can only be mmHg,
     * since surface pressure in hPa never drops that low. Non-numeric input is passed through for validation to reject.
     *
     * @param mixed $pressure Raw POST value
     * @return mixed Pressure in hPa rounded to an integer, or the original value if it is not numeric
     */
    private function _normalizePressure(mixed $pressure): mixed
    {
        if (!is_numeric($pressure)) {
            return $pressure;
        }

        $value = (float) $pressure;

        return (int) round($value < 800 ? $value * 1.33322 : $value);
    }

    /**
     * Validates a single posted measurement so one bad sensor does not reject the whole reading.
     *
     * The limits mirror the validation rules of RawWeatherDataModel. A missing value stays null; a non-numeric or
     * out-of-range one is dropped (null) with a warning.
     *
     * @param string $field        POST field name (for the log)
     * @param mixed  $value        Raw value
     * @param float  $min          Lowest accepted value
     * @param float  $max          Highest accepted value
     * @param bool   $integer      Whether the value is stored as a whole number
     * @param bool   $clampNegative Clamp a negative value to 0 instead of dropping it
     * @return float|int|null
     */
    private function _sanitize(string $field, mixed $value, float $min, float $max, bool $integer = false, bool $clampNegative = false): float|int|null
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!is_numeric($value)) {
            log_message('warning', "Sensors::setWeather - dropped non-numeric '{$field}'");
            return null;
        }

        $number = (float) $value;

        if ($clampNegative && $number < 0) {
            $number = 0.0;
        }

        if ($number < $min || $number > $max) {
            log_message('warning', "Sensors::setWeather - dropped out-of-range '{$field}': {$number}");
            return null;
        }

        return $integer ? (int) round($number) : $number;
    }
}
