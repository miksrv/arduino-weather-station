<?php

namespace App\Libraries;

// https://www.visualcrossing.com/weather/weather-data-services/
// CODES: https://www.weatherapi.com/docs/weather_conditions.json
// 1000 records/day
use App\Models\RawWeatherDataModel;
use CodeIgniter\I18n\Time;
use Exception;

class VisualCrossingAPILibrary extends AbstractWeatherAPILibrary
{
    const API_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';

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

    /**
     * Receive current weather data
     * @return array|false
     * @throws Exception
     */
    public function getWeatherData(): array|false
    {
        $data = $this->request('today');
        return $data ? $this->mapWeatherData($data) : false;
    }

    /**
     * Makes a request to the VisualCrossing API
     * @param string $endpoint
     * @return false|array
     */
    protected function request(string $endpoint): false|array
    {
        $params = [
            'key'         => getenv('app.visualcrossing.key'),
            'unitGroup'   => 'metric',
            'include'     => 'current',
            'contentType' => 'json',
        ];

        return $this->httpGet(self::API_URL . getenv('app.lat') . ',' . getenv('app.lon') . '/' . $endpoint, $params);
    }

    /**
     * We receive the weather forecast
     * @return array|false
     * @throws Exception
     */
    public function getForecastWeatherData(): false|array
    {
        return false;
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

        $c = $data['currentConditions'] ?? [];

        return [
            'temperature'   => isset($c['temp']) ? (float) $c['temp'] : null,
            'dew_point'     => isset($c['dew']) ? (float) $c['dew'] : null,
            'feels_like'    => isset($c['feelslike']) ? (float) $c['feelslike'] : null,
            'pressure'      => isset($c['pressure']) ? (int) round((float) $c['pressure']) : null,
            'humidity'      => isset($c['humidity']) ? (float) $c['humidity'] : null,
            'visibility'    => isset($c['visibility']) ? (int) round((float) $c['visibility'] * 1000) : null,
            'wind_speed'    => isset($c['windspeed']) ? kmh_to_ms((float) $c['windspeed']) : null,
            'wind_gust'     => isset($c['windgust']) ? kmh_to_ms((float) $c['windgust']) : null,
            'wind_deg'      => isset($c['winddir']) ? (int) $c['winddir'] : null,
            'clouds'        => isset($c['cloudcover']) ? (int) $c['cloudcover'] : null,
            'uv_index'      => isset($c['uvindex']) ? (float) $c['uvindex'] : null,
            'sol_energy'    => isset($c['solarenergy']) ? (float) $c['solarenergy'] : null,
            'sol_radiation' => isset($c['solarradiation']) ? (float) $c['solarradiation'] : null,
            'precipitation' => isset($c['precip']) ? (float) $c['precip'] : null,
            'weather_id'    => !empty($c['conditions'])
                ? self::convertWeatherCondition((string) $c['conditions'], isset($c['precip']) ? (float) $c['precip'] : null)
                : null,
            'date'          => !empty($c['datetimeEpoch']) ? Time::createFromTimestamp($c['datetimeEpoch']) : null,
            'source'        => RawWeatherDataModel::SOURCE_VISUALCROSSING
        ];
    }

    /**
     * Maps a comma-separated Visual Crossing `conditions` string (e.g. "Rain, Partially cloudy").
     *
     * Every token is mapped and the most significant one wins: thunderstorm, then precipitation, then
     * atmosphere (fog, mist, ...), then sky cover, so "Rain, Overcast" is rain. The generic "Rain" /
     * "Snow" tokens are refined by the hourly precipitation amount (mm) when it is known.
     *
     * @param string     $conditions The `conditions` field.
     * @param float|null $precip     Precipitation, mm (null = unknown, generic code is kept).
     * @return int|null
     * @link https://www.visualcrossing.com/resources/documentation/weather-api/weather-condition-fields/
     */
    public static function convertWeatherCondition(string $conditions, ?float $precip = null): ?int
    {
        $best     = null;
        $bestRank = PHP_INT_MAX;

        foreach (explode(',', $conditions) as $token) {
            $token = trim($token);
            $id    = self::$conditionMapping[$token] ?? null;

            if ($id === null) {
                continue;
            }

            if ($precip !== null && $precip > 0) {
                if ($token === 'Rain') {
                    $id = $precip < 2.5 ? 500 : ($precip < 7.6 ? 501 : 502);
                } elseif ($token === 'Snow') {
                    $id = $precip < 1.0 ? 600 : ($precip < 4.0 ? 601 : 602);
                }
            }

            $rank = match (intdiv($id, 100)) {
                2       => 0,
                3, 5, 6 => 1,
                7       => 2,
                default => 3,
            };

            if ($rank < $bestRank) {
                $best     = $id;
                $bestRank = $rank;
            }
        }

        return $best;
    }
}
