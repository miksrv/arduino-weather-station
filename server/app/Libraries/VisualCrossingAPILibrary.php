<?php

namespace App\Libraries;

// https://www.visualcrossing.com/weather/weather-data-services/
// CODES: https://www.weatherapi.com/docs/weather_conditions.json
// 1000 records/day
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\CURLRequest;
use CodeIgniter\I18n\Time;
use Config\Services;
use Exception;

class VisualCrossingAPILibrary
{
    const API_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';

    /**
     * @var \CodeIgniter\HTTP\CURLRequest The HTTP client used for making requests.
     */
    protected CURLRequest $httpClient;

    /**
     * @lnk https://docs.google.com/spreadsheets/d/1cc-jQIap7ZToVaEgiXEk_Aa6YVYjSObLV9PMe4oHrFg/edit?gid=2045823731#gid=2045823731
     * @var array|int[]
     */
    protected static array $conditionMapping = [
        // Текстовое состояние => Custom ID
        'Blowing Or Drifting Snow'             => 621, // Shower snow
        'Heavy Freezing Drizzle/Freezing Rain' => 511, // Heavy freezing drizzle
        'Light Freezing Drizzle/Freezing Rain' => 511, // Light freezing drizzle
        'Freezing Fog'                         => 741, // Freezing fog
        'Heavy Freezing Rain'                  => 511, // Heavy freezing rain
        'Light Freezing Rain'                  => 511, // Light freezing rain
        'Funnel Cloud/Tornado'                 => 781, // Tornado
        'Hail Showers'                         => 621, // Shower snow (альтернативный вариант)
        'Ice'                                  => 611, // Sleet
        'Lightning Without Thunder'            => 211, // Thunderstorm
        'Mist'                                 => 701, // Mist
        'Drizzle'                              => 301, // Drizzle
        'Precipitation In Vicinity'            => 520, // Light intensity shower rain
        'Rain'                                 => 501, // Moderate rain
        'Heavy Rain And Snow'                  => 616, // Rain and snow
        'Light Rain And Snow'                  => 615, // Light rain and snow
        'Rain Showers'                         => 521, // Shower rain
        'Heavy Rain'                           => 502, // Heavy intensity rain
        'Light Rain'                           => 500, // Light rain
        'Sky Coverage Decreasing'              => 801, // Few clouds
        'Sky Coverage Increasing'              => 802, // Scattered clouds
        'Sky Unchanged'                        => 800, // Clear sky
        'Heavy Drizzle'                        => 302, // Heavy intensity drizzle
        'Smoke Or Haze'                        => 711, // Smoke
        'Snow'                                 => 601, // Snow
        'Snow And Rain Showers'                => 616, // Rain and snow
        'Snow Showers'                         => 621, // Shower snow
        'Heavy Snow'                           => 602, // Heavy snow
        'Light Snow'                           => 600, // Light snow
        'Squalls'                              => 771, // Squalls
        'Thunderstorm'                         => 211, // Thunderstorm
        'Thunderstorm Without Precipitation'   => 211, // Thunderstorm
        'Diamond Dust'                         => 741, // Mist (альтернативный вариант)
        'Light Drizzle'                        => 300, // Light intensity drizzle
        'Hail'                                 => 621, // Shower snow (альтернативный вариант)
        'Overcast'                             => 804, // Overcast clouds
        'Partially cloudy'                     => 802, // Scattered clouds
        'Clear'                                => 800, // Clear sky
        'Heavy Drizzle/Rain'                   => 302, // Heavy intensity drizzle
        'Light Drizzle/Rain'                   => 300, // Light intensity drizzle
        'Dust storm'                           => 761, // Dust
        'Fog'                                  => 741, // Fog
        'Freezing Drizzle/Freezing Rain'       => 511, // Freezing drizzle
    ];

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
            'weather_id'    => !empty($data['currentConditions']['conditions']) ? self::convertWeatherCondition($data['currentConditions']['conditions']) : null,
            'date'          => !empty($data['currentConditions']['datetimeEpoch']) ? Time::createFromTimestamp($data['currentConditions']['datetimeEpoch']) : null,
            'source'        => RawWeatherDataModel::SOURCE_VISUALCROSSING
        ];
    }

    /**
     * @param string $conditions
     * @return int|null
     * @link https://www.visualcrossing.com/resources/documentation/weather-api/weather-condition-fields/
     */
    public static function convertWeatherCondition(string $conditions): ?int {
        $conditions = explode(',', $conditions);
        return self::$conditionMapping[trim($conditions[0])] ?? null;
    }
}
