<?php

namespace App\Libraries;

use DateTimeImmutable;
use DateTimeZone;

/**
 * Pure aggregation helpers for forecast data.
 *
 * Input rows are raw forecast_weather_data rows (snake_case, one per source and
 * time slot, UTC). Output rows use the camelCase keys of App\Entities\WeatherData.
 *
 * Pipeline: per-source rows -> hourly rows (sources averaged) -> daily rows
 * (hours bucketed by the local calendar day of the station time zone).
 *
 * @package App\Libraries
 */
class ForecastAggregator
{
    /** Minimum hourly precipitation (mm) that counts as a wet hour. */
    public const WET_HOUR_MM = 0.1;

    /** Minimum number of wet hours that makes a day a precipitation day. */
    public const WET_DAY_HOURS = 2;

    /** Day total (mm) that makes a day a precipitation day regardless of hours. */
    public const WET_DAY_TOTAL_MM = 1.0;

    /** Minimum hours of fog/mist (7xx) that makes a day foggy. */
    public const FOG_DAY_HOURS = 3;

    /**
     * Averages the per-source rows of every hour into one row per UTC hour.
     *
     * @param array<int, array<string, mixed>> $rows Raw forecast rows.
     * @return array<int, array<string, mixed>> Hourly rows sorted by date.
     */
    public static function hourly(array $rows): array
    {
        $groups = [];

        foreach ($rows as $row) {
            $time = (string) ($row['forecast_time'] ?? '');
            if (strlen($time) < 13) {
                continue;
            }
            $groups[substr($time, 0, 13) . ':00:00'][] = $row;
        }

        ksort($groups);

        $result = [];
        foreach ($groups as $date => $group) {
            $result[] = self::_hourRow($date, $group);
        }

        return $result;
    }

    /**
     * Rolls hourly rows up into one row per local calendar day.
     *
     * @param array<int, array<string, mixed>> $hourlyRows Output of hourly().
     * @param DateTimeZone                     $timezone   Station time zone.
     * @param int                              $maxDays    Maximum number of days returned.
     * @return array<int, array<string, mixed>> Daily rows sorted by date.
     */
    public static function daily(array $hourlyRows, DateTimeZone $timezone, int $maxDays = 8): array
    {
        $buckets = [];

        foreach ($hourlyRows as $hour) {
            $utc = new DateTimeImmutable((string) $hour['date'], new DateTimeZone('UTC'));
            $buckets[$utc->setTimezone($timezone)->format('Y-m-d')][] = $hour;
        }

        ksort($buckets);

        $result = [];
        foreach (array_slice($buckets, 0, max(0, $maxDays), true) as $day => $hours) {
            $result[] = self::_dayRow($day . ' 00:00:00', $hours);
        }

        return $result;
    }

    /**
     * Vector (circular) mean of angles in degrees.
     *
     * @param array<int, float|int|string|null> $degrees Angles in degrees; nulls are ignored.
     * @param array<int, float|int|string|null>|null $weights Optional weights, aligned with $degrees.
     * @return int|null Direction in 0..359, or null if there is nothing to average.
     */
    public static function circularMean(array $degrees, ?array $weights = null): ?int
    {
        $sin   = 0.0;
        $cos   = 0.0;
        $first = null;

        foreach (array_values($degrees) as $i => $deg) {
            if ($deg === null || $deg === '') {
                continue;
            }

            $weight = $weights === null ? 1.0 : (float) ($weights[$i] ?? 0.0);
            $first ??= (float) $deg;
            $rad    = deg2rad((float) $deg);
            $sin   += sin($rad) * $weight;
            $cos   += cos($rad) * $weight;
        }

        if ($first === null) {
            return null;
        }

        // Zero resultant (opposite directions or zero weights): direction is undefined,
        // fall back to the first valid angle.
        if (hypot($sin, $cos) < 1e-9) {
            return ((int) round($first) % 360 + 360) % 360;
        }

        $deg = rad2deg(atan2($sin, $cos));

        return ((int) round($deg) % 360 + 360) % 360;
    }

    /**
     * Picks the weather code representing one hour.
     *
     * @param array<int, int|string|null> $ids       Weather codes reported by the sources.
     * @param float|null                  $precipAvg Mean precipitation of the hour, mm.
     * @param float|null                  $clouds    Mean cloud cover, %.
     * @return int|null Representative OpenWeather code, or null if nothing is known.
     */
    public static function representativeWeatherId(array $ids, ?float $precipAvg, ?float $clouds): ?int
    {
        $ids = array_map('intval', array_values(array_filter($ids, static fn ($v) => $v !== null && $v !== '')));
        $n   = count($ids);

        $precipIds = array_values(array_filter($ids, [self::class, '_isPrecipitation']));

        if ($precipIds !== [] && (($precipAvg ?? 0.0) >= self::WET_HOUR_MM || count($precipIds) * 2 > $n)) {
            return self::_mostSevere($precipIds);
        }

        $fogIds = array_values(array_filter($ids, static fn (int $id) => $id >= 700 && $id < 800));
        if ($fogIds !== [] && count($fogIds) * 2 > $n) {
            return self::_mode($fogIds);
        }

        if ($clouds !== null) {
            return self::cloudsToWeatherId($clouds);
        }

        $cloudIds = array_values(array_filter($ids, static fn (int $id) => $id >= 800 && $id <= 804));

        return $cloudIds === [] ? null : self::_mode($cloudIds);
    }

    /**
     * Maps cloud cover to an OpenWeather clear/clouds code.
     *
     * @param float $clouds Cloud cover, %.
     * @return int 800..804.
     */
    public static function cloudsToWeatherId(float $clouds): int
    {
        return match (true) {
            $clouds < 11 => 800,
            $clouds < 25 => 801,
            $clouds < 50 => 802,
            $clouds < 85 => 803,
            default      => 804,
        };
    }

    /**
     * Picks the dominant weather code of a local day from its hourly rows.
     *
     * @param array<int, array<string, mixed>> $hours         Hourly rows of the day.
     * @param float                            $precipTotal   Day precipitation total, mm.
     * @param int                              $precipHours   Hours with at least WET_HOUR_MM.
     * @param float|null                       $meanClouds    Mean cloud cover, %.
     * @return int|null Weather code, or null if nothing is known.
     */
    public static function dailyWeatherId(array $hours, float $precipTotal, int $precipHours, ?float $meanClouds): ?int
    {
        $ids = [];
        foreach ($hours as $hour) {
            if (isset($hour['weatherId'])) {
                $ids[] = (int) $hour['weatherId'];
            }
        }

        $precipIds = array_values(array_filter($ids, [self::class, '_isPrecipitation']));

        if ($precipIds !== [] && ($precipHours >= self::WET_DAY_HOURS || $precipTotal >= self::WET_DAY_TOTAL_MM)) {
            return self::_mostSevere($precipIds);
        }

        $fogIds = array_values(array_filter($ids, static fn (int $id) => $id >= 700 && $id < 800));
        if (count($fogIds) >= self::FOG_DAY_HOURS) {
            return self::_mode($fogIds);
        }

        if ($meanClouds !== null) {
            return self::cloudsToWeatherId($meanClouds);
        }

        $cloudIds = array_values(array_filter($ids, static fn (int $id) => $id >= 800 && $id <= 804));

        return $cloudIds === [] ? null : self::_mode($cloudIds);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Builds one hourly row from the source rows of that hour.
     *
     * @param string                           $date  "Y-m-d H:00:00".
     * @param array<int, array<string, mixed>> $group Source rows.
     * @return array<string, mixed>
     */
    private static function _hourRow(string $date, array $group): array
    {
        $col = static fn (string $key): array => self::_values($group, $key);

        $precip = self::_mean($col('precipitation'), 2);
        $clouds = self::_mean($col('clouds'), 0);
        $gusts  = $col('wind_gust');

        return [
            'date'          => $date,
            'temperature'   => self::_mean($col('temperature'), 2),
            'feelsLike'     => self::_mean($col('feels_like'), 2),
            'humidity'      => self::_meanInt($col('humidity')),
            'pressure'      => self::_meanInt($col('pressure')),
            'dewPoint'      => self::_mean($col('dew_point'), 2),
            'clouds'        => self::_meanInt($col('clouds')),
            'visibility'    => self::_meanInt($col('visibility')),
            'uvIndex'       => self::_mean($col('uv_index'), 2),
            'solEnergy'     => self::_mean($col('sol_energy'), 2),
            'solRadiation'  => self::_mean($col('sol_radiation'), 2),
            'precipitation' => $precip,
            'windSpeed'     => self::_mean($col('wind_speed'), 2),
            'windGust'      => $gusts === [] ? null : round(max($gusts), 2),
            'windDeg'       => self::circularMean($col('wind_deg')),
            'weatherId'     => self::representativeWeatherId(
                array_column($group, 'weather_id'),
                $precip,
                self::_mean($col('clouds'), 4)
            ),
        ];
    }

    /**
     * Builds one daily row from the hourly rows of a local day.
     *
     * @param string                           $date  "Y-m-d 00:00:00" (local day).
     * @param array<int, array<string, mixed>> $hours Hourly rows.
     * @return array<string, mixed>
     */
    private static function _dayRow(string $date, array $hours): array
    {
        $col = static fn (string $key): array => self::_values($hours, $key);

        $precip      = $col('precipitation');
        $precipTotal = array_sum($precip);
        $precipHours = count(array_filter($precip, static fn (float $v) => $v >= self::WET_HOUR_MM));
        $speeds      = $col('windSpeed');
        $gusts       = $col('windGust');
        $uv          = $col('uvIndex');
        $temps       = $col('temperature');
        $feels       = $col('feelsLike');

        // Wind direction weighted by speed; hours without speed or direction are skipped.
        $degs    = [];
        $weights = [];
        foreach ($hours as $hour) {
            if (isset($hour['windDeg'])) {
                $degs[]    = $hour['windDeg'];
                $weights[] = $hour['windSpeed'] ?? 0.0;
            }
        }

        return [
            'date'               => $date,
            'temperature'        => self::_mean($temps, 2),
            'temperatureMin'     => $temps === [] ? null : round(min($temps), 2),
            'temperatureMax'     => $temps === [] ? null : round(max($temps), 2),
            'feelsLike'          => self::_mean($feels, 2),
            'feelsLikeMin'       => $feels === [] ? null : round(min($feels), 2),
            'feelsLikeMax'       => $feels === [] ? null : round(max($feels), 2),
            'humidity'           => self::_meanInt($col('humidity')),
            'pressure'           => self::_meanInt($col('pressure')),
            'clouds'             => self::_meanInt($col('clouds')),
            'dewPoint'           => self::_mean($col('dewPoint'), 2),
            'visibility'         => self::_meanInt($col('visibility')),
            'solEnergy'          => self::_mean($col('solEnergy'), 2),
            'solRadiation'       => self::_mean($col('solRadiation'), 2),
            'precipitation'      => $precip === [] ? null : round($precipTotal, 1),
            'precipitationHours' => $precipHours,
            'windSpeed'          => self::_mean($speeds, 2),
            'windSpeedMax'       => $speeds === [] ? null : round(max($speeds), 2),
            'windGust'           => $gusts === [] ? null : round(max($gusts), 2),
            'windDeg'            => self::circularMean($degs, $weights),
            'uvIndex'            => $uv === [] ? null : round(max($uv), 2),
            'weatherId'          => self::dailyWeatherId(
                $hours,
                $precipTotal,
                $precipHours,
                self::_mean($col('clouds'), 4)
            ),
        ];
    }

    /**
     * Collects the non-null numeric values of a column.
     *
     * @param array<int, array<string, mixed>> $rows Rows.
     * @param string                           $key  Column key.
     * @return array<int, float>
     */
    private static function _values(array $rows, string $key): array
    {
        $values = [];
        foreach ($rows as $row) {
            if (isset($row[$key]) && is_numeric($row[$key])) {
                $values[] = (float) $row[$key];
            }
        }

        return $values;
    }

    /**
     * Arithmetic mean rounded to $precision, or null for an empty list.
     *
     * @param array<int, float> $values    Values.
     * @param int               $precision Decimal places.
     * @return float|null
     */
    private static function _mean(array $values, int $precision): ?float
    {
        return $values === [] ? null : round(array_sum($values) / count($values), $precision);
    }

    /**
     * Arithmetic mean rounded to an integer, or null for an empty list.
     *
     * @param array<int, float> $values Values.
     * @return int|null
     */
    private static function _meanInt(array $values): ?int
    {
        return $values === [] ? null : (int) round(array_sum($values) / count($values));
    }

    /**
     * Whether a code is thunderstorm, drizzle, rain or snow (2xx, 3xx, 5xx, 6xx).
     *
     * @param int $id Weather code.
     * @return bool
     */
    private static function _isPrecipitation(int $id): bool
    {
        return ($id >= 200 && $id < 400) || ($id >= 500 && $id < 700);
    }

    /**
     * Severity rank of a precipitation code: thunderstorm > snow > rain > drizzle.
     *
     * @param int $id Weather code.
     * @return int Higher is more severe.
     */
    private static function _severity(int $id): int
    {
        return match (intdiv($id, 100)) {
            2       => 4,
            6       => 3,
            5       => 2,
            default => 1,
        };
    }

    /**
     * Most frequent code within the most severe group present.
     *
     * @param array<int, int> $ids Precipitation codes (non-empty).
     * @return int
     */
    private static function _mostSevere(array $ids): int
    {
        $top = max(array_map([self::class, '_severity'], $ids));

        return self::_mode(array_values(array_filter($ids, static fn (int $id) => self::_severity($id) === $top)));
    }

    /**
     * Most frequent value; ties resolve to the larger code.
     *
     * @param array<int, int> $ids Codes (non-empty).
     * @return int
     */
    private static function _mode(array $ids): int
    {
        $counts = array_count_values($ids);
        krsort($counts);
        arsort($counts);

        return (int) array_key_first($counts);
    }
}
