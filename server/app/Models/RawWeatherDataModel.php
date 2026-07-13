<?php

namespace App\Models;

use App\Entities\WeatherDataEntity;
use CodeIgniter\Model;
use DateTime;

/**
 * Model for the raw_weather_data table.
 *
 * Stores per-observation readings from all sources (Arduino sensor, OpenWeatherMap,
 * WeatherAPI, VisualCrossing). Provides aggregation helpers consumed by the
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
    public const SOURCE_CUSTOMSTATION  = 'CustomStation';
    public const SOURCE_OTHERSOURCE    = 'OtherSource';

    /** @var string[] Allowed interval strings for GROUP BY calculations */
    private const ALLOWED_INTERVALS = ['10 MINUTE', '1 HOUR', '1 DAY'];

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
        'source'        => 'required|in_list[OpenWeatherMap,WeatherAPI,VisualCrossing,OpenMeteo,CustomStation,OtherSource]',
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
            'in_list' => 'The source must be one of: OpenWeatherMap, WeatherAPI, VisualCrossing, OpenMeteo, CustomStation, OtherSource.',
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

        // Get data for the last 20 minutes
        $recentAverages = $this->getRecentAverages($startDateTime, $currentDateTime);

        // Get the latest data for fields that are updated less frequently
        $latestData = $this->getLatestWeatherData(['precipitation', 'sol_energy', 'sol_radiation']); // 'sol_energy', 'sol_radiation', 'uv_index',
        $latestDate = $this->getLastUpdateTime();

        return array_merge(['date' => $latestDate], $recentAverages, $latestData);
    }

    /**
     * Retrieves hourly averages of weather data.
     *
     * @param bool $allTime If true, retrieves all-time data; otherwise, retrieves data for the current hour.
     * @return array The hourly averages of weather data.
     */
    public function getHourlyAverages(bool $allTime = false): array
    {
        $result = $this->select($this->_getAverageSelect('hour'));

        if (!$allTime) {
            $result
                ->where('date >= DATE_FORMAT(UTC_TIMESTAMP(), \'%Y-%m-%d %H:00:00\')')
                ->where('date < DATE_FORMAT(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR), \'%Y-%m-%d %H:00:00\')');
        }

        return $result
            ->groupBy('hour')
            ->get()
            ->getResultArray();
    }

    /**
     * Retrieves daily averages of weather data.
     *
     * @param bool $allTime If true, retrieves all-time data; otherwise, retrieves data for the current day.
     * @return array The daily averages of weather data.
     */
    public function getDailyAverages(bool $allTime = false): array
    {
        $result = $this->select($this->_getAverageSelect('day'));

        if (!$allTime) {
            $result
                ->where('date >= DATE_FORMAT(UTC_TIMESTAMP(), \'%Y-%m-%d 00:00:00\')')
                ->where('date < DATE_FORMAT(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY), \'%Y-%m-%d 00:00:00\')');
        }

        return $result
            ->groupBy('day')
            ->get()
            ->getResultArray();
    }

    /**
     * Retrieves recent averages of weather data for the last 3 records within a specified time range.
     *
     * @param DateTime $startDateTime The start of the time range for sampling data.
     * @param DateTime $currentDateTime The end of the time range for sampling data.
     * @return array The recent averages of weather data.
     */
    public function getRecentAverages(DateTime $startDateTime, DateTime $currentDateTime): array
    {
        return $this
            ->select(RawWeatherDataModel::getSelectAverageSQL())
            ->where('date >=', $startDateTime->format('Y-m-d H:i:s'))
            ->where('date <=', $currentDateTime->format('Y-m-d H:i:s'))
            ->limit(3)
            ->get()
            ->getRowArray();
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
     * All fields use AVG() with ROUND(). This method is used by multiple callers
     * that may query tables without a `source` column (e.g. hourly_averages,
     * daily_averages), so expressions that reference `source` must not appear here.
     *
     * @param string|null $type The specific type of weather data to retrieve averages for (e.g., 'temperature', 'humidity').
     *                          If null, retrieves averages for all types of weather data.
     * @return string The SQL query string for selecting average weather data.
     */
    public static function getSelectAverageSQL(?string $type = null): string
    {
        $fields = [
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
            'wind_deg'      => 'ROUND(AVG(wind_deg), 2) as wind_deg',
            'wind_gust'     => 'ROUND(AVG(wind_gust), 2) as wind_gust',
            'weather_id'    => 'MAX(weather_id) as weather_id',
            'pm2_5'         => 'ROUND(AVG(pm2_5), 2) as pm2_5',
            'pm10'          => 'ROUND(AVG(pm10), 2) as pm10',
            'co'            => 'ROUND(AVG(co), 2) as co',
            'no2'           => 'ROUND(AVG(no2), 2) as no2',
            'so2'           => 'ROUND(AVG(so2), 2) as so2',
            'o3'            => 'ROUND(AVG(o3), 2) as o3',
        ];

        // If a type is specified, return only it
        if ($type && isset($fields[$type])) {
            return $fields[$type] . ',';
        }

        // If type is not specified, return all fields
        return implode(',', $fields) . ',';
    }

    /**
     * Retrieves the SQL query string for selecting average weather data grouped by a specified interval.
     *
     * @param string $groupBy The interval for grouping data (e.g., 'hour', 'day').
     * @return string The SQL query string for selecting average weather data grouped by the specified interval.
     */
    private function _getAverageSelect(string $groupBy): string
    {
        $formatHours = $groupBy === 'hour' ? '%H:00:00' : '00:00:00';

        return 'DATE_FORMAT(date, "%Y-%m-%d ' . $formatHours . '") as ' . $groupBy . ',
                DATE_FORMAT(date, "%Y-%m-%d ' . $formatHours . '") AS date, ' . RawWeatherDataModel::getSelectAverageSQL();
    }
}
