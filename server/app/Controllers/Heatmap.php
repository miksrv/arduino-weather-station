<?php

namespace App\Controllers;

use App\Entities\WeatherData;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Exception;

/**
 * Class Heatmap
 *
 * Handles retrieval of time-series weather data grouped for heatmap visualisations.
 *
 * @package App\Controllers
 */
class Heatmap extends ResourceController
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

    /**
     * Initialises the raw weather data model.
     */
    public function __construct()
    {
        $this->weatherDataModel = new RawWeatherDataModel();
    }

    /**
     * Returns time-bucketed weather data for a specific type and date range.
     *
     * Query parameters:
     *   - type (required): one of temperature, pressure, humidity, precipitation, clouds, wind_speed
     *   - start_date (required): start of the range (any strtotime-compatible string)
     *   - end_date (required): end of the range (any strtotime-compatible string)
     *
     * @return ResponseInterface
     * @throws Exception
     */
    public function getHeatmapData(): ResponseInterface
    {
        $type         = $this->request->getGet('type');
        $rawStartDate = $this->request->getGet('start_date');
        $rawEndDate   = $this->request->getGet('end_date');

        // Allowed weather parameter types
        $validTypes = ['temperature', 'pressure', 'humidity', 'precipitation', 'clouds', 'wind_speed'];

        // Validate type
        if (!$type || !in_array($type, $validTypes, strict: true)) {
            return $this->failValidationErrors('Invalid or missing type parameter. Valid values: ' . implode(', ', $validTypes));
        }

        // Validate presence of date parameters
        if (!$rawStartDate || !$rawEndDate) {
            return $this->failValidationErrors('Missing required parameters: start_date or end_date');
        }

        $startTimestamp = strtotime($rawStartDate);
        $endTimestamp   = strtotime($rawEndDate);

        if ($startTimestamp === false || $endTimestamp === false) {
            return $this->failValidationErrors('Invalid date format');
        }

        $currentTimestamp = time();
        $minTimestamp     = strtotime('2020-01-01');

        if ($startTimestamp > $currentTimestamp || $startTimestamp < $minTimestamp) {
            return $this->failValidationErrors('Date is out of valid range. It cannot be in the future or before 2020-01-01.');
        }

        if ($endTimestamp - $startTimestamp > 366 * 86400) {
            return $this->failValidationErrors('Date range cannot exceed 366 days.');
        }

        // Normalise dates to full-day boundaries
        $startDate  = date('Y-m-d 00:00:00', $startTimestamp);
        $endDate    = date('Y-m-d 23:59:59', $endTimestamp);
        $rangeHours = ($endTimestamp - $startTimestamp) / 3600;

        // Disable caching for short ranges (≤48 h) due to timezone differences
        if ($rangeHours <= self::CACHE_MIN_RANGE_HOURS) {
            $rawData = $this->weatherDataModel->getWeatherHistoryGrouped($startDate, $endDate, '10 MINUTE', $type);

            if (empty($rawData)) {
                return $this->failNotFound('No data found for the given date range and type');
            }

            $result = [];
            foreach ($rawData as $data) {
                $result[] = new WeatherData($data);
            }

            return $this->respond($result);
        }

        $cacheKey = 'heatmap_' . md5($type . '_' . $rawStartDate . '_' . $rawEndDate);
        $rawData  = cache()->get($cacheKey);

        if (!is_array($rawData)) {
            $rawData = $this->weatherDataModel->getWeatherHistoryGrouped($startDate, $endDate, '10 MINUTE', $type);

            if (!empty($rawData)) {
                // Recent end-dates get a short TTL; purely historical data is cached indefinitely
                $recentThreshold = strtotime('-' . self::CACHE_RECENT_DAYS_THRESHOLD . ' days');
                $ttl = $endTimestamp >= $recentThreshold
                    ? self::CACHE_TTL_RECENT
                    : self::CACHE_TTL_HISTORICAL;

                cache()->save($cacheKey, $rawData, $ttl);
            }
        }

        if (empty($rawData)) {
            return $this->failNotFound('No data found for the given date range and type');
        }

        $result = [];

        foreach ($rawData as $data) {
            $result[] = new WeatherData($data);
        }

        return $this->respond($result);
    }
}
