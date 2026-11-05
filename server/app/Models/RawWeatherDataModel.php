<?php

namespace App\Models;

use App\Entities\WeatherDataEntity;
use App\Libraries\ForecastAggregator;
use CodeIgniter\Model;
use DateTime;

/**
 * Model for the raw_weather_data table.
 *
 * Stores per-observation readings from all sources (Arduino sensor, OpenWeatherMap,
 * WeatherAPI, VisualCrossing, OpenMeteo, airport METAR). Provides aggregation helpers consumed by the
 * GetCurrentWeather command and the History / Heatmap controllers.
 *
 * @package App\Models
 */
class RawWeatherDataModel extends Model
{
    public const SOURCE_OPENWEATHERMAP = 'OpenWeatherMap';
    public const SOURCE_WEATHERAPI     = 'WeatherAPI';
    public const SOURCE_VISUALCROSSING = 'VisualCrossing';
    public const SOURCE_OPENMETEO      = 'OpenMeteo';
    public const SOURCE_METAR          = 'Metar';
    public const SOURCE_CUSTOMSTATION  = 'CustomStation';
    public const SOURCE_OTHERSOURCE    = 'OtherSource';

    /** @var string[] Allowed interval strings for GROUP BY calculations */
    private const ALLOWED_INTERVALS = ['10 MINUTE', '1 HOUR', '1 DAY'];

    /**
     * Mean of the per-source mean precipitation of an hour (`r` = raw rows, `w` = rows per
     * hour and source, see {@see self::getHourlyAverages()}).
     */
    private const SOURCE_BALANCED_PRECIPITATION =
        'SUM(r.precipitation / w.n_precipitation) / COUNT(DISTINCT CASE WHEN r.precipitation IS NOT NULL THEN r.source END)';

    /** Mean of the per-source mean cloud cover of an hour, like {@see self::SOURCE_BALANCED_PRECIPITATION}. */
    private const SOURCE_BALANCED_CLOUDS =
        'SUM(r.clouds / w.n_clouds) / COUNT(DISTINCT CASE WHEN r.clouds IS NOT NULL THEN r.source END)';

    protected $table            = 'raw_weather_data';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = WeatherDataEntity::class;
    protected $useSoftDeletes   = false;
    protected $allowedFields    = [
        'date',
        'source',
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
        'source'        => 'required|in_list[OpenWeatherMap,WeatherAPI,VisualCrossing,OpenMeteo,Metar,CustomStation,OtherSource]',
        'temperature'   => 'permit_empty|decimal|greater_than_equal_to[-80]|less_than_equal_to[60]',
        'feels_like'    => 'permit_empty|decimal|greater_than_equal_to[-80]|less_than_equal_to[60]',
        'pressure'      => 'permit_empty|integer|greater_than_equal_to[800]|less_than_equal_to[1100]',
        'humidity'      => 'permit_empty|decimal|greater_than_equal_to[0]|less_than_equal_to[100]',
        'dew_point'     => 'permit_empty|decimal',
        'uv_index'      => 'permit_empty|decimal|greater_than_equal_to[0]|less_than_equal_to[20]',
        'sol_energy'    => 'permit_empty|decimal',
        'sol_radiation' => 'permit_empty|decimal',
        'precipitation' => 'permit_empty|decimal|greater_than_equal_to[0]|less_than_equal_to[500]',
        'clouds'        => 'permit_empty|integer|greater_than_equal_to[0]|less_than_equal_to[100]',
        'visibility'    => 'permit_empty|integer|greater_than_equal_to[0]|less_than_equal_to[100000]',
        'wind_speed'    => 'permit_empty|decimal|greater_than_equal_to[0]|less_than_equal_to[100]',
        'wind_deg'      => 'permit_empty|integer|greater_than_equal_to[0]|less_than_equal_to[360]',
        'wind_gust'     => 'permit_empty|decimal|greater_than_equal_to[0]|less_than_equal_to[150]',
        'weather_id'    => 'permit_empty|integer',
        'pm2_5'         => 'permit_empty|decimal|greater_than_equal_to[0]|less_than_equal_to[2000]',
        'pm10'          => 'permit_empty|decimal|greater_than_equal_to[0]|less_than_equal_to[2000]',
        'co'            => 'permit_empty|decimal|greater_than_equal_to[0]|less_than_equal_to[100000]',
        'no2'           => 'permit_empty|decimal|greater_than_equal_to[0]|less_than_equal_to[2000]',
        'so2'           => 'permit_empty|decimal|greater_than_equal_to[0]|less_than_equal_to[2000]',
        'o3'            => 'permit_empty|decimal|greater_than_equal_to[0]|less_than_equal_to[2000]',
    ];

    protected $validationMessages = [
        'source' => [
            'in_list' => 'The source must be one of: OpenWeatherMap, WeatherAPI, VisualCrossing, OpenMeteo, Metar, CustomStation, OtherSource.',
        ],
    ];

    protected $skipValidation = false;

    /**
     * Gets the current actual weather data.
     *
     * This method retrieves the current weather data by sampling data from the last 30 minutes,
     * getting recent averages, and the latest data for fields that are updated less frequently.
     *
     * @return array The current actual weather data.
     */
    public function getCurrentActualWeatherData(): array
    {
        $currentDateTime = new \DateTime();

        // Set the interval for data sampling (last 30 minutes)
        $intervalMinutes = 30;
        $startDateTime = clone $currentDateTime;
        $startDateTime->modify("-$intervalMinutes minutes");

        // Average of every row in that 30-minute window
        $recentAverages = $this->getRecentAverages($startDateTime, $currentDateTime);

        // Get the latest data for fields that are updated less frequently
        $latestData = $this->getLatestWeatherData(['precipitation', 'sol_energy', 'sol_radiation']); // 'sol_energy', 'sol_radiation', 'uv_index',
        $latestDate = $this->getLastUpdateTime();

        return array_merge(['date' => $latestDate], $recentAverages, $latestData);
    }

    /**
     * Retrieves hourly averages of weather data, one row per UTC hour.
     *
     * Every field is averaged over the rows of the hour, so the station (a reading every
     * minute) dominates the fields it measures. Precipitation and cloud cover come only from
     * the API sources, which report at different cadences, so those two are the mean of the
     * per-source means: a source reporting twice an hour does not count twice.
     *
     * By default it covers the previous and the current hour: API sources report with a
     * delay, so a row of the previous hour can still arrive after that hour is over.
     *
     * @param string|null $since First hour (Y-m-d H:i:s, inclusive); null = start of the previous hour.
     * @param string|null $until End (Y-m-d H:i:s, exclusive); null = no end.
     * @return array The hourly averages of weather data.
     */
    public function getHourlyAverages(?string $since = null, ?string $until = null): array
    {
        $since ??= gmdate('Y-m-d H:00:00', time() - 3600);
        $range   = 'date >= ?' . ($until !== null ? ' AND date < ?' : '');
        $binds   = $until !== null ? [$since, $until] : [$since];
        $hour    = 'DATE_FORMAT(r.date, "%Y-%m-%d %H:00:00")';

        $fields = self::_averageExpressions(self::SOURCE_BALANCED_PRECIPITATION, self::SOURCE_BALANCED_CLOUDS);
        $fields['precipitation'] = 'ROUND(' . self::SOURCE_BALANCED_PRECIPITATION . ', 2) as precipitation';
        $fields['clouds']        = 'ROUND(' . self::SOURCE_BALANCED_CLOUDS . ', 2) as clouds';

        return $this->db
            ->query(
                'SELECT ' . $hour . ' AS hour, ' . $hour . ' AS date, ' . implode(', ', $fields) . '
                 FROM raw_weather_data r
                 JOIN (
                     SELECT DATE_FORMAT(date, "%Y-%m-%d %H:00:00") AS slot, source,
                            COUNT(precipitation) AS n_precipitation, COUNT(clouds) AS n_clouds
                     FROM raw_weather_data
                     WHERE ' . $range . '
                     GROUP BY slot, source
                 ) w ON w.slot = ' . $hour . ' AND w.source = r.source
                 WHERE r.' . $range . '
                 GROUP BY hour
                 ORDER BY hour',
                array_merge($binds, $binds)
            )
            ->getResultArray();
    }

    /**
     * Retrieves the averages of all weather rows within a specified time range.
     *
     * @param DateTime $startDateTime The start of the time range for sampling data.
     * @param DateTime $currentDateTime The end of the time range for sampling data.
     * @return array The recent averages of weather data, or an empty array when no rows match.
     */
    public function getRecentAverages(DateTime $startDateTime, DateTime $currentDateTime): array
    {
        return $this
            ->select(RawWeatherDataModel::getSelectAverageSQL())
            ->where('date >=', $startDateTime->format('Y-m-d H:i:s'))
            ->where('date <=', $currentDateTime->format('Y-m-d H:i:s'))
            ->get()
            ->getRowArray() ?? [];
    }

    /**
     * Retrieves the latest data for specified fields that are updated less frequently.
     *
     * This method fetches the most recent non-null values for the given fields
     * within the last 3 hours.
     *
     * @param array $fields The fields for which to retrieve the latest data.
     * @return array An associative array where keys are field names and values are the latest data.
     */
    public function getLatestWeatherData(array $fields): array
    {
        if (empty($fields)) {
            return [];
        }

        $result = [];
        foreach ($fields as $field) {
            $data = $this->select($field)
                ->where($field . ' is NOT NULL')
                ->where('date >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 3 HOUR)')
                ->orderBy('date', 'DESC')
                ->limit(1)
                ->first();

            $result[$field] = $data?->{$field};
        }

        return $result;
    }

    /**
     * Retrieves the timestamp of the most recent record in the table.
     *
     * @return \DateTime|string|null The date of the last update, or null if no data is found.
     */
    public function getLastUpdateTime(): mixed
    {
        $data = $this->select('date')
            ->orderBy('date', 'DESC')
            ->limit(1)
            ->first();

        return $data?->date;
    }

    /**
     * Retrieves all raw weather observations recorded on or after the given
     * date, ordered chronologically (oldest first). Used by the Events feed
     * to dynamically derive value-change, wind-gust, and precipitation
     * entries without persisting any additional data.
     *
     * @param DateTime $since Earliest date/time (inclusive) to include.
     * @return array Rows as WeatherDataEntity instances, ordered by date ASC.
     */
    public function getRowsSince(DateTime $since): array
    {
        return $this
            ->where('date >=', $since->format('Y-m-d H:i:s'))
            ->orderBy('date', 'ASC')
            ->findAll();
    }

    /**
     * Retrieves weather history data grouped by a specified interval.
     *
     * @param string      $startDate     Start of the date range (Y-m-d H:i:s).
     * @param string      $endDate       End of the date range (Y-m-d H:i:s).
     * @param string      $groupInterval Grouping interval — one of '10 MINUTE', '1 HOUR', '1 DAY'.
     * @param string|null $type          Optional specific field type to aggregate (e.g. 'temperature').
     * @return array Rows of grouped weather data.
     * @throws \InvalidArgumentException When $groupInterval is not in the allowed list.
     */
    public function getWeatherHistoryGrouped(string $startDate, string $endDate, string $groupInterval, ?string $type = null): array
    {
        if (!in_array(strtoupper($groupInterval), self::ALLOWED_INTERVALS, true)) {
            throw new \InvalidArgumentException('Invalid groupInterval value: ' . $groupInterval);
        }

        return $this
            ->select('DATE_FORMAT(date, "%Y-%m-%d %H:%i:00") as date,' . RawWeatherDataModel::getSelectAverageSQL($type))
            ->where('date >=', $startDate)
            ->where('date <=', $endDate)
            ->groupBy("FLOOR(UNIX_TIMESTAMP(date)/" . (strtotime('+' . $groupInterval) - strtotime('now')) . ")")
            ->orderBy('date', 'ASC')
            ->get()
            ->getResultArray();
    }

    /**
     * Retrieves the SQL query string for selecting average weather data.
     *
     * Most fields use AVG() with ROUND(); wind direction is a vector mean and the weather
     * code is the one representing the bucket ({@see self::weatherIdSQL()}). This method
     * is used by multiple callers that may query tables without a `source` column
     * (e.g. hourly_averages, daily_averages), so expressions that reference `source`
     * must not appear here.
     *
     * @param string|null $type The specific type of weather data to retrieve averages for (e.g., 'temperature', 'humidity').
     *                          If null, retrieves averages for all types of weather data.
     * @return string The SQL query string for selecting average weather data.
     */
    public static function getSelectAverageSQL(?string $type = null): string
    {
        $fields = self::_averageExpressions('AVG(precipitation)', 'AVG(clouds)');

        // If a type is specified, return only it
        if ($type && isset($fields[$type])) {
            return $fields[$type] . ',';
        }

        // If type is not specified, return all fields
        return implode(',', $fields) . ',';
    }

    /**
     * Vector mean of `wind_deg` as an integer 0..359: the arithmetic mean of 350° and 10°
     * would be 180°, the vector mean is 0°.
     *
     * @return string SQL expression.
     */
    public static function windDirectionSQL(): string
    {
        return 'MOD(ROUND(DEGREES(ATAN2(AVG(SIN(RADIANS(wind_deg))), AVG(COS(RADIANS(wind_deg)))))) + 360, 360)';
    }

    /**
     * The weather code representing a group of rows, by the rules of
     * {@see ForecastAggregator::representativeWeatherId()}: thunderstorm, rain or snow when
     * the group is wet or most sources report it (the most severe one; within that group
     * the highest code), then fog when most sources report it, then the code of the mean
     * cloud cover. MAX() alone would pick overcast (804) over rain (5xx).
     *
     * @param string $precipitation SQL expression of the group's mean precipitation, mm.
     * @param string $clouds        SQL expression of the group's mean cloud cover, %.
     * @return string SQL expression.
     */
    public static function weatherIdSQL(string $precipitation, string $clouds): string
    {
        $isPrecipitation = self::_isPrecipitationSQL();
        $isFog           = '(weather_id BETWEEN 700 AND 799)';

        return 'CASE
            WHEN SUM(' . $isPrecipitation . ') > 0
                AND (COALESCE(' . $precipitation . ', 0) >= ' . ForecastAggregator::WET_HOUR_MM . '
                    OR SUM(' . $isPrecipitation . ') * 2 > COUNT(weather_id))
                THEN ' . self::mostSevereWeatherIdSQL() . '
            WHEN SUM(' . $isFog . ') * 2 > COUNT(weather_id)
                THEN MAX(CASE WHEN ' . $isFog . ' THEN weather_id END)
            WHEN ' . $clouds . ' IS NOT NULL
                THEN ' . self::cloudsWeatherIdSQL($clouds) . '
            ELSE MAX(weather_id)
        END';
    }

    /**
     * The most severe precipitation code of a group (thunderstorm > snow > rain > drizzle,
     * the highest code within that class), by {@see ForecastAggregator}'s severity order.
     *
     * @return string SQL expression.
     */
    public static function mostSevereWeatherIdSQL(): string
    {
        return 'MOD(MAX(CASE WHEN ' . self::_isPrecipitationSQL() . ' THEN '
            . '(CASE FLOOR(weather_id / 100) WHEN 2 THEN 4 WHEN 6 THEN 3 WHEN 5 THEN 2 ELSE 1 END) * 1000 + weather_id'
            . ' END), 1000)';
    }

    /**
     * Clear/clouds code (800..804) of a cloud cover, by {@see ForecastAggregator::cloudsToWeatherId()}.
     *
     * @param string $clouds SQL expression of the cloud cover, %.
     * @return string SQL expression.
     */
    public static function cloudsWeatherIdSQL(string $clouds): string
    {
        return 'CASE WHEN ' . $clouds . ' < 11 THEN 800 WHEN ' . $clouds . ' < 25 THEN 801 WHEN '
            . $clouds . ' < 50 THEN 802 WHEN ' . $clouds . ' < 85 THEN 803 ELSE 804 END';
    }

    /**
     * Aggregate expression of every weather field, keyed by field name.
     *
     * @param string $precipitation SQL expression of the mean precipitation (used by the weather code).
     * @param string $clouds        SQL expression of the mean cloud cover (used by the weather code).
     * @return array<string, string>
     */
    private static function _averageExpressions(string $precipitation, string $clouds): array
    {
        return [
            'temperature'   => 'ROUND(AVG(temperature), 2) as temperature',
            'feels_like'    => 'ROUND(AVG(feels_like), 2) as feels_like',
            'pressure'      => 'ROUND(AVG(pressure), 2) as pressure',
            'humidity'      => 'ROUND(AVG(humidity), 2) as humidity',
            'dew_point'     => 'ROUND(AVG(dew_point), 2) as dew_point',
            'uv_index'      => 'ROUND(AVG(uv_index), 2) as uv_index',
            'sol_energy'    => 'ROUND(AVG(sol_energy), 2) as sol_energy',
            'sol_radiation' => 'ROUND(AVG(sol_radiation), 2) as sol_radiation',
            'precipitation' => 'ROUND(AVG(precipitation), 2) as precipitation',
            'clouds'        => 'ROUND(AVG(clouds), 2) as clouds',
            'visibility'    => 'ROUND(AVG(visibility), 2) as visibility',
            'wind_speed'    => 'ROUND(AVG(wind_speed), 2) as wind_speed',
            'wind_deg'      => self::windDirectionSQL() . ' as wind_deg',
            'wind_gust'     => 'ROUND(AVG(wind_gust), 2) as wind_gust',
            'weather_id'    => self::weatherIdSQL($precipitation, $clouds) . ' as weather_id',
            'pm2_5'         => 'ROUND(AVG(pm2_5), 2) as pm2_5',
            'pm10'          => 'ROUND(AVG(pm10), 2) as pm10',
            'co'            => 'ROUND(AVG(co), 2) as co',
            'no2'           => 'ROUND(AVG(no2), 2) as no2',
            'so2'           => 'ROUND(AVG(so2), 2) as so2',
            'o3'            => 'ROUND(AVG(o3), 2) as o3',
        ];
    }

    /**
     * Whether `weather_id` is thunderstorm, drizzle, rain or snow (2xx, 3xx, 5xx, 6xx).
     *
     * @return string SQL condition.
     */
    private static function _isPrecipitationSQL(): string
    {
        return '(weather_id BETWEEN 200 AND 399 OR weather_id BETWEEN 500 AND 699)';
    }
}
