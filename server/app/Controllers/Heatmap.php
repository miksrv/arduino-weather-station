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
 * This class handles the retrieval of heatmap data for various weather types.
 *
 * @package App\Controllers
 *
 * Public Methods:
 * - getHeatmapData(): Retrieves heatmap data for a specific weather type within a given date range.
 *
 * Usage:
 * $heatmap = new Heatmap();
 * $heatmap->getHeatmapData();
 */
class Heatmap extends ResourceController {
    /** @var int Cache TTL for recent data requests (1 hour) */
    public const CACHE_TTL_RECENT = 60 * 60;

    /** @var int Cache TTL for purely historical requests (indefinite) */
    public const CACHE_TTL_HISTORICAL = 0;

    /** @var int Minimum range in hours to enable caching */
    public const CACHE_MIN_RANGE_HOURS = 48;

    /** @var int Number of days to consider data as "recent" (not fully historical) */
    public const CACHE_RECENT_DAYS_THRESHOLD = 7;

    protected RawWeatherDataModel $weatherDataModel;

    public function __construct()
    {
        $this->weatherDataModel = new RawWeatherDataModel();
    }

    /**
     * Get heatmap data for a specific weather type.
     * @return ResponseInterface
     * @throws Exception
     */
    public function getHeatmapData(): ResponseInterface
    {
        $type          = $this->request->getGet('type');
        $startDate     = $this->request->getGet('start_date');
        $endDate       = $this->request->getGet('end_date');
        $rawStartDate  = $startDate;
        $rawEndDate    = $endDate;

        // List of valid types
        $validTypes = ['temperature', 'pressure', 'humidity', 'precipitation', 'clouds', 'wind_speed'];

        // Validate type
        if (!$type || !in_array($type, $validTypes)) {
            return $this->failValidationErrors('Invalid or missing type parameter. Valid values: ' . implode(', ', $validTypes));
        }

        // Validate start_date and end_date
        if (!$startDate || !$endDate) {
            return $this->fail('Missing required parameters: start_date or end_date', 400);
        }

        $startTimestamp = strtotime($startDate);
        $endTimestamp = strtotime($endDate);

        if ($startTimestamp === false || $endTimestamp === false) {
            return $this->failValidationErrors('Invalid date format');
        }

        $currentTimestamp = time();
        $minTimestamp = strtotime('2020-01-01');

        if ($startTimestamp > $currentTimestamp || $startTimestamp < $minTimestamp) {
            return $this->failValidationErrors('Date is out of valid range. It cannot be in the future or before 2020-01-01.');
        }

        if ($endTimestamp - $startTimestamp > 366 * 86400) {
            return $this->failValidationErrors('Date range cannot exceed 366 days.');
        }

        // Format the dates
        $startDate = date('Y-m-d 00:00:00', $startTimestamp);
        $endDate = date('Y-m-d 23:59:59', $endTimestamp);

        // Calculate range in hours for cache decision
        $rangeHours = ($endTimestamp - $startTimestamp) / 3600;

        // Disable caching for short ranges (≤48 hours) due to timezone differences
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

        $cacheKey = 'heatmap_' . md5(($type ?? '') . '_' . ($rawStartDate ?? '') . '_' . ($rawEndDate ?? ''));
        $rawData  = cache()->get($cacheKey);

        if (!is_array($rawData)) {
            $rawData = $this->weatherDataModel->getWeatherHistoryGrouped($startDate, $endDate, '10 MINUTE', $type);

            if (!empty($rawData)) {
                // Determine cache TTL based on how recent the end date is
                // If end_date is within the last 7 days, use short TTL (1 hour)
                // If end_date is older than 7 days ago, cache indefinitely
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
