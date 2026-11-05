<?php

namespace App\Controllers;

use App\Entities\WeatherData;
use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Config\App;
use DateTimeImmutable;
use DateTimeZone;
use Exception;

/**
 * Class History
 *
 * Handles retrieval of historical weather data in JSON and CSV formats.
 *
 * @package App\Controllers
 */
class History extends ResourceController
{
    /** @var int Cache TTL for ranges that include today of the station (5 minutes; the client polls them) */
    public const CACHE_TTL_CURRENT = 5 * 60;

    /** @var int Cache TTL for ranges ending within the last few days (1 hour) */
    public const CACHE_TTL_RECENT = 60 * 60;

    /** @var int Cache TTL for purely historical requests (7 days; always finite so rebuilt aggregates show up) */
    public const CACHE_TTL_HISTORICAL = 7 * 24 * 60 * 60;

    /** @var int Minimum range in hours to enable caching */
    public const CACHE_MIN_RANGE_HOURS = 48;

    /** @var int Number of days to consider data as "recent" (not fully historical) */
    public const CACHE_RECENT_DAYS_THRESHOLD = 7;

    protected $format = 'json';

    protected RawWeatherDataModel $weatherDataModel;
    protected HourlyAveragesModel $hourlyAveragesModel;
    protected DailyAveragesModel  $dailyAveragesModel;

    /**
     * Initialises the raw, hourly, and daily weather data models.
     */
    public function __construct()
    {
        $this->weatherDataModel    = new RawWeatherDataModel();
        $this->hourlyAveragesModel = new HourlyAveragesModel();
        $this->dailyAveragesModel  = new DailyAveragesModel();
    }

    /**
     * Returns historical weather data for a given date range.
     *
     * Query parameters:
     *   - start_date (required): range start (any strtotime-compatible string)
     *   - end_date (required): range end (any strtotime-compatible string)
     *
     * @return ResponseInterface
     * @throws Exception
     */
    public function getHistoryWeather(): ResponseInterface
    {
        $startDate = $this->request->getGet('start_date');
        $endDate   = $this->request->getGet('end_date');

        // Calculate range in hours for cache decision (non-string input is rejected by _getData())
        $startTimestamp = strtotime(is_string($startDate) ? $startDate : 'today') ?: 0;
        $endTimestamp   = strtotime(is_string($endDate) ? $endDate : 'today') ?: 0;
        $rangeHours     = ($endTimestamp - $startTimestamp) / 3600;

        // Disable caching for short ranges (≤48 h) due to timezone differences
        if ($rangeHours <= self::CACHE_MIN_RANGE_HOURS) {
            $rawData = $this->_getData();

            if ($rawData instanceof ResponseInterface) {
                return $rawData;
            }

            $result = [];
            foreach ($rawData as $data) {
                $result[] = new WeatherData($data);
            }

            return $this->respond($result);
        }

        // Key on normalised dates so arbitrary strtotime() spellings cannot create unbounded cache entries;
        // the grouping is part of the key because _getData() picks hourly or daily rows from the exact time span
        $grouping = $rangeHours <= 7 * 24 ? 'hourly' : 'daily';
        $cacheKey = 'history_' . hash('sha256', date('Y-m-d', $startTimestamp) . '_' . date('Y-m-d', $endTimestamp) . '_' . $grouping);
        $rawData  = cache()->get($cacheKey);

        if (!is_array($rawData)) {
            $rawData = $this->_getData();

            if ($rawData instanceof ResponseInterface) {
                return $rawData;
            }

            // Empty results are not cached: data may arrive (or be rebuilt) shortly after
            if ($rawData !== []) {
                cache()->save($cacheKey, $rawData, $this->_cacheTtl($endTimestamp));
            }
        }

        $result = [];

        foreach ($rawData as $data) {
            $result[] = new WeatherData($data);
        }

        return $this->respond($result);
    }

    /**
     * Returns historical weather data as a downloadable CSV file.
     *
     * Query parameters:
     *   - start_date (required): range start
     *   - end_date (required): range end
     *
     * @return ResponseInterface
     * @throws Exception
     */
    public function getHistoryWeatherCSV(): ResponseInterface
    {
        $rawData = $this->_getData();

        if ($rawData instanceof ResponseInterface) {
            return $rawData;
        }

        // CSV column headers
        $csvHeader = [
            'UTC Date', 'Temperature', 'Feels Like', 'Pressure', 'Humidity', 'Dew Point',
            'UV Index', 'Solar Energy', 'Solar Radiation', 'Precipitation', 'Clouds',
            'Visibility', 'Wind Speed', 'Wind Gust', 'Wind Degree',
        ];

        // Write CSV into a temporary in-memory stream
        $tempFile = fopen('php://temp', 'r+');

        fputcsv($tempFile, $csvHeader);

        foreach ($rawData as $data) {
            $row = [
                $data['date'],
                $data['temperature'],
                $data['feels_like'],
                $data['pressure'],
                $data['humidity'],
                $data['dew_point'],
                $data['uv_index'],
                $data['sol_energy'],
                $data['sol_radiation'],
                $data['precipitation'],
                $data['clouds'],
                $data['visibility'],
                $data['wind_speed'],
                $data['wind_gust'],
                $data['wind_deg'],
            ];

            fputcsv($tempFile, $row);
        }

        rewind($tempFile);
        $csvContent = stream_get_contents($tempFile);
        fclose($tempFile);

        return $this->response
            ->setHeader('Content-Type', 'text/csv')
            ->setHeader('Content-Disposition', 'attachment; filename="weather_history.csv"')
            ->setBody($csvContent);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Validates request parameters and fetches historical weather data from the
     * appropriate model, choosing the grouping interval based on the date range.
     *
     * Grouping rules:
     *   - ≤1 day  → raw data, 10-minute buckets
     *   - ≤7 days → hourly averages, 1-hour buckets
     *   - >7 days → daily averages, 1-day buckets
     *
     * @return array|ResponseInterface Data rows on success; error response on validation failure.
     */
    private function _getData(): array|ResponseInterface
    {
        $startDate = $this->request->getGet('start_date');
        $endDate   = $this->request->getGet('end_date');

        if (!$startDate || !$endDate) {
            return $this->failValidationErrors('Missing required parameters: start_date or end_date');
        }

        if (!is_string($startDate) || !is_string($endDate)) {
            return $this->failValidationErrors('Invalid date format');
        }

        $startTimestamp      = strtotime($startDate);
        $endTimestamp        = strtotime($endDate);
        $minTimestamp        = strtotime('2020-01-01');
        $maxAllowedTimestamp = strtotime('tomorrow 23:59:59');

        if ($startTimestamp === false || $endTimestamp === false) {
            return $this->failValidationErrors('Invalid date format');
        }

        if ($startTimestamp > $maxAllowedTimestamp || $endTimestamp > $maxAllowedTimestamp) {
            return $this->failValidationErrors('Date cannot be in the future');
        }

        if ($startTimestamp < $minTimestamp) {
            return $this->failValidationErrors('Date cannot be before 2020-01-01');
        }

        if ($endTimestamp < $startTimestamp) {
            return $this->failValidationErrors('end_date cannot be earlier than start_date');
        }

        if ($endTimestamp - $startTimestamp > 366 * 86400) {
            return $this->failValidationErrors('Date range cannot exceed 366 days.');
        }

        // The client sends dates of the station's time zone; the readings are stored in UTC
        $dateDiff  = ($endTimestamp - $startTimestamp) / (60 * 60 * 24);
        $startDate = $this->_stationToUtc(date('Y-m-d 00:00:00', $startTimestamp));
        $endDate   = $this->_stationToUtc(date('Y-m-d 23:59:59', $endTimestamp));

        if ($dateDiff <= 1) {
            return $this->weatherDataModel->getWeatherHistoryGrouped($startDate, $endDate, '10 MINUTE');
        }

        if ($dateDiff <= 7) {
            return $this->hourlyAveragesModel->getWeatherHistoryGrouped($startDate, $endDate, '1 HOUR');
        }

        return $this->dailyAveragesModel->getWeatherHistoryGrouped($startDate, $endDate, '1 DAY');
    }

    /**
     * Converts a date-time of the station's time zone to a UTC Y-m-d H:i:s string.
     *
     * @param string $stationDateTime Date-time in the station's time zone.
     * @return string The same instant in UTC.
     */
    private function _stationToUtc(string $stationDateTime): string
    {
        return (new DateTimeImmutable($stationDateTime, new DateTimeZone(config(App::class)->stationTimezone)))
            ->setTimezone(new DateTimeZone('UTC'))
            ->format('Y-m-d H:i:s');
    }

    /**
     * Picks the cache TTL by how close the range end is to today of the station.
     *
     * @param int $endTimestamp Range end (its date part is a station-local date).
     * @return int TTL in seconds.
     */
    private function _cacheTtl(int $endTimestamp): int
    {
        $today = (new DateTimeImmutable('now', new DateTimeZone(config(App::class)->stationTimezone)))->format('Y-m-d');
        $endDay = date('Y-m-d', $endTimestamp);

        if ($endDay >= $today) {
            return self::CACHE_TTL_CURRENT;
        }

        $threshold = date('Y-m-d', strtotime($today . ' -' . self::CACHE_RECENT_DAYS_THRESHOLD . ' days'));

        return $endDay >= $threshold ? self::CACHE_TTL_RECENT : self::CACHE_TTL_HISTORICAL;
    }
}
