<?php

namespace App\Libraries;

// https://www.weatherapi.com/my/#
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\CURLRequest;
use CodeIgniter\I18n\Time;
use Config\Services;
use Exception;

class WeatherAPILibrary
{
    const API_URL = 'https://api.weatherapi.com/v1';

    protected CURLRequest $httpClient;

    public function __construct()
    {
        helper('weather');

        $this->httpClient = Services::curlrequest();
    }

    /**
     * Receive current weather data
     * @return array|false
     * @throws Exception
     */
    public function getWeatherData(): array|false
    {
        $data = $this->request('/current.json');
        return $data ? $this->mapWeatherData($data) : false;
    }

    /**
     * @throws Exception
     */
    public function getForecastWeatherData(): false|array
    {
        $data = $this->request('/forecast.json', ['days' => 7]);

        if (!$data) {
            return false;
        }

        $return = [];
        foreach ($data['forecast']['forecastday'] as $day) {
            foreach ($day['hour'] as $hour) {
                $return[] = $this->mapForecastData($hour);
            }
        }

        return $return;
    }

//    public function getHistoricalWeather(string $location, string $date): array
//    {
//        return $this->request('/history.json', ['q' => $location, 'dt' => $date]);
//    }

    /**
     * Makes a request to the WeatherAPI.com
     * @param string $endpoint
     * @param array $additionalParams
     * @return false|array
     */
    protected function request(string $endpoint, array $additionalParams = []): false|array
    {
        $params = [
            'key' => getenv('app.weatherapi.key'),
            'q'   => getenv('app.lat') . ',' . getenv('app.lon')
        ];

        try {
            $response = $this->httpClient->request('GET', self::API_URL . $endpoint, ['query' => array_merge($params, $additionalParams)]);
            return json_decode($response->getBody(), true);
        } catch (Exception $e) {
            log_message('error', 'WeatherAPI.com API request error: {e}', ['e' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Mapping weather data to the desired format
     * @param array $data
     * @return array
     * @throws Exception
     */
    protected function mapWeatherData(array $data): array
    {
        return [
            'temperature'   => (float) $data['current']['temp_c'] ?? null,
            'dew_point'     => (float) $data['current']['dewpoint_c'] ?? null,
            'feels_like'    => (float) $data['current']['feelslike_c'] ?? null,
            'pressure'      => (int) $data['current']['pressure_mb'] ?? null,
            'humidity'      => (float) $data['current']['humidity'] ?? null,
            'visibility'    => !empty($data['current']['vis_km']) ? (int) $data['current']['vis_km'] * 1000 : null,
            'wind_speed'    => !empty($data['current']['wind_kph']) ? kmh_to_ms($data['current']['wind_kph']) : null,
            'wind_gust'     => !empty($data['current']['gust_mph']) ? kmh_to_ms($data['current']['gust_mph']) : null,
            'wind_deg'      => (int) $data['current']['wind_degree'] ?? null,
            'clouds'        => $data['current']['cloud'] ?? null,
            'uv_index'      => $data['current']['uv'] ?? null,
            'precipitation' => $data['current']['precip_mm'] ?? null,
            'weather_id'    => (int) $data['current']['condition']['code'] ?? null,
            'weather_main'  => $data['current']['condition']['text'] ?? null,
            // 'weather_icon'  => $data['current']['condition']['icon'] ?? null,
            'date'          => !empty($data['current']['last_updated_epoch']) ? Time::createFromTimestamp($data['current']['last_updated_epoch']) : null,
            'source'        => RawWeatherDataModel::SOURCE_WEATHERAPI
        ];
    }

    /**
     * Mapping forecast weather data to the desired format
     * @param array $data
     * @return array
     * @throws Exception
     */
    protected function mapForecastData(array $data): array
    {
        return [
            'temperature'   => (float) $data['temp_c'] ?? null,
            'dew_point'     => (float) $data['dewpoint_c'] ?? null,
            'feels_like'    => (float) $data['feelslike_c'] ?? null,
            'pressure'      => (int) $data['pressure_mb'] ?? null,
            'humidity'      => (float) $data['humidity'] ?? null,
            'visibility'    => !empty($data['vis_km']) ? (int) $data['vis_km'] * 1000 : null,
            'wind_speed'    => !empty($data['wind_kph']) ? kmh_to_ms($data['wind_kph']) : null,
            'wind_gust'     => !empty($data['gust_mph']) ? kmh_to_ms($data['gust_mph']) : null,
            'wind_deg'      => (int) $data['wind_degree'] ?? null,
            'clouds'        => $data['cloud'] ?? null,
            'uv_index'      => $data['uv'] ?? null,
            'precipitation' => $data['precip_mm'] ?? null,
            'weather_id'    => (int) $data['condition']['code'] ?? null,
            'weather_main'  => $data['condition']['text'] ?? null,
            // 'weather_icon'  => $data['condition']['icon'] ?? null,
            'forecast_time' => !empty($data['time_epoch']) ? Time::createFromTimestamp($data['time_epoch']) : null,
            'source'        => RawWeatherDataModel::SOURCE_WEATHERAPI
        ];
    }
}