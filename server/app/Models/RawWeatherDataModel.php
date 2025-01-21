<?php

namespace App\Models;

use App\Entities\WeatherDataEntity;
use CodeIgniter\Model;
use DateTime;

/**
 * Class RawWeatherDataModel
 *
 * This class handles the retrieval and processing of raw weather data from various sources.
 *
 * @package App\Models
 *
 * Public Methods:
 * - getCurrentActualWeatherData(): Retrieves the current actual weather data by sampling data from the last 30 minutes.
 * - getHourlyAverages(bool $allTime = false): Retrieves hourly averages of weather data.
 * - getDailyAverages(bool $allTime = false): Retrieves daily averages of weather data.
 * - getRecentAverages(DateTime $startDateTime, DateTime $currentDateTime): Retrieves recent averages of weather data for the last 3 records within a specified time range.
 * - getLatestWeatherData(array $fields): Retrieves the latest data for specified fields that are updated less frequently.
 * - getLastUpdateTime(): Retrieves the time of the last update of data in the database.
 * - getWeatherHistoryGrouped(string $startDate, string $endDate, string $groupInterval, string|null $type = null): Retrieves weather history data grouped by a specified interval.
 *
 * Usage:
 * $rawWeatherDataModel = new RawWeatherDataModel();
 * $currentWeather = $rawWeatherDataModel->getCurrentActualWeatherData();
 * $hourlyAverages = $rawWeatherDataModel->getHourlyAverages();
 * $dailyAverages = $rawWeatherDataModel->getDailyAverages();
 * $recentAverages = $rawWeatherDataModel->getRecentAverages(new DateTime('-30 minutes'), new DateTime());
 * $latestData = $rawWeatherDataModel->getLatestWeatherData(['precipitation', 'sol_energy']);
 * $lastUpdate = $rawWeatherDataModel->getLastUpdateTime();
 * $weatherHistory = $rawWeatherDataModel->getWeatherHistoryGrouped('2023-01-01', '2023-01-31', '+1 hour');
 */
class RawWeatherDataModel extends Model
{
    const SOURCE_OPENWEATHERMAP = 'OpenWeatherMap';
    const SOURCE_WEATHERAPI     = 'WeatherAPI';
    const SOURCE_VISUALCROSSING = 'VisualCrossing';
    const SOURCE_CUSTOMSTATION  = 'CustomStation';
    const SOURCE_OTHERSOURCE    = 'OtherSource';

    protected $table         = 'raw_weather_data';
    protected $primaryKey    = 'id';
    protected $useTimestamps = false;
    protected $returnType    = WeatherDataEntity::class;
    protected $allowedFields = [
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
        'weather_id'
    ];

    protected $validationRules = [
        'date'          => 'required|valid_date',
        'source'        => 'required|in_list[OpenWeatherMap,WeatherAPI,VisualCrossing,CustomStation,OtherSource]',
        'temperature'   => 'permit_empty|decimal',
        'feels_like'    => 'permit_empty|decimal',
        'pressure'      => 'permit_empty|integer',
        'humidity'      => 'permit_empty|decimal',
        'dew_point'     => 'permit_empty|decimal',
        'uv_index'      => 'permit_empty|decimal',
        'sol_energy'    => 'permit_empty|decimal',
        'sol_radiation' => 'permit_empty|decimal',
        'precipitation' => 'permit_empty|decimal',
        'clouds'        => 'permit_empty|integer',
        'visibility'    => 'permit_empty|integer',
        'wind_speed'    => 'permit_empty|decimal',
        'wind_deg'      => 'permit_empty|integer',
        'wind_gust'     => 'permit_empty|decimal',
        'weather_id'    => 'permit_empty|integer',
    ];

    protected $validationMessages = [
        'source' => [
            'in_list' => 'The source must be one of: OpenWeatherMap, WeatherAPI, VisualCrossing, CustomStation, OtherSource.',
        ],
    ];

    protected array $casts = [
        'date'          => 'datetime',
        'temperature'   => '?float',
        'feels_like'    => '?float',
        'pressure'      => '?int',
        'humidity'      => '?float',
        'dew_point'     => '?float',
        'uv_index'      => '?float',
        'sol_energy'    => '?float',
        'sol_radiation' => '?float',
        'precipitation' => '?float',
        'clouds'        => '?int',
        'visibility'    => '?int',
        'wind_speed'    => '?float',
        'wind_deg'      => '?int',
        'wind_gust'     => '?float',
        'weather_id'    => '?int',
    ];

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
     * Retrieves the time of the last update of data in the database.
     *
     * This method fetches the most recent date from the `raw_weather_data` table.
     *
     * @return mixed|null The date of the last update, or null if no data is found.
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
     * @param string $startDate The start date for the data range.
     * @param string $endDate The end date for the data range.
     * @param string $groupInterval The interval for grouping data (e.g., '+1 hour', '+1 day').
     * @param string|null $type The type of data to retrieve (optional).
     * @return array The weather history data grouped by the specified interval.
     */
    public function getWeatherHistoryGrouped($startDate, $endDate, $groupInterval, $type = null): array
    {
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
     * @param string|null $type The specific type of weather data to retrieve averages for (e.g., 'temperature', 'humidity').
     *                          If null, retrieves averages for all types of weather data.
     * @return string The SQL query string for selecting average weather data.
     */
    static public function getSelectAverageSQL(?string $type = null): string
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
