<?php

namespace App\Controllers;

use App\Models\PrecipitationModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Exception;

/**
 * Class Precipitation
 *
 * REST controller for the Precipitation Calendar feature.
 * Returns per-day precipitation totals, yearly statistics, and available years
 * for a requested calendar year.
 *
 * @package App\Controllers
 *
 * Public Methods:
 * - index(): GET /precipitation — yearly precipitation data and statistics
 */
class Precipitation extends ResourceController
{
    /** @var int Cache TTL for current-year requests (15 minutes) */
    public const CACHE_TTL_SHORT = 15 * 60;

    /** @var int Cache TTL for previous-year requests (indefinite) */
    public const CACHE_TTL_LONG  = 0;

    /**
     * GET /precipitation
     *
     * Query parameters:
     *   - year (optional, int): calendar year to retrieve; defaults to the current year.
     *                           Must be between 2020 and the current year inclusive.
     *
     * Response shape:
     * {
     *   "year": 2024,
     *   "days": [{"date": "2024-01-01", "total": 0.0}, ...],
     *   "stats": {
     *     "totalYear": float,
     *     "rainyDays": int,
     *     "dryDays": int,
     *     "maxDailyTotal": {"value": float, "date": string},
     *     "longestWetStreak": {"days": int, "start": string, "end": string},
     *     "longestDryStreak": {"days": int, "start": string, "end": string},
     *     "monthlyTotals": [{"month": int, "total": float}, ...]
     *   },
     *   "availableYears": [int, ...]
     * }
     *
     * @return ResponseInterface
     */
    public function index(): ResponseInterface
    {
        $currentYear = (int) date('Y');
        $yearParam   = $this->request->getGet('year');
        $year        = $yearParam !== null ? (int) $yearParam : $currentYear;

        if ($year < 2020 || $year > $currentYear) {
            return $this->failValidationErrors(
                'Invalid year. Must be between 2020 and ' . $currentYear . ' inclusive.'
            );
        }

        $cacheKey = 'precipitation_index_' . $year;
        $ttl      = ($year === $currentYear) ? self::CACHE_TTL_SHORT : self::CACHE_TTL_LONG;
        $cached   = cache()->get($cacheKey);

        if ($cached !== null) {
            return $this->respond($cached);
        }

        try {
            $model       = new PrecipitationModel();
            $dailyTotals = $model->getDailyTotals($year);
            $years       = $model->getAvailableYears();
            $stats       = $model->getStats($year, $dailyTotals);

            $response = [
                'year'           => $year,
                'days'           => $dailyTotals,
                'stats'          => $stats,
                'availableYears' => $years,
            ];

            cache()->save($cacheKey, $response, $ttl);

            return $this->respond($response);
        } catch (Exception $e) {
            log_message('error', 'Precipitation::index error: ' . $e->getMessage());
            return $this->failServerError('An error occurred while retrieving precipitation data.');
        }
    }
}
