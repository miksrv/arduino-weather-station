<?php

namespace App\Libraries;

use App\Models\RawWeatherDataModel;
use CodeIgniter\I18n\Time;
use Exception;

/**
 * CODES: https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
 */
class OpenWeatherAPILibrary extends AbstractWeatherAPILibrary
{
    const API_VERSION = 2.5;
    const API_URL     = 'https://api.openweathermap.org/data/' . self::API_VERSION . '/';

    /**
     * Receive current weather data
     * @return array|false
     * @throws Exception
     */
    public function getWeatherData(): false|array
    {
        $data = $this->request('weather');
        return $data ? $this->mapWeatherData($data) : false;
    }

    /**
     * We receive the weather forecast
     * @return array|false
     * @throws Exception
     */
    public function getForecastWeatherData(): false|array
    {
        $data = $this->request('forecast');

        if (!$data) {
            return false;
        }

        $return = [];
        foreach ($data['list'] as $item) {
            $return[] = $this->mapForecastData($item);
        }

        return $return;
    }

    /**
     * Makes a request to the OpenWeatherMap API
     * @param string $endpoint
     * @param array $additionalParams
     * @return array|false
     */
    protected function request(string $endpoint, array $additionalParams = []): false|array
    {
        $params = [
            'appid' => getenv('app.openweather.key'),
            'lat'   => getenv('app.lat'),
            'lon'   => getenv('app.lon'),
            'units' => 'metric',
            'lang'  => 'ru'
        ];

        return $this->httpGet(self::API_URL . $endpoint, array_merge($params, $additionalParams));
    }

    /**
     * Mapping weather data to the desired format
     * @param array $data
     * @return array
     * @throws Exception
     */
    protected function mapWeatherData(array $data): array
    {
        return array_merge($this->_mapCommonFields($data), [
            'date' => !empty($data['dt']) ? Time::createFromTimestamp($data['dt']) : null,
        ]);
    }

    /**
     * Mapping forecast weather data to the desired format
     * @param array $data
     * @return array
     * @throws Exception
     */
    protected function mapForecastData(array $data): array
    {
        return array_merge($this->_mapCommonFields($data), [
            'forecast_time' => !empty($data['dt']) ? Time::createFromTimestamp($data['dt']) : null,
        ]);
    }

    /**
     * Maps the fields shared between the current-weather and forecast
     * payload shapes (they are structurally identical apart from the
     * date/time key).
     * @param array $data
     * @return array
     */
    private function _mapCommonFields(array $data): array
    {
        return [
            'temperature'   => $data['main']['temp'] ?? null,
            'feels_like'    => $data['main']['feels_like'] ?? null,
            'pressure'      => $data['main']['pressure'] ?? null,
            'humidity'      => $data['main']['humidity'] ?? null,
            'visibility'    => $data['visibility'] ?? null,
            'wind_speed'    => $data['wind']['speed'] ?? null,
            'wind_gust'     => $data['wind']['gust'] ?? null,
            'wind_deg'      => $data['wind']['deg'] ?? null,
            'clouds'        => $data['clouds']['all'] ?? null,
            'precipitation' => $data['rain']['1h'] ?? ($data['snow']['1h'] ?? null),
            'weather_id'    => !empty($data['weather'][0]['id']) ? self::convertWeatherCondition($data['weather'][0]['id']) : null,
            'source'        => RawWeatherDataModel::SOURCE_OPENWEATHERMAP
        ];
    }

    /**
     * @param int $weatherId
     * @return int
     * @link https://openweathermap.org/weather-conditions
     */
    public static function convertWeatherCondition(int $weatherId): int {
        return (int) $weatherId;
    }
}
