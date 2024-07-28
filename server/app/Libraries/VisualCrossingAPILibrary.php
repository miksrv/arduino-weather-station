<?php

namespace App\Libraries;

// https://www.visualcrossing.com/weather/weather-data-services/
// 1000 records/day
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\CURLRequest;
use CodeIgniter\I18n\Time;
use Config\Services;
use Exception;

class VisualCrossingAPILibrary
{
    const API_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';

    protected CURLRequest $httpClient;

    public function __construct()
    {
        $this->httpClient = Services::curlrequest();
    }

    /**
     * Receive current weather data
     * @return array|false
     * @throws Exception
     */
    public function getWeatherData(): array|false
    {
        $data = $this->request('/today');
        return $data ? $this->mapWeatherData($data) : false;
    }

    protected function request(string $endpoint): false|array
    {
        $params = [
            'key'         => getenv('app.visualcrossing.key'),
            'unitGroup'   => 'metric',
            'include'     => 'current',
            'contentType' => 'json',
        ];

        try {
            $response = $this->httpClient->request('GET', self::API_URL . getenv('app.lat') . ',' . getenv('app.lon') . '/' . $endpoint, ['query' => $params]);
            return json_decode($response->getBody(), true);
        } catch (Exception $e) {
            log_message('error', 'VisualCrossing API request error: {e}', ['e' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Mapping weather data to the desired format
     * @example https://www.visualcrossing.com/resources/documentation/weather-data/weather-data-documentation/
     * @param array $data
     * @return array
     * @throws Exception
     */
    protected function mapWeatherData(array $data): array
    {
        helper('weather');

        return [
            'temperature'   => (float) $data['currentConditions']['temp'] ?? null,
            'dew_point'     => (float) $data['currentConditions']['dew'] ?? null,
            'feels_like'    => (float) $data['currentConditions']['feelslike'] ?? null,
            'pressure'      => (int) $data['currentConditions']['pressure'] ?? null,
            'humidity'      => (float) $data['currentConditions']['humidity'] ?? null,
            'visibility'    => !empty($data['currentConditions']['visibility']) ? (int) $data['currentConditions']['visibility'] * 1000 : null,
            'wind_speed'    => !empty($data['currentConditions']['windspeed']) ? kmh_to_ms($data['currentConditions']['windspeed']) : null,
            'wind_gust'     => !empty($data['currentConditions']['windgust']) ? kmh_to_ms($data['currentConditions']['windgust']) : null,
            'wind_deg'      => (int) $data['currentConditions']['winddir'] ?? null,
            'clouds'        => (int) $data['currentConditions']['cloudcover'] ?? null,
            'uv_index'      => (float) $data['currentConditions']['uvindex'] ?? null,
            'sol_energy'    => (float) $data['currentConditions']['solarenergy'] ?? null,
            'sol_radiation' => (float) $data['currentConditions']['solarradiation'] ?? null,
            'precipitation' => (float) $data['currentConditions']['precip'] ?? null,
            // 'weather_id'    => (int) $data['currentConditions']['condition']['code'] ?? null,
            'weather_main'  => $data['currentConditions']['conditions'] ?? null,
            'weather_icon'  => $data['currentConditions']['icon'] ?? null,
            'date'          => !empty($data['currentConditions']['datetimeEpoch']) ? Time::createFromTimestamp($data['currentConditions']['datetimeEpoch']) : null,
            'source'        => RawWeatherDataModel::SOURCE_VISUALCROSSING
        ];
    }
}
