<?php

namespace App\Controllers;

use App\Libraries\EventFeedBuilder;
use App\Models\AnomalyLogModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\Entity\Entity;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use DateTime;
use Exception;

/**
 * Class Events
 *
 * REST controller for the "recent events" feed shown in the Event Log widget.
 * The feed is dynamically computed on every request from data that already
 * exists (raw_weather_data, anomaly_log) — nothing produced here is
 * persisted to any table.
 *
 * @package App\Controllers
 */
class Events extends ResourceController
{
    /** @var int Default lookback window, in hours, when the "hours" query param is omitted */
    public const DEFAULT_HOURS = 24;

    /** @var int Maximum allowed lookback window, in hours (7 days) */
    public const MAX_HOURS = 24 * 7;

    /** @var int Default maximum number of events returned when "limit" is omitted */
    public const DEFAULT_LIMIT = 50;

    /** @var int Maximum allowed value for the "limit" query param */
    public const MAX_LIMIT = 200;

    /** @var int Cache TTL in seconds (2 minutes) — short-lived since raw_weather_data changes roughly every 60s */
    public const CACHE_TTL = 120;

    protected $format = 'json';

    protected RawWeatherDataModel $weatherDataModel;
    protected AnomalyLogModel     $anomalyLogModel;
    protected EventFeedBuilder    $eventFeedBuilder;

    /**
     * Initialises the models and the event feed builder.
     */
    public function __construct()
    {
        $this->weatherDataModel = new RawWeatherDataModel();
        $this->anomalyLogModel  = new AnomalyLogModel();
        $this->eventFeedBuilder = new EventFeedBuilder();
    }

    /**
     * Returns the recent events feed, merging value-change, wind-gust,
     * precipitation, system-status, and anomaly entries into one array
     * sorted by date descending.
     *
     * The response is cached per (hours, limit) combination for CACHE_TTL
     * seconds, since deriving the feed re-scans up to MAX_HOURS worth of
     * raw_weather_data on every uncached call.
     *
     * Query parameters:
     *   - hours (optional, int): lookback window in hours; defaults to 24, max 168.
     *   - limit (optional, int): maximum number of events to return; defaults to 50, max 200.
     *
     * @return ResponseInterface
     */
    public function index(): ResponseInterface
    {
        $hoursParam = $this->request->getGet('hours');
        $limitParam = $this->request->getGet('limit');

        $hours = $hoursParam !== null ? (int) $hoursParam : self::DEFAULT_HOURS;
        $limit = $limitParam !== null ? (int) $limitParam : self::DEFAULT_LIMIT;

        if ($hours < 1 || $hours > self::MAX_HOURS) {
            return $this->failValidationErrors(
                'Invalid hours parameter. Must be between 1 and ' . self::MAX_HOURS . '.'
            );
        }

        if ($limit < 1 || $limit > self::MAX_LIMIT) {
            return $this->failValidationErrors(
                'Invalid limit parameter. Must be between 1 and ' . self::MAX_LIMIT . '.'
            );
        }

        $cacheKey = 'events_index_' . $hours . '_' . $limit;
        $cached   = cache()->get($cacheKey);

        if ($cached !== null) {
            return $this->respond($cached);
        }

        try {
            $windowEnd   = new DateTime('now', new \DateTimeZone(app_timezone()));
            $windowStart = (clone $windowEnd)->modify("-{$hours} hours");

            $rawRows = $this->weatherDataModel->getRowsSince($windowStart);

            $rawRowsArr = array_map(
                fn($r) => $r instanceof Entity ? $r->toRawArray() : (is_array($r) ? $r : (array) $r),
                $rawRows
            );

            $anomalyRows = $this->anomalyLogModel->getAnomaliesTouchingWindow(
                $windowStart->format('Y-m-d'),
                $windowEnd->format('Y-m-d')
            );

            $lastUpdate = $this->weatherDataModel->getLastUpdateTime();

            $events = $this->eventFeedBuilder->build(
                $rawRowsArr,
                $anomalyRows,
                $windowStart,
                $windowEnd,
                $lastUpdate,
                $limit
            );

            $response = ['events' => $events];

            cache()->save($cacheKey, $response, self::CACHE_TTL);

            return $this->respond($response);
        } catch (Exception $e) {
            log_message('error', 'Events::index error: ' . $e->getMessage());
            return $this->failServerError('An error occurred while retrieving the events feed.');
        }
    }
}
