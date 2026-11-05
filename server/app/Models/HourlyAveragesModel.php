<?php

namespace App\Models;

use App\Entities\WeatherDataEntity;
use App\Libraries\ForecastAggregator;
use CodeIgniter\Model;

/**
 * Model for the hourly_averages table.
 *
 * Stores pre-computed hourly weather aggregates derived from raw_weather_data.
 * Consumed by the History controller (date ranges ≤7 days) and the
 * GetCurrentWeather / BackfillAnomalyLog / DetectAnomalies commands.
 *
 * @package App\Models
 */
class HourlyAveragesModel extends Model
{
    /** @var string[] Allowed interval strings for GROUP BY calculations */
    private const ALLOWED_INTERVALS = ['10 MINUTE', '1 HOUR', '1 DAY'];

    protected $table            = 'hourly_averages';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = WeatherDataEntity::class;
    protected $useSoftDeletes   = false;
    protected $allowedFields    = [
        'date',
        'temperature',
        'feels_like',
        'pressure',
        'humidity',
        'dew_point',
        'uv_index',
        'sol_energy',
        'sol_radiation',
        'precipitation',
        'clouds',
        'visibility',
        'wind_speed',
        'wind_deg',
        'wind_gust',
        'weather_id',
        'pm2_5',
        'pm10',
        'co',
        'no2',
        'so2',
        'o3',
    ];

    protected $useTimestamps = false;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $validationRules = [
        'date'          => 'required|valid_date',
        'temperature'   => 'permit_empty|decimal',
        'feels_like'    => 'permit_empty|decimal',
        'pressure'      => 'permit_empty|decimal',
        'humidity'      => 'permit_empty|decimal',
        'dew_point'     => 'permit_empty|decimal',
        'uv_index'      => 'permit_empty|decimal',
        'sol_energy'    => 'permit_empty|decimal',
        'sol_radiation' => 'permit_empty|decimal',
        'precipitation' => 'permit_empty|decimal',
        'clouds'        => 'permit_empty|decimal',
        'visibility'    => 'permit_empty|decimal',
        'wind_speed'    => 'permit_empty|decimal',
        'wind_deg'      => 'permit_empty|decimal',
        'wind_gust'     => 'permit_empty|decimal',
        'weather_id'    => 'permit_empty|integer',
        'pm2_5'         => 'permit_empty|decimal',
        'pm10'          => 'permit_empty|decimal',
        'co'            => 'permit_empty|decimal',
        'no2'           => 'permit_empty|decimal',
        'so2'           => 'permit_empty|decimal',
        'o3'            => 'permit_empty|decimal',
    ];

    protected $validationMessages = [];

    protected $skipValidation = false;

    /**
     * Returns hourly-grouped weather history rows within the given date range.
     *
     * @param string $startDate     Start of the date range (Y-m-d H:i:s).
     * @param string $endDate       End of the date range (Y-m-d H:i:s).
     * @param string $groupInterval Grouping interval — one of '10 MINUTE', '1 HOUR', '1 DAY'.
     * @return array Rows of grouped weather data.
     * @throws \InvalidArgumentException When $groupInterval is not in the allowed list.
     */
    public function getWeatherHistoryGrouped(string $startDate, string $endDate, string $groupInterval): array
    {
        if (!in_array(strtoupper($groupInterval), self::ALLOWED_INTERVALS, true)) {
            throw new \InvalidArgumentException('Invalid groupInterval value: ' . $groupInterval);
        }

        return $this
            ->select('DATE_FORMAT(date, "%Y-%m-%d %H:%i:00") as date,' . RawWeatherDataModel::getSelectAverageSQL())
            ->where('date >=', $startDate)
            ->where('date <=', $endDate)
            ->groupBy("FLOOR(UNIX_TIMESTAMP(date)/" . (strtotime('+' . $groupInterval) - strtotime('now')) . ")")
            ->orderBy('date', 'ASC')
            ->get()
            ->getResultArray();
    }

    /**
     * Rolls the hourly averages up into one row per UTC day, for daily_averages.
     *
     * Each hour weighs the same however many raw rows it had. Precipitation is the day's
     * total (sum of the hourly amounts), not an hourly mean; wind direction is a vector
     * mean; the weather code follows {@see ForecastAggregator::dailyWeatherId()}.
     *
     * By default it covers the previous and the current day, since the previous day's
     * last hour can still change after midnight ({@see RawWeatherDataModel::getHourlyAverages()}).
     *
     * @param string|null $since First day (Y-m-d H:i:s, inclusive); null = start of the previous day.
     * @param string|null $until End (Y-m-d H:i:s, exclusive); null = no end.
     * @return array<int, array<string, mixed>> Rows with `day`, `date` and the weather fields.
     */
    public function getDailyAverages(?string $since = null, ?string $until = null): array
    {
        $since ??= gmdate('Y-m-d 00:00:00', time() - 86400);
        $day     = 'DATE_FORMAT(date, "%Y-%m-%d 00:00:00")';
        $fields  = [];

        foreach (self::_dailyExpressions() as $field => $expression) {
            $fields[] = $expression . ' as ' . $field;
        }

        $builder = $this->builder()
            ->select($day . ' AS day, ' . $day . ' AS date, ' . implode(', ', $fields), false)
            ->where('date >=', $since);

        if ($until !== null) {
            $builder->where('date <', $until);
        }

        return $builder
            ->groupBy('day')
            ->orderBy('day', 'ASC')
            ->get()
            ->getResultArray();
    }

    /**
     * Aggregate expression of every daily field over the hourly rows, keyed by field name.
     *
     * @return array<string, string>
     */
    private static function _dailyExpressions(): array
    {
        $isPrecipitation = '(weather_id BETWEEN 200 AND 399 OR weather_id BETWEEN 500 AND 699)';
        $weatherId       = 'CASE
            WHEN SUM(' . $isPrecipitation . ') > 0
                AND (SUM(precipitation >= ' . ForecastAggregator::WET_HOUR_MM . ') >= ' . ForecastAggregator::WET_DAY_HOURS . '
                    OR COALESCE(SUM(precipitation), 0) >= ' . ForecastAggregator::WET_DAY_TOTAL_MM . ')
                THEN ' . RawWeatherDataModel::mostSevereWeatherIdSQL() . '
            WHEN SUM(weather_id BETWEEN 700 AND 799) >= ' . ForecastAggregator::FOG_DAY_HOURS . '
                THEN MAX(CASE WHEN weather_id BETWEEN 700 AND 799 THEN weather_id END)
            WHEN AVG(clouds) IS NOT NULL
                THEN ' . RawWeatherDataModel::cloudsWeatherIdSQL('AVG(clouds)') . '
            ELSE MAX(weather_id)
        END';

        $expressions = [];

        foreach (['temperature', 'feels_like', 'pressure', 'humidity', 'dew_point', 'uv_index', 'sol_energy', 'sol_radiation'] as $field) {
            $expressions[$field] = 'ROUND(AVG(' . $field . '), 2)';
        }

        return array_merge($expressions, [
            'precipitation' => 'ROUND(SUM(precipitation), 2)',
            'clouds'        => 'ROUND(AVG(clouds), 2)',
            'visibility'    => 'ROUND(AVG(visibility), 2)',
            'wind_speed'    => 'ROUND(AVG(wind_speed), 2)',
            'wind_deg'      => RawWeatherDataModel::windDirectionSQL(),
            'wind_gust'     => 'ROUND(AVG(wind_gust), 2)',
            'weather_id'    => $weatherId,
            'pm2_5'         => 'ROUND(AVG(pm2_5), 2)',
            'pm10'          => 'ROUND(AVG(pm10), 2)',
            'co'            => 'ROUND(AVG(co), 2)',
            'no2'           => 'ROUND(AVG(no2), 2)',
            'so2'           => 'ROUND(AVG(so2), 2)',
            'o3'            => 'ROUND(AVG(o3), 2)',
        ]);
    }
}
