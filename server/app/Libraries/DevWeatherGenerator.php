<?php

namespace App\Libraries;

/**
 * Class DevWeatherGenerator
 *
 * Pure, deterministic generator of physically plausible synthetic weather for
 * Orenburg (51.77 N, 55.10 E, UTC+5). Used only by DevWeatherSeeder to fill a local
 * development database.
 *
 * The "true" weather is a pure function of the UTC timestamp (seasonal + diurnal
 * cycle plus smooth hash-based value noise), so generating data in several separate
 * runs yields one continuous series, and every run is reproducible (see SEED).
 *
 * @package App\Libraries
 */
class DevWeatherGenerator
{
    /** @var int Global seed mixed into every noise hash (reproducibility) */
    public const SEED = 20260101;

    /** @var float Station latitude, degrees */
    public const LAT = 51.77;

    /** @var float Station longitude, degrees */
    public const LON = 55.10;

    /**
     * Deterministic pseudo-random value in [-1, 1] for an integer lattice node.
     *
     * @param int $channel Independent noise channel id
     * @param int $node    Lattice index
     * @return float
     */
    public static function hash(int $channel, int $node): float
    {
        return (crc32(self::SEED . ':' . $channel . ':' . $node) / 4294967295) * 2 - 1;
    }

    /**
     * Smooth value noise in roughly [-1, 1] (smoothstep-interpolated lattice hash).
     *
     * @param int $channel Independent noise channel id
     * @param int $ts      Unix timestamp (seconds)
     * @param int $scale   Lattice spacing in seconds (feature size of the noise)
     * @return float
     */
    public static function noise(int $channel, int $ts, int $scale): float
    {
        $node = intdiv($ts, $scale);
        $frac = ($ts - $node * $scale) / $scale;
        $frac = $frac * $frac * (3 - 2 * $frac);

        return self::hash($channel, $node) * (1 - $frac) + self::hash($channel, $node + 1) * $frac;
    }

    /**
     * Returns the sine of the solar elevation angle (negative at night).
     *
     * @param int $ts Unix timestamp (seconds, UTC)
     * @return float
     */
    public static function solarSin(int $ts): float
    {
        $dayOfYear = (int) gmdate('z', $ts) + 1;
        $decl      = deg2rad(23.44) * sin(2 * M_PI * ($dayOfYear - 81) / 365);
        $solarHour = fmod(((int) gmdate('G', $ts) * 3600 + (int) gmdate('i', $ts) * 60 + (int) gmdate('s', $ts)) / 3600 + self::LON / 15, 24.0);
        $hourAngle = deg2rad(15 * ($solarHour - 12));
        $lat       = deg2rad(self::LAT);

        return sin($lat) * sin($decl) + cos($lat) * cos($decl) * cos($hourAngle);
    }

    /**
     * Dew point (Magnus formula).
     *
     * @param float $temp     Air temperature, deg C
     * @param float $humidity Relative humidity, %
     * @return float Dew point, deg C
     */
    public static function dewPoint(float $temp, float $humidity): float
    {
        $a     = 17.27;
        $b     = 237.7;
        $gamma = ($a * $temp) / ($b + $temp) + log(max($humidity, 1.0) / 100);

        return ($b * $gamma) / ($a - $gamma);
    }

    /**
     * Apparent temperature (Steadman / Australian BoM formula, uses humidity and wind).
     *
     * @param float $temp      Air temperature, deg C
     * @param float $humidity  Relative humidity, %
     * @param float $windSpeed Wind speed, m/s
     * @return float Feels-like temperature, deg C
     */
    public static function feelsLike(float $temp, float $humidity, float $windSpeed): float
    {
        $vapour = ($humidity / 100) * 6.105 * exp(17.27 * $temp / (237.7 + $temp));

        return $temp + 0.33 * $vapour - 0.7 * $windSpeed - 4.0;
    }

    /**
     * Maps conditions to an OpenWeatherMap condition code.
     *
     * @param float $precip   Precipitation rate, mm/h
     * @param float $temp     Temperature, deg C
     * @param float $clouds   Cloud cover, %
     * @param float $humidity Relative humidity, %
     * @param float $wind     Wind speed, m/s
     * @return int
     */
    public static function weatherId(float $precip, float $temp, float $clouds, float $humidity, float $wind): int
    {
        if ($precip >= 0.1) {
            if ($temp <= 0.0) {
                return $precip < 0.5 ? 600 : ($precip < 2.0 ? 601 : 602);
            }

            if ($temp < 1.5) {
                return 616;
            }

            if ($precip >= 2.5 && $temp >= 15.0) {
                return 211;
            }

            return $precip < 0.3 ? 300 : ($precip < 1.0 ? 500 : ($precip < 3.0 ? 501 : ($precip < 6.0 ? 502 : 503)));
        }

        if ($humidity >= 97 && $wind < 1.5) {
            return 741;
        }

        return match (true) {
            $clouds <= 10 => 800,
            $clouds <= 25 => 801,
            $clouds <= 50 => 802,
            $clouds <= 84 => 803,
            default       => 804,
        };
    }

    /**
     * Returns the synthetic "true" weather at a moment in time.
     *
     * @param int $ts Unix timestamp (seconds, UTC)
     * @return array<string, float|int> Keys: temperature, feels_like, pressure, humidity, dew_point,
     *                                  uv_index, sol_radiation, sol_energy, precipitation, clouds,
     *                                  visibility, wind_speed, wind_deg, wind_gust, weather_id
     */
    public static function state(int $ts): array
    {
        $dayOfYear = (int) gmdate('z', $ts) + 1;
        $season    = cos(2 * M_PI * ($dayOfYear - 200) / 365);   // +1 mid-July, -1 mid-January
        $summer    = ($season + 1) / 2;                           // 0..1
        $localHour = fmod(((int) gmdate('G', $ts) * 3600 + (int) gmdate('i', $ts) * 60) / 3600 + 5, 24.0);

        // Rain episodes and cloud cover
        $rainNoise = self::noise(1, $ts, 6 * 3600) * 0.8 + self::noise(2, $ts, 1800) * 0.2;
        $rainThr   = 0.52 + 0.04 * $summer;
        $raining   = $rainNoise > $rainThr;
        $precip    = $raining ? min(5.0, ($rainNoise - $rainThr) * 4 * (0.75 + 0.5 * abs(self::noise(3, $ts, 600)))) : 0.0;
        $clouds    = 48 + 70 * self::noise(4, $ts, 10 * 3600) + 12 * self::noise(5, $ts, 2400);

        if ($rainNoise > $rainThr - 0.08) {
            $clouds = max($clouds, 88 + 12 * self::noise(6, $ts, 1800));
        }

        $clouds = max(0.0, min(100.0, $clouds));

        // Temperature: seasonal mean + multi-day anomaly + diurnal cycle
        $seasonal = 5 + 17.5 * $season;
        $anomaly  = 5.5 * self::noise(7, $ts, 3 * 86400) + 1.5 * self::noise(8, $ts, 6 * 3600);
        $amp      = 2.5 + 4.0 * (1 - $clouds / 100) * (0.55 + 0.45 * $summer);
        $diurnal  = $amp * cos(2 * M_PI * ($localHour - 15) / 24);
        $temp     = $seasonal + $anomaly + $diurnal - ($raining ? 1.5 : 0.0);

        // Humidity anti-correlated with the diurnal temperature swing
        $humidity = 70 - 3.2 * $diurnal + 12 * self::noise(9, $ts, 2 * 86400) + 0.1 * ($clouds - 50)
            + 8 * (1 - $summer) + ($raining ? 14 : 0);
        $humidity = max(22.0, min(99.0, $humidity));

        // Pressure: slow multi-day drift, lower in rainy weather
        $pressure = 1015 + 9 * self::noise(10, $ts, 4 * 86400) + 3 * self::noise(11, $ts, 86400)
            - ($raining ? 4 : 0) + 4 * (1 - $summer) * 0.5;
        $pressure = max(985.0, min(1045.0, $pressure));

        // Wind: persistent speed with gusts, slowly wandering direction
        $wind = 3.4 + 2.6 * self::noise(12, $ts, 8 * 3600) + 1.4 * self::noise(13, $ts, 2400) + ($raining ? 1.0 : 0.0);
        $wind = max(0.1, $wind);
        $gust = $wind * (1.35 + 0.35 * abs(self::noise(14, $ts, 900))) + 0.5;
        $dir  = fmod(360 * (0.5 + 0.9 * self::noise(15, $ts, 2 * 86400)) + 25 * self::noise(16, $ts, 3600) + 720, 360.0);

        // Solar: zero at night, seasonal at noon, attenuated by cloud
        $sin       = self::solarSin($ts);
        $radiation = $sin > 0 ? 1000 * ($sin ** 1.15) * (1 - 0.75 * ($clouds / 100) ** 3) : 0.0;
        $uv        = $sin > 0 ? 12.5 * ($sin ** 2.2) * (1 - 0.7 * $clouds / 100) : 0.0;

        $visibility = 24000 - $precip * 2500 - max(0.0, $humidity - 92) * 1500;
        $visibility = max(500.0, $visibility);

        return [
            'temperature'   => $temp,
            'feels_like'    => self::feelsLike($temp, $humidity, $wind),
            'pressure'      => $pressure,
            'humidity'      => $humidity,
            'dew_point'     => self::dewPoint($temp, $humidity),
            'uv_index'      => $uv,
            'sol_radiation' => $radiation,
            'sol_energy'    => $radiation * 0.0036,
            'precipitation' => $precip,
            'clouds'        => $clouds,
            'visibility'    => $visibility,
            'wind_speed'    => $wind,
            'wind_deg'      => $dir,
            'wind_gust'     => $gust,
            'weather_id'    => self::weatherId($precip, $temp, $clouds, $humidity, $wind),
        ];
    }

    /**
     * Lists timestamps of a periodic cadence strictly after $afterTs and up to $untilTs.
     *
     * @param int $afterTs Exclusive lower bound (unix seconds)
     * @param int $untilTs Inclusive upper bound (unix seconds)
     * @param int $step    Cadence in seconds
     * @param int $offset  Offset of the slot grid in seconds
     * @return int[]
     */
    public static function slots(int $afterTs, int $untilTs, int $step, int $offset = 0): array
    {
        $slots = [];
        $first = (int) (floor(($afterTs - $offset) / $step) + 1) * $step + $offset;

        for ($t = $first; $t <= $untilTs; $t += $step) {
            $slots[] = $t;
        }

        return $slots;
    }

    /**
     * Builds one Arduino/ESP32 reading as POST /sensors stores it (t, p, h, ws, wd, uv + derived dew point).
     *
     * @param int $slot Grid timestamp (unix seconds); a few seconds of jitter are added
     * @return array<string, mixed> raw_weather_data row
     */
    public static function customStationRow(int $slot): array
    {
        $ts = $slot + (int) abs(self::hash(20, $slot) * 3);
        $s  = self::state($ts);

        $temp     = round($s['temperature'] + 0.12 * self::hash(21, $ts), 1);
        $humidity = round(max(1.0, min(100.0, $s['humidity'] + 0.8 * self::hash(22, $ts))), 1);

        return [
            'date'        => gmdate('Y-m-d H:i:s', $ts),
            'source'      => 'CustomStation',
            'temperature' => $temp,
            'pressure'    => (int) round($s['pressure'] + 0.3 * self::hash(23, $ts)),
            'humidity'    => $humidity,
            'dew_point'   => round(self::dewPoint($temp, $humidity), 2),
            'uv_index'    => round(max(0.0, $s['uv_index'] + 0.15 * self::hash(24, $ts) * ($s['uv_index'] > 0.2 ? 1 : 0)), 1),
            'wind_speed'  => round(max(0.0, $s['wind_speed'] + 0.4 * self::hash(25, $ts)), 2),
            'wind_deg'    => (int) round(fmod($s['wind_deg'] + 10 * self::hash(26, $ts) + 360, 360.0)),
        ];
    }

    /**
     * Builds one external-API observation (columns each provider really fills).
     *
     * @param string $source One of OpenWeatherMap, WeatherAPI, VisualCrossing, OpenMeteo
     * @param int    $ts     Observation timestamp (unix seconds)
     * @return array<string, mixed> raw_weather_data row
     */
    public static function externalRow(string $source, int $ts): array
    {
        $s    = self::state($ts);
        $bias = fn (int $ch, float $amp): float => $amp * self::hash($ch + crc32($source) % 1000, $ts);

        $temp = round($s['temperature'] + $bias(30, 0.6), 1);
        $hum  = (int) round(max(5.0, min(100.0, $s['humidity'] + $bias(31, 3))));
        $row  = [
            'date'        => gmdate('Y-m-d H:i:s', $ts),
            'source'      => $source,
            'temperature' => $temp,
            'feels_like'  => round($s['feels_like'] + $bias(32, 0.6), 1),
            'pressure'    => (int) round($s['pressure'] + $bias(33, 1)),
            'humidity'    => $hum,
            'clouds'      => (int) round(max(0.0, min(100.0, $s['clouds'] + $bias(34, 8)))),
            'wind_speed'  => round(max(0.0, $s['wind_speed'] + $bias(35, 0.5)), 2),
            'wind_deg'    => (int) round(fmod($s['wind_deg'] + $bias(36, 12) + 360, 360.0)),
            'wind_gust'   => round(max(0.0, $s['wind_gust'] + $bias(37, 0.8)), 2),
            'weather_id'  => $s['weather_id'],
            'visibility'  => (int) round($s['visibility']),
        ];

        $precip = round($s['precipitation'], 2);

        switch ($source) {
            case 'OpenWeatherMap':
                $row['visibility']    = min(10000, $row['visibility']);
                $row['precipitation'] = $precip > 0 ? $precip : null;
                break;
            case 'WeatherAPI':
                $row['visibility']    = min(10000, $row['visibility']);
                $row['dew_point']     = round(self::dewPoint($temp, $hum), 1);
                $row['uv_index']      = round($s['uv_index'], 1);
                $row['precipitation'] = $precip;
                break;
            case 'VisualCrossing':
                $row['visibility']     = min(10000, $row['visibility']);
                $row['wind_gust']      = null;
                $row['dew_point']      = round(self::dewPoint($temp, $hum), 1);
                $row['uv_index']       = round($s['uv_index'], 1);
                $row['sol_radiation']  = round($s['sol_radiation'], 1);
                $row['sol_energy']     = round($s['sol_energy'], 2);
                $row['precipitation']  = $precip;
                break;
            case 'OpenMeteo':
                $row['dew_point']      = round(self::dewPoint($temp, $hum), 1);
                $row['uv_index']       = round($s['uv_index'], 1);
                $row['sol_radiation']  = round($s['sol_radiation'], 1);
                $row['precipitation']  = $precip;
                $row['pm2_5']          = round(max(0.5, 7 + 5 * self::noise(40, $ts, 86400) + 2 * self::hash(41, $ts)), 1);
                $row['pm10']           = round($row['pm2_5'] * 1.1 + 0.4, 1);
                $row['co']             = round(115 + 25 * self::noise(42, $ts, 86400), 1);
                $row['no2']            = round(max(0.5, 4 + 2 * self::noise(43, $ts, 43200)), 1);
                $row['so2']            = round(max(0.1, 1.2 + 0.6 * self::noise(44, $ts, 43200)), 1);
                $row['o3']             = round(max(5.0, 60 + 15 * self::noise(45, $ts, 86400)), 1);
                break;
        }

        return $row;
    }

    /**
     * Builds one hourly forecast row. Forecast error grows with lead time: the forecast is the
     * true state shifted slightly in time plus a temperature error.
     *
     * @param string $source  Forecast source (OpenMeteo or WeatherAPI)
     * @param int    $ts      Forecast target time (unix seconds, on the hour)
     * @param int    $nowTs   Time the forecast is "issued"
     * @return array<string, mixed> forecast_weather_data row
     */
    public static function forecastRow(string $source, int $ts, int $nowTs): array
    {
        $leadHours = max(0.0, ($ts - $nowTs) / 3600);
        $salt      = crc32($source) % 1000;
        $shift     = (int) (self::noise(50 + $salt, $ts, 6 * 3600) * min($leadHours, 72) * 1200);
        $s         = self::state($ts + $shift);
        $tempErr   = self::noise(51 + $salt, $ts, 8 * 3600) * (0.3 + 0.05 * $leadHours);
        $temp      = round($s['temperature'] + $tempErr, 1);
        $hum       = (int) round($s['humidity']);

        return [
            'forecast_time' => gmdate('Y-m-d H:i:s', $ts),
            'source'        => $source,
            'temperature'   => $temp,
            'feels_like'    => round($s['feels_like'] + $tempErr, 1),
            'pressure'      => (int) round($s['pressure']),
            'humidity'      => $hum,
            'dew_point'     => round(self::dewPoint($temp, $hum), 1),
            'uv_index'      => round($s['uv_index'], 1),
            'sol_radiation' => round($s['sol_radiation'], 1),
            'precipitation' => round($s['precipitation'], 2),
            'clouds'        => (int) round($s['clouds']),
            'visibility'    => (int) round($s['visibility']),
            'wind_speed'    => round($s['wind_speed'], 2),
            'wind_deg'      => (int) round($s['wind_deg']),
            'wind_gust'     => round($s['wind_gust'], 2),
            'weather_id'    => $s['weather_id'],
        ];
    }
}
