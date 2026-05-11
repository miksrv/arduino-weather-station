<?php

namespace App\Controllers;

use App\Entities\WeatherData;
use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
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
    /** @var int Cache TTL for recent data requests (1 hour) */
    public const CACHE_TTL_RECENT = 60 * 60;

    /** @var int Cache TTL for purely historical requests (indefinite — use 0 for no expiry) */
    public const CACHE_TTL_HISTORICAL = 0;

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

        // Calculate range in hours for cache decision
        $startTimestamp = strtotime($startDate ?? 'today');
        $endTimestamp   = strtotime($endDate ?? 'today');
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

        $cacheKey = 'history_' . md5(($startDate ?? '') . '_' . ($endDate ?? ''));
        $rawData  = cache()->get($cacheKey);

        if (!is_array($rawData)) {
            $rawData = $this->_getData();

            if ($rawData instanceof ResponseInterface) {
                return $rawData;
            }

            // Recent end-dates get a short TTL; purely historical data is cached indefinitely
            $recentThreshold = strtotime('-' . self::CACHE_RECENT_DAYS_THRESHOLD . ' days');
            $ttl = $endTimestamp >= $recentThreshold
                ? self::CACHE_TTL_RECENT
                : self::CACHE_TTL_HISTORICAL;

            cache()->save($cacheKey, $rawData, $ttl);
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
            'Visibility', 'UV Index', 'Solar Energy', 'Solar Radiation', 'Clouds',
            'Precipitation', 'Wind Speed', 'Wind Gust', 'Wind Degree',
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

        if ($endTimestamp - $startTimestamp > 366 * 86400) {
            return $this->failValidationErrors('Date range cannot exceed 366 days.');
        }

        $dateDiff  = ($endTimestamp - $startTimestamp) / (60 * 60 * 24);
        $startDate = date('Y-m-d 00:00:00', $startTimestamp);
        $endDate   = date('Y-m-d 23:59:59', $endTimestamp);

        if ($dateDiff <= 1) {
            return $this->weatherDataModel->getWeatherHistoryGrouped($startDate, $endDate, '10 MINUTE');
        }

        if ($dateDiff <= 7) {
            return $this->hourlyAveragesModel->getWeatherHistoryGrouped($startDate, $endDate, '1 HOUR');
        }

        return $this->dailyAveragesModel->getWeatherHistoryGrouped($startDate, $endDate, '1 DAY');
    }
}
