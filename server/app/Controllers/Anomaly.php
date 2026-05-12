<?php

namespace App\Controllers;

use App\Libraries\AnomalyDetector;
use App\Libraries\SnowpackCalculator;
use App\Models\AnomalyLogModel;
use App\Models\AnomalyModel;
use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use CodeIgniter\Entity\Entity;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use DateTime;
use Exception;

/**
 * Class Anomaly
 *
 * REST controller for the Meteorological Anomaly Monitor feature.
 * Exposes current anomaly state and historical SWE series endpoints.
 *
 * @package App\Controllers
 */
class Anomaly extends ResourceController
{
    /** @var int Cache TTL in seconds (15 minutes) */
    public const CACHE_TTL = 15 * 60;

    protected $format = 'json';

    protected AnomalyModel    $anomalyModel;
    protected AnomalyLogModel $anomalyLogModel;
    protected AnomalyDetector $detector;
    protected HourlyAveragesModel $hourlyAveragesModel;
    protected DailyAveragesModel  $dailyAveragesModel;

    /**
     * Instantiates all dependencies and wires them into AnomalyModel.
     */
    public function __construct()
    {
        $this->dailyAveragesModel  = new DailyAveragesModel();
        $this->hourlyAveragesModel = new HourlyAveragesModel();
        $snowpack                  = new SnowpackCalculator();

        $this->detector        = new AnomalyDetector($this->dailyAveragesModel, $this->hourlyAveragesModel);
        $this->anomalyLogModel = new AnomalyLogModel();
        $this->anomalyModel    = new AnomalyModel(
            $this->dailyAveragesModel,
            $this->hourlyAveragesModel,
            $snowpack,
            $this->detector,
            $this->anomalyLogModel
        );
    }

    /**
     * Returns the current meteorological anomaly monitor state, including flood
     * risk, snowpack data, parameter Z-scores, active anomalies, anomaly history,
     * and the 365-day anomaly calendar.
     *
     * @return ResponseInterface
     */
    public function index(): ResponseInterface
    {
        $cacheKey = 'anomaly_index';
        $cached   = cache()->get($cacheKey);

        if ($cached !== null) {
            return $this->respond($cached);
        }

        try {
            $today    = new DateTime('today');
            $todayStr = $today->format('Y-m-d');

            $todayRow = $this->_fetchTodayRow($todayStr);

            // Fetch today's hourly rows (DESC) for threshold checks using the
            // shared model instance instead of creating a new one.
            $recentHourly = $this->hourlyAveragesModel
                ->where('date >=', $todayStr . ' 00:00:00')
                ->where('date <=', $todayStr . ' 23:59:59')
                ->orderBy('date', 'DESC')
                ->findAll();

            $recentHourlyArr = array_map(
                fn($r) => $r instanceof Entity ? $r->toRawArray() : (is_array($r) ? $r : (array) $r),
                $recentHourly
            );

            $anomalyStates = $this->detector->checkAllAnomalies($today, $recentHourlyArr, $todayRow);

            // Use the same "active on date" predicate as getCalendarData() so that
            // anomalies closed today (end_date = today) are included in both sections.
            $activeAnomalies = $this->anomalyLogModel->getAnomaliesActiveOnDate($todayStr);

            $anomalies = $this->_buildAnomalyList($anomalyStates, $activeAnomalies);

            $response = [
                'floodRisk'        => $this->anomalyModel->getCurrentFloodRisk(),
                'snowpack'         => $this->anomalyModel->getSnowpackComparison(),
                'parameterZScores' => $this->anomalyModel->getParameterZScores(),
                'anomalies'        => $anomalies,
                'anomalyHistory'   => $this->_formatHistory($this->anomalyModel->getAnomalyHistory()),
                'anomalyCalendar'  => $this->anomalyModel->getAnomalyCalendar(365, $anomalyStates),
            ];

            cache()->save($cacheKey, $response, self::CACHE_TTL);

            return $this->respond($response);
        } catch (Exception $e) {
            log_message('error', 'Anomaly::index error: ' . $e->getMessage());
            return $this->failServerError('An error occurred while retrieving anomaly data.');
        }
    }

    /**
     * Returns the computed SWE series for a specified hydrological season.
     *
     * Query parameter:
     *   - season (required): format YYYY-YYYY, start year >= 2022
     *
     * @return ResponseInterface
     */
    public function history(): ResponseInterface
    {
        $season = $this->request->getGet('season');

        if (!$season) {
            return $this->failValidationErrors('Missing required parameter: season');
        }

        if (!preg_match('/^\d{4}-\d{4}$/', $season)) {
            return $this->failValidationErrors('Invalid season format. Expected YYYY-YYYY');
        }

        [$startYearStr, $endYearStr] = explode('-', $season);
        $startYear = (int) $startYearStr;
        $endYear   = (int) $endYearStr;

        if ($startYear < 2022) {
            return $this->failValidationErrors('Season start year must be >= 2022');
        }

        if ($endYear !== $startYear + 1) {
            return $this->failValidationErrors('Season end year must be start year + 1');
        }

        $cacheKey = 'anomaly_history_' . $season;
        $cached   = cache()->get($cacheKey);

        if ($cached !== null) {
            return $this->respond($cached);
        }

        try {
            $snowpack    = new SnowpackCalculator();
            $seasonStart = "{$startYear}-10-01";
            $seasonEnd   = "{$endYear}-05-31";

            $rows = $this->dailyAveragesModel
                ->where('date >=', $seasonStart)
                ->where('date <=', $seasonEnd)
                ->orderBy('date', 'ASC')
                ->findAll();

            $rowsArr = array_map(
                fn($r) => $r instanceof Entity ? $r->toRawArray() : (is_array($r) ? $r : (array) $r),
                $rows
            );

            $sweSeries = $snowpack->computeSWESeries($rowsArr);

            $response = [
                'season' => $season,
                'series' => $sweSeries,
            ];

            cache()->save($cacheKey, $response, self::CACHE_TTL);

            return $this->respond($response);
        } catch (Exception $e) {
            log_message('error', 'Anomaly::history error: ' . $e->getMessage());
            return $this->failServerError('An error occurred while retrieving historical data.');
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Fetches today's daily_averages row as an associative array.
     *
     * @param string $todayStr Date string in Y-m-d format.
     * @return array Empty array if no row exists or on failure.
     */
    private function _fetchTodayRow(string $todayStr): array
    {
        try {
            $row = $this->dailyAveragesModel
                ->where('date >=', $todayStr . ' 00:00:00')
                ->where('date <=', $todayStr . ' 23:59:59')
                ->first();

            if (!$row) {
                return [];
            }

            return $row instanceof Entity ? $row->toRawArray() : (is_array($row) ? $row : (array) $row);
        } catch (Exception $e) {
            log_message('error', 'Anomaly::_fetchTodayRow error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Merges AnomalyDetector states with AnomalyLogModel active rows to build
     * the anomalies array for the API response.
     *
     * An anomaly is considered active if the detector reports it active OR if
     * there is an open record in anomaly_log (end_date IS NULL or end_date >= today).
     *
     * @param array $states  Output of AnomalyDetector::checkAllAnomalies().
     * @param array $logRows Output of AnomalyLogModel::getAnomaliesActiveOnDate().
     * @return array
     */
    private function _buildAnomalyList(array $states, array $logRows): array
    {
        // Index active log rows by anomaly type for O(1) lookup
        $activeByType = [];
        foreach ($logRows as $row) {
            $rowArr                      = is_array($row) ? $row : (array) $row;
            $activeByType[$rowArr['type']] = $rowArr;
        }

        $result = [];

        foreach ($states as $type => $state) {
            $isActiveInLog = !empty($activeByType[$type]);
            $isActive      = (bool) $state['active'] || $isActiveInLog;

            $entry = [
                'id'            => $type,
                'active'        => $isActive,
                'currentZScore' => $state['zScore'] !== null ? round((float) $state['zScore'], 4) : null,
                'extraMetric'   => $state['extraMetric'],
                'triggeredAt'   => $isActiveInLog
                    ? substr((string) ($activeByType[$type]['start_date'] ?? ''), 0, 10)
                    : null,
            ];

            $result[] = $entry;
        }

        return $result;
    }

    /**
     * Normalises raw anomaly_log rows into the API response shape.
     *
     * @param array $rows Raw anomaly_log rows.
     * @return array
     */
    private function _formatHistory(array $rows): array
    {
        $formatted = [];

        foreach ($rows as $row) {
            $r           = is_array($row) ? $row : (array) $row;
            $formatted[] = [
                'id'          => (int) ($r['id'] ?? 0),
                'type'        => $r['type'] ?? '',
                'startDate'   => substr((string) ($r['start_date'] ?? ''), 0, 10),
                'endDate'     => isset($r['end_date']) && $r['end_date'] !== null
                    ? substr((string) $r['end_date'], 0, 10)
                    : null,
                'peakValue'   => isset($r['peak_value']) ? (float) $r['peak_value'] : null,
                'description' => $r['description'] ?? null,
            ];
        }

        return $formatted;
    }
}
