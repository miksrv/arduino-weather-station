<?php

namespace App\Libraries;

// https://open-meteo.com/en/docs (general weather forecast — free, no API key)
// https://open-meteo.com/en/docs/air-quality-api (air quality — separate host, free, no API key)
use App\Models\RawWeatherDataModel;
use CodeIgniter\I18n\Time;
use Exception;

/**
 * Open-Meteo weather + air quality provider.
 *
 * Unlike the other providers, Open-Meteo requires two separate HTTP calls —
 * one against the general weather forecast host and one against the
 * dedicated air-quality host — whose results are merged before mapping.
 * Either call may fail independently without failing the whole request;
 * the missing side's fields simply default to null.
 */
class OpenMeteoAPILibrary extends AbstractWeatherAPILibrary
{
    private const API_URL_WEATHER     = 'https://api.open-meteo.com/v1/forecast';
    private const API_URL_AIR_QUALITY = 'https://air-quality-api.open-meteo.com/v1/air-quality';

    /**
     * @lnk https://open-meteo.com/en/docs
     * @var string[] Requested `current=`/`hourly=` variable names for the weather host.
     */
    private const WEATHER_VARIABLES = [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'dew_point_2m',
        'pressure_msl',
        'precipitation',
        'cloud_cover',
        'visibility',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
        'uv_index',
        'shortwave_radiation',
        'weather_code',
    ];

    /**
     * @lnk https://open-meteo.com/en/docs/air-quality-api
     * @var string[] Requested `current=`/`hourly=` variable names for the air-quality host.
     */
    private const AIR_QUALITY_VARIABLES = [
        'pm10',
        'pm2_5',
        'carbon_monoxide',
        'nitrogen_dioxide',
        'sulphur_dioxide',
        'ozone',
    ];

    /**
     * @lnk https://open-meteo.com/en/docs#weathervariables (WMO weather codes)
     * @var array|int[]
     */
    protected static array $conditionMapping = [
        0  => 800, // Clear sky
        1  => 801, // Mainly clear
        2  => 802, // Partly cloudy
        3  => 804, // Overcast
        45 => 741, // Fog
        48 => 741, // Depositing rime fog
        51 => 300, // Light drizzle
        53 => 301, // Moderate drizzle
        55 => 302, // Dense drizzle
        56 => 511, // Light freezing drizzle
        57 => 511, // Dense freezing drizzle
        61 => 500, // Slight rain
        63 => 501, // Moderate rain
        65 => 502, // Heavy rain
        66 => 511, // Light freezing rain
        67 => 511, // Heavy freezing rain
        71 => 600, // Slight snow fall
        73 => 601, // Moderate snow fall
        75 => 602, // Heavy snow fall
        77 => 611, // Snow grains
        80 => 520, // Slight rain showers
        81 => 521, // Moderate rain showers
        82 => 522, // Violent rain showers
        85 => 620, // Slight snow showers
        86 => 621, // Heavy snow showers
        95 => 211, // Thunderstorm, slight or moderate
        96 => 221, // Thunderstorm with slight hail
        99 => 212, // Thunderstorm with heavy hail
    ];

    /**
     * Receive current weather data merged with current air quality data.
     * @return array|false
     * @throws Exception
     */
    public function getWeatherData(): array|false
    {
        $weatherResponse    = $this->request(self::API_URL_WEATHER, $this->_currentWeatherParams());
        $airQualityResponse = $this->request(self::API_URL_AIR_QUALITY, $this->_currentAirQualityParams());

        if ($weatherResponse === false && $airQualityResponse === false) {
            return false;
        }

        $weatherCurrent = $weatherResponse['current'] ?? null;
        if ($weatherCurrent === null) {
            log_message('warning', 'OpenMeteo: current weather data unavailable — weather fields will be null.');
        }

        $airQualityCurrent = $airQualityResponse['current'] ?? null;
        if ($airQualityCurrent === null) {
            log_message('warning', 'OpenMeteo: current air quality data unavailable — air quality fields will be null.');
        }

        // Weather's own 'time' key (if present) takes precedence over air quality's.
        $merged = array_merge($airQualityCurrent ?? [], $weatherCurrent ?? []);

        return $this->mapWeatherData($merged);
    }

    /**
     * Receive the weather forecast merged with the air-quality forecast.
     * Air quality's forecast horizon is shorter than the general weather
     * forecast, so rows beyond its coverage simply get null air-quality
     * fields rather than failing the whole request.
     * @return array|false
     * @throws Exception
     */
    public function getForecastWeatherData(): array|false
    {
        $weatherResponse    = $this->request(self::API_URL_WEATHER, $this->_hourlyWeatherParams());
        $airQualityResponse = $this->request(self::API_URL_AIR_QUALITY, $this->_hourlyAirQualityParams());

        $weatherHourly = $weatherResponse['hourly'] ?? null;

        if (empty($weatherHourly['time'])) {
            log_message('warning', 'OpenMeteo: hourly weather forecast unavailable — no forecast rows to build.');
            return false;
        }

        $airQualityHourly = $airQualityResponse['hourly'] ?? null;
        if (empty($airQualityHourly['time'])) {
            log_message('warning', 'OpenMeteo: hourly air quality forecast unavailable — air quality fields will be null for all forecast rows.');
        }

        $airQualityByTime = $airQualityHourly !== null ? $this->_zipHourlyByTime($airQualityHourly) : [];
        $weatherByTime    = $this->_zipHourlyByTime($weatherHourly);

        $return = [];
        foreach ($weatherByTime as $time => $weatherRow) {
            // Beyond the air quality forecast horizon this will simply be an
            // empty array, which _mapAirQualityFields() turns into nulls.
            $airQualityRow = $airQualityByTime[$time] ?? [];
            $merged        = array_merge($airQualityRow, $weatherRow, ['time' => $time]);

            $return[] = $this->mapForecastData($merged);
        }

        return $return;
    }

    /**
     * Makes a request to either Open-Meteo host and decodes the JSON body.
     * @param string $url
     * @param array  $params
     * @return false|array
     */
    protected function request(string $url, array $params): false|array
    {
        return $this->httpGet($url, $params);
    }

    /**
     * Mapping current weather + air quality data to the desired format.
     * @param array $data Merged 'current' objects from both hosts.
     * @return array
     * @throws Exception
     */
    protected function mapWeatherData(array $data): array
    {
        return array_merge($this->_mapCommonFields($data), $this->_mapAirQualityFields($data), [
            'date'   => !empty($data['time']) ? Time::parse($data['time'], 'UTC') : null,
            'source' => RawWeatherDataModel::SOURCE_OPENMETEO,
        ]);
    }

    /**
     * Mapping forecast weather + air quality data to the desired format.
     * @param array $data Merged per-timestamp row from both hosts, plus 'time'.
     * @return array
     * @throws Exception
     */
    protected function mapForecastData(array $data): array
    {
        return array_merge($this->_mapCommonFields($data), $this->_mapAirQualityFields($data), [
            'forecast_time' => Time::parse($data['time'], 'UTC'),
            'source'        => RawWeatherDataModel::SOURCE_OPENMETEO,
        ]);
    }

    /**
     * Maps the weather fields shared between the current-weather ("current"
     * object) and forecast ("hourly", zipped per-timestamp) payload shapes —
     * both use the same variable names.
     * @param array $data
     * @return array
     */
    private function _mapCommonFields(array $data): array
    {
        return [
            'temperature'   => isset($data['temperature_2m']) ? (float) $data['temperature_2m'] : null,
            'feels_like'    => isset($data['apparent_temperature']) ? (float) $data['apparent_temperature'] : null,
            'pressure'      => isset($data['pressure_msl']) ? (int) $data['pressure_msl'] : null,
            'humidity'      => isset($data['relative_humidity_2m']) ? (float) $data['relative_humidity_2m'] : null,
            'dew_point'     => isset($data['dew_point_2m']) ? (float) $data['dew_point_2m'] : null,
            'wind_speed'    => isset($data['wind_speed_10m']) ? (float) $data['wind_speed_10m'] : null,
            'wind_deg'      => isset($data['wind_direction_10m']) ? (int) $data['wind_direction_10m'] : null,
            'wind_gust'     => isset($data['wind_gusts_10m']) ? (float) $data['wind_gusts_10m'] : null,
            'clouds'        => isset($data['cloud_cover']) ? (int) $data['cloud_cover'] : null,
            'visibility'    => isset($data['visibility']) ? (int) $data['visibility'] : null,
            'precipitation' => isset($data['precipitation']) ? (float) $data['precipitation'] : null,
            'uv_index'      => isset($data['uv_index']) ? (float) $data['uv_index'] : null,
            'sol_radiation' => isset($data['shortwave_radiation']) ? (float) $data['shortwave_radiation'] : null,
            'sol_energy'    => null, // Open-Meteo has no direct energy-integral equivalent
            'weather_id'    => isset($data['weather_code']) ? self::convertWeatherCondition((int) $data['weather_code']) : null,
        ];
    }

    /**
     * Maps the air quality fields shared between the current and forecast
     * payload shapes.
     * @param array $data
     * @return array
     */
    private function _mapAirQualityFields(array $data): array
    {
        return [
            'pm2_5' => isset($data['pm2_5']) ? (float) $data['pm2_5'] : null,
            'pm10'  => isset($data['pm10']) ? (float) $data['pm10'] : null,
            'co'    => isset($data['carbon_monoxide']) ? (float) $data['carbon_monoxide'] : null,
            'no2'   => isset($data['nitrogen_dioxide']) ? (float) $data['nitrogen_dioxide'] : null,
            'so2'   => isset($data['sulphur_dioxide']) ? (float) $data['sulphur_dioxide'] : null,
            'o3'    => isset($data['ozone']) ? (float) $data['ozone'] : null,
        ];
    }

    /**
     * Zips an Open-Meteo `hourly` response (structure-of-parallel-arrays,
     * e.g. `['time' => [...], 'temperature_2m' => [...], ...]`) into a
     * `time string => [variable => value]` map for easy per-timestamp lookup.
     * @param array $hourly
     * @return array
     */
    private function _zipHourlyByTime(array $hourly): array
    {
        if (empty($hourly['time']) || !is_array($hourly['time'])) {
            return [];
        }

        $variables = array_keys($hourly);
        $rows      = [];

        foreach ($hourly['time'] as $index => $time) {
            $row = [];
            foreach ($variables as $variable) {
                if ($variable === 'time') {
                    continue;
                }
                $row[$variable] = $hourly[$variable][$index] ?? null;
            }
            $rows[$time] = $row;
        }

        return $rows;
    }

    /**
     * Builds the query parameters for the current-weather request.
     * @return array
     */
    private function _currentWeatherParams(): array
    {
        return [
            'latitude'        => getenv('app.lat'),
            'longitude'       => getenv('app.lon'),
            'current'         => implode(',', self::WEATHER_VARIABLES),
            'wind_speed_unit' => 'ms',
            'timezone'        => 'UTC',
        ];
    }

    /**
     * Builds the query parameters for the hourly weather forecast request.
     * @return array
     */
    private function _hourlyWeatherParams(): array
    {
        return [
            'latitude'        => getenv('app.lat'),
            'longitude'       => getenv('app.lon'),
            'hourly'          => implode(',', self::WEATHER_VARIABLES),
            'wind_speed_unit' => 'ms',
            'timezone'        => 'UTC',
        ];
    }

    /**
     * Builds the query parameters for the current air quality request.
     * @return array
     */
    private function _currentAirQualityParams(): array
    {
        return [
            'latitude'  => getenv('app.lat'),
            'longitude' => getenv('app.lon'),
            'current'   => implode(',', self::AIR_QUALITY_VARIABLES),
            'timezone'  => 'UTC',
        ];
    }

    /**
     * Builds the query parameters for the hourly air quality forecast request.
     * @return array
     */
    private function _hourlyAirQualityParams(): array
    {
        return [
            'latitude'  => getenv('app.lat'),
            'longitude' => getenv('app.lon'),
            'hourly'    => implode(',', self::AIR_QUALITY_VARIABLES),
            'timezone'  => 'UTC',
        ];
    }

    /**
     * @param int $wmoCode Open-Meteo WMO weather interpretation code.
     * @return int|null
     * @link https://open-meteo.com/en/docs#weathervariables
     */
    public static function convertWeatherCondition(int $wmoCode): ?int
    {
        return self::$conditionMapping[$wmoCode] ?? null;
    }
}
