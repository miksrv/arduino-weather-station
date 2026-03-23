<?php

namespace App\Controllers;

use App\Models\ClimateModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

/**
 * Class Climate
 *
 * REST controller for the long-term climate change visualizations feature.
 * Returns pre-aggregated climate statistics computed from daily_averages,
 * covering all available years.
 *
 * @package App\Controllers
 *
 * Public Methods:
 * - index(): GET /climate — full climate statistics (years, monthly normals, baseline)
 */
class Climate extends ResourceController
{
    /** @var int Cache TTL in seconds — 0 = indefinite (data changes at most once per year) */
    public const CACHE_TTL = 24 * 60 * 60; // 24 hours

    /**
     * GET /climate
     *
     * Returns pre-aggregated climate statistics across all available years and months.
     *
     * Response shape:
     * {
     *   "years": [
     *     {
     *       "year": int, "avgTemp": float, "minTemp": float, "maxTemp": float,
     *       "tempAnomaly": float, "totalPrecip": float, "precipDays": int,
     *       "frostDays": int, "hotDays": int, "heavyRainDays": int,
     *       "avgPressure": float, "avgHumidity": float,
     *       "avgWindSpeed": float, "avgClouds": float
     *     }
     *   ],
     *   "monthlyNormals": [
     *     {
     *       "month": int, "avgTemp": float, "minTemp": float, "maxTemp": float,
     *       "avgPrecip": float, "avgClouds": float, "avgWindSpeed": float
     *     }
     *   ],
     *   "baselineAvgTemp": float,
     *   "availableYears": [int, ...]
     * }
     *
     * @return ResponseInterface
     */
    public function index(): ResponseInterface
    {
        $cacheKey = 'climate_index';
        $cached   = cache()->get($cacheKey);

        if ($cached !== null) {
            return $this->respond($cached);
        }

        try {
            $model    = new ClimateModel();
            $response = $model->getClimateStats();

            cache()->save($cacheKey, $response, self::CACHE_TTL);

            return $this->respond($response);
        } catch (\Exception $e) {
            log_message('error', 'Climate::index error: ' . $e->getMessage());
            return $this->failServerError('An error occurred while retrieving climate data.');
        }
    }
}
