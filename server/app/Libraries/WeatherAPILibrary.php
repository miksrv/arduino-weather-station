<?php

namespace App\Libraries;

// https://www.weatherapi.com/my/#
use App\Models\RawWeatherDataModel;
use CodeIgniter\I18n\Time;
use Exception;

class WeatherAPILibrary extends AbstractWeatherAPILibrary
{
    const API_URL = 'https://api.weatherapi.com/v1';

    /**
     * @lnk https://www.weatherapi.com/docs/weather_conditions.json
     * @var array|int[]
     */
    protected static array $conditionMapping = [
        // WeatherAPI ID => Custom ID
        1000 => 800, // Clear sky
        1003 => 801, // Partly cloudy
        1006 => 802, // Cloudy
        1009 => 804, // Overcast
        1030 => 741, // Mist
        1063 => 500, // Patchy rain possible
        1066 => 600, // Patchy snow possible
        1069 => 611, // Patchy sleet possible
        1072 => 615, // Patchy freezing drizzle possible
        1087 => 211, // Thunderstorm
        1114 => 621, // Blowing snow
        1117 => 602, // Blizzard
        1135 => 741, // Fog
        1147 => 741, // Freezing fog
        1150 => 511, // Patchy light drizzle
        1153 => 511, // Light drizzle
        1168 => 511, // Freezing drizzle
        1171 => 511, // Heavy freezing drizzle
        1180 => 520, // Patchy light rain
        1183 => 500, // Light rain
        1186 => 501, // Moderate rain at times
        1189 => 501, // Moderate rain
        1192 => 502, // Heavy rain at times
        1195 => 502, // Heavy rain
        1198 => 511, // Light freezing rain
        1201 => 511, // Moderate or heavy freezing rain
        1204 => 611, // Light sleet
        1207 => 611, // Moderate or heavy sleet
        1210 => 600, // Patchy light snow
        1213 => 600, // Light snow
        1216 => 601, // Patchy moderate snow
        1219 => 601, // Moderate snow
        1222 => 602, // Patchy heavy snow
        1225 => 602, // Heavy snow
        1237 => 611, // Ice pellets
        1240 => 520, // Light rain shower
        1243 => 522, // Moderate or heavy rain shower
        1246 => 522, // Torrential rain shower
        1249 => 611, // Light sleet showers
        1252 => 611, // Moderate or heavy sleet showers
        1255 => 620, // Light snow showers
        1258 => 621, // Moderate or heavy snow showers
        1261 => 611, // Light showers of ice pellets
        1264 => 611, // Moderate or heavy showers of ice pellets
        1273 => 211, // Patchy light rain with thunder
        1276 => 211, // Moderate or heavy rain with thunder
        1279 => 212, // Patchy light snow with thunder
        1282 => 212, // Moderate or heavy snow with thunder
    ];

    public function __construct()
    {
        parent::__construct();

        helper('weather');
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
        return array_merge($this->_mapCommonFields($data['current']), [
            'date' => !empty($data['current']['last_updated_epoch']) ? Time::createFromTimestamp($data['current']['last_updated_epoch']) : null,
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
            'forecast_time' => !empty($data['time_epoch']) ? Time::createFromTimestamp($data['time_epoch']) : null,
        ]);
    }

    /**
     * Maps the fields shared between the current-weather ("current" object)
     * and forecast ("hour" object) payload shapes — both use the same key
     * names, only the date/time key and the enclosing structure differ.
     * @param array $data
     * @return array
     */
    private function _mapCommonFields(array $data): array
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
            'weather_id'    => !empty($data['condition']['code']) ? self::convertWeatherCondition((int) $data['condition']['code']) : null,
            'source'        => RawWeatherDataModel::SOURCE_WEATHERAPI
        ];
    }

    /**
     * @param int $weatherId
     * @return int|null
     * @link https://www.weatherapi.com/docs/weather_conditions.json
     */
    public static function convertWeatherCondition(int $weatherId): ?int {
        return self::$conditionMapping[$weatherId] ?? null;
    }
}
