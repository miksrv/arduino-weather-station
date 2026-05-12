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
 */
class Precipitation extends ResourceController
{
    /** @var int Cache TTL for recent data requests (1 hour) */
    public const CACHE_TTL_RECENT = 60 * 60;

    /** @var int Cache TTL for purely historical requests (indefinite — use 0 for no expiry) */
    public const CACHE_TTL_HISTORICAL = 0;

    /** @var int Number of days to consider data as "recent" (not fully historical) */
    public const CACHE_RECENT_DAYS_THRESHOLD = 7;

    protected $format = 'json';

    protected PrecipitationModel $precipitationModel;

    /**
     * Initialises the precipitation model.
     */
    public function __construct()
    {
        $this->precipitationModel = new PrecipitationModel();
    }

    /**
     * Returns per-day precipitation totals, yearly statistics, and available years.
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

        // Current year uses today as the effective end date; past years use Dec 31
        $yearEndDate     = ($year === $currentYear) ? time() : strtotime($year . '-12-31');
        $recentThreshold = strtotime('-' . self::CACHE_RECENT_DAYS_THRESHOLD . ' days');
        $ttl             = $yearEndDate >= $recentThreshold
            ? self::CACHE_TTL_RECENT
            : self::CACHE_TTL_HISTORICAL;

        $cacheKey = 'precipitation_index_' . $year;
        $cached   = cache()->get($cacheKey);

        if ($cached !== null) {
            return $this->respond($cached);
        }

        try {
            $dailyTotals = $this->precipitationModel->getDailyTotals($year);
            $years       = $this->precipitationModel->getAvailableYears();
            $stats       = $this->precipitationModel->getStats($year, $dailyTotals);

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
