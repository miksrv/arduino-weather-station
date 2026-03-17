<?php

namespace App\Models;

use App\Libraries\AnomalyDetector;
use App\Libraries\SnowpackCalculator;

/**
 * Class AnomalyModel
 *
 * Orchestration model for the Meteorological Anomaly Monitor feature.
 * Coordinates DailyAveragesModel, HourlyAveragesModel, SnowpackCalculator,
 * AnomalyDetector, and AnomalyLogModel to assemble the full API response.
 *
 * Does not extend \CodeIgniter\Model — it is a plain orchestration class.
 *
 * @package App\Models
 */
class AnomalyModel
{
    protected DailyAveragesModel  $dailyModel;
    protected HourlyAveragesModel $hourlyModel;
    protected SnowpackCalculator  $snowpack;
    protected AnomalyDetector     $detector;
    protected AnomalyLogModel     $anomalyLogModel;

    /** @var string Season label hardcoded as historically confirmed flood year */
    private const FLOOD_SEASON = '2023-2024';

    /**
     * @param DailyAveragesModel  $dailyModel
     * @param HourlyAveragesModel $hourlyModel
     * @param SnowpackCalculator  $snowpack
     * @param AnomalyDetector     $detector
     * @param AnomalyLogModel     $anomalyLogModel
     */
    public function __construct(
        DailyAveragesModel $dailyModel,
        HourlyAveragesModel $hourlyModel,
        SnowpackCalculator $snowpack,
        AnomalyDetector $detector,
        AnomalyLogModel $anomalyLogModel
    ) {
        $this->dailyModel      = $dailyModel;
        $this->hourlyModel     = $hourlyModel;
        $this->snowpack        = $snowpack;
        $this->detector        = $detector;
        $this->anomalyLogModel = $anomalyLogModel;
    }

    /**
     * Fetches daily rows for the current hydrological season, runs SnowpackCalculator,
     * computes all five flood risk score components, and returns the full risk array
     * matching the API response shape.
     *
     * Returns off-season state (score=0, level='low') from June 1 through September 30.
     *
     * @return array Flood risk data matching the API contract shape
     */
    public function getCurrentFloodRisk(): array
    {
        $today = new \DateTime('today');
        $month = (int) $today->format('n');

        // Off-season: June 1 – September 30
        if ($month >= 6 && $month <= 9) {
            return [
                'score'       => 0,
                'level'       => 'low',
                'components'  => $this->_emptyComponents(),
                'disclaimer'  => 'This is a meteorological indicator only. Reservoir operations are not modelled.',
                'season'      => 'offseason',
                'dataQuality' => 'good',
            ];
        }

        try {
            [$seasonStart, $seasonEnd] = $this->snowpack->getSeasonRange($today);

            $dailyRows = $this->dailyModel
                ->where('date >=', $seasonStart)
                ->where('date <=', $today->format('Y-m-d'))
                ->orderBy('date', 'ASC')
                ->findAll();

            $dailyArr  = array_map(
                fn($r) => $r instanceof \CodeIgniter\Entity\Entity ? $r->toRawArray() : (is_array($r) ? $r : (array) $r),
                $dailyRows
            );
            $sweSeries = $this->snowpack->computeSWESeries($dailyArr);

            $currentSWE = !empty($sweSeries) ? end($sweSeries)['swe'] : 0.0;

            // SWE Z-score — compare against historical same-day SWE from past seasons
            $sweZScore    = $this->_computeSweSweZScore($today, $currentSWE, $dailyArr);
            $meltRate     = $this->snowpack->computeMeltRateLast14Days($sweSeries);
            $rainOnSnow   = $this->snowpack->countRainOnSnowDays($dailyArr, $sweSeries);
            $precipZScore = $this->detector->computeZScore('precipitation', $today, (float) ($dailyArr[count($dailyArr) - 1]['precipitation'] ?? 0.0));
            $tempSlope    = $this->_compute14DayTempSlope($dailyArr);

            // Normalise each component to 0–1 and multiply by weight
            $sweNorm    = $this->_clamp(($sweZScore ?? 0.0) / 4.0, 0.0, 1.0);
            $meltNorm   = $this->_clamp($meltRate / 30.0, 0.0, 1.0);
            $rainNorm   = $this->_clamp($rainOnSnow / 7.0, 0.0, 1.0);
            $precipNorm = $this->_clamp(($precipZScore ?? 0.0) / 3.0, 0.0, 1.0);
            $tempNorm   = $this->_clamp($tempSlope / 3.0, 0.0, 1.0);

            $contributions = [
                'sweAnomaly'       => round($sweNorm * 35, 1),
                'meltRate'         => round($meltNorm * 25, 1),
                'rainOnSnowDays'   => round($rainNorm * 20, 1),
                'precipAnomaly'    => round($precipNorm * 10, 1),
                'temperatureTrend' => round($tempNorm * 10, 1),
            ];
            $score = (int) round(array_sum($contributions));
            $level = $this->_scoreToLevel($score);

            return [
                'score'      => $score,
                'level'      => $level,
                'components' => [
                    'sweAnomaly'       => ['value' => round((float) ($sweZScore ?? 0.0), 2), 'weight' => 0.35, 'contribution' => $contributions['sweAnomaly']],
                    'meltRate'         => ['value' => round($meltRate, 2),                   'weight' => 0.25, 'contribution' => $contributions['meltRate']],
                    'rainOnSnowDays'   => ['value' => $rainOnSnow,                           'weight' => 0.20, 'contribution' => $contributions['rainOnSnowDays']],
                    'precipAnomaly'    => ['value' => round((float) ($precipZScore ?? 0.0), 2), 'weight' => 0.10, 'contribution' => $contributions['precipAnomaly']],
                    'temperatureTrend' => ['value' => round($tempSlope, 2),                  'weight' => 0.10, 'contribution' => $contributions['temperatureTrend']],
                ],
                'disclaimer'  => 'This is a meteorological indicator only. Reservoir operations are not modelled.',
                'season'      => 'active',
                'dataQuality' => count($dailyArr) >= 30 ? 'good' : 'insufficient',
            ];
        } catch (\Exception $e) {
            log_message('error', 'AnomalyModel::getCurrentFloodRisk error: ' . $e->getMessage());
            return [
                'score'       => 0,
                'level'       => 'low',
                'components'  => $this->_emptyComponents(),
                'disclaimer'  => 'This is a meteorological indicator only. Reservoir operations are not modelled.',
                'season'      => 'active',
                'dataQuality' => 'insufficient',
            ];
        }
    }

    /**
     * For each recorded hydrological season (Oct–May), computes the peak SWE.
     * Sets floodOccurred=true for season '2023-2024' (hardcoded historical fact),
     * null for the current in-progress season, false for all others.
     *
     * @return array Snowpack comparison data matching the API contract shape
     */
    public function getSnowpackComparison(): array
    {
        $today        = new \DateTime('today');
        [$curStart,]  = $this->snowpack->getSeasonRange($today);
        $curYear      = (int) substr($curStart, 0, 4);
        $currentLabel = $curYear . '-' . ($curYear + 1);

        try {
            // Fetch all daily data, find distinct seasons
            $allRows = $this->dailyModel
                ->select('date, temperature, precipitation')
                ->where('date >=', '2022-10-01')
                ->orderBy('date', 'ASC')
                ->findAll();

            $allRowsArr = array_map(
                fn($r) => $r instanceof \CodeIgniter\Entity\Entity ? $r->toRawArray() : (is_array($r) ? $r : (array) $r),
                $allRows
            );

            // Group rows by hydrological season (Oct 1 – May 31 only; skip Jun–Sep off-season rows)
            $seasons = [];
            foreach ($allRowsArr as $row) {
                $dateStr = substr((string) ($row['date'] ?? ''), 0, 10);
                $d       = new \DateTime($dateStr);
                $month   = (int) $d->format('n');

                // Skip off-season months — they belong to no active snow season
                if ($month >= 6 && $month <= 9) {
                    continue;
                }

                [$sStart,] = $this->snowpack->getSeasonRange($d);
                $sYear   = (int) substr($sStart, 0, 4);
                $label   = $sYear . '-' . ($sYear + 1);
                $seasons[$label][] = $row;
            }

            $comparisonYears = [];

            foreach ($seasons as $label => $rows) {
                $sweSeries = $this->snowpack->computeSWESeries($rows);
                $maxSWE    = !empty($sweSeries) ? max(array_column($sweSeries, 'swe')) : 0.0;

                if ($label === self::FLOOD_SEASON) {
                    $floodOccurred = true;
                } elseif ($label === $currentLabel) {
                    $floodOccurred = null;
                } else {
                    $floodOccurred = false;
                }

                $peakDate    = null;
                $peakSWEVal  = -1.0;
                foreach ($sweSeries as $pt) {
                    if ((float) $pt['swe'] > $peakSWEVal) {
                        $peakSWEVal = (float) $pt['swe'];
                        $peakDate   = $pt['date'];
                    }
                }

                // Build temperature series for this season
                $tempSeries = [];
                foreach ($rows as $row) {
                    $dateStr = substr((string) ($row['date'] ?? ''), 0, 10);
                    if ($dateStr === '') {
                        continue;
                    }
                    $temp = isset($row['temperature']) ? round((float) $row['temperature'], 1) : null;
                    if ($temp !== null) {
                        $tempSeries[] = ['date' => $dateStr, 'temperature' => $temp];
                    }
                }

                $comparisonYears[$label] = [
                    'year'              => $label,
                    'maxSWE'            => round($maxSWE, 1),
                    'floodOccurred'     => $floodOccurred,
                    'series'            => $sweSeries,
                    'peakDate'          => $peakDate,
                    'temperatureSeries' => $tempSeries,
                ];
            }

            ksort($comparisonYears);

            // Current season SWE series
            $currentSeasonRows = $seasons[$currentLabel] ?? [];
            $currentSeries     = $this->snowpack->computeSWESeries($currentSeasonRows);
            $currentSWE        = !empty($currentSeries) ? end($currentSeries)['swe'] : 0.0;

            // Historical stats for current calendar day — compare same season-day offset
            $curSeasonStartDt    = new \DateTime($curStart);
            $todaySeasonOffset   = (int) $curSeasonStartDt->diff($today)->days;

            $historicalSameDaySWE = [];
            foreach ($comparisonYears as $s) {
                if ($s['year'] === $currentLabel || empty($s['series'])) {
                    continue;
                }

                $sYear           = (int) substr($s['year'], 0, 4);
                $pastSeasonStart = new \DateTime("{$sYear}-10-01");
                $targetDt        = (clone $pastSeasonStart)->modify("+{$todaySeasonOffset} days");

                $bestSWE  = null;
                $bestDiff = PHP_INT_MAX;
                foreach ($s['series'] as $pt) {
                    $ptDt = new \DateTime(substr($pt['date'], 0, 10));
                    $diff = abs((int) $ptDt->diff($targetDt)->days);
                    if ($diff < $bestDiff) {
                        $bestDiff = $diff;
                        $bestSWE  = (float) $pt['swe'];
                    }
                }

                if ($bestSWE !== null && $bestDiff <= 7) {
                    $historicalSameDaySWE[] = $bestSWE;
                }
            }

            $histAvg = !empty($historicalSameDaySWE) ? array_sum($historicalSameDaySWE) / count($historicalSameDaySWE) : 0.0;
            $histVariance = !empty($historicalSameDaySWE)
                ? array_sum(array_map(fn($v) => ($v - $histAvg) ** 2, $historicalSameDaySWE)) / count($historicalSameDaySWE)
                : 0.0;
            $histStd   = sqrt($histVariance);
            $sweZScore = $histStd > 1e-9 ? ($currentSWE - $histAvg) / $histStd : 0.0;

            $temperatureSeries = [];
            foreach ($currentSeasonRows as $row) {
                $dateStr = substr((string) ($row['date'] ?? ''), 0, 10);
                if ($dateStr === '') {
                    continue;
                }
                $temp = isset($row['temperature']) ? round((float) $row['temperature'], 1) : null;
                if ($temp !== null) {
                    $temperatureSeries[] = ['date' => $dateStr, 'temperature' => $temp];
                }
            }

            return [
                'estimatedSWE'     => round($currentSWE, 1),
                'historicalAvgSWE' => round($histAvg, 1),
                'historicalStdSWE' => round($histStd, 1),
                'sweZScore'        => round($sweZScore, 2),
                'series'           => $currentSeries,
                'temperatureSeries' => $temperatureSeries,
                'comparisonYears'  => array_values($comparisonYears),
            ];
        } catch (\Exception $e) {
            log_message('error', 'AnomalyModel::getSnowpackComparison error: ' . $e->getMessage());
            return [
                'estimatedSWE'     => 0.0,
                'historicalAvgSWE' => 0.0,
                'historicalStdSWE' => 0.0,
                'sweZScore'        => 0.0,
                'series'           => [],
                'temperatureSeries' => [],
                'comparisonYears'  => [],
            ];
        }
    }

    /**
     * Returns current Z-scores for all key parameters by delegating to
     * AnomalyDetector::computeAllParameterZScores().
     *
     * @return array Keyed by parameter name with float|null Z-score values
     */
    public function getParameterZScores(): array
    {
        try {
            $today    = new \DateTime('today');
            $todayRow = $this->_getTodayRow();

            return $this->detector->computeAllParameterZScores($today, $todayRow);
        } catch (\Exception $e) {
            log_message('error', 'AnomalyModel::getParameterZScores error: ' . $e->getMessage());
            return [
                'temperature'   => null,
                'pressure'      => null,
                'precipitation' => null,
                'windSpeed'     => null,
                'humidity'      => null,
                'uvIndex'       => null,
            ];
        }
    }

    /**
     * Delegates to AnomalyLogModel::getCalendarData().
     *
     * @param int   $days          Number of past days to cover
     * @param array $currentStates Current anomaly states from AnomalyDetector (optional)
     * @return array Array of ['date' => 'Y-m-d', 'activeCount' => int, 'types' => string[]]
     */
    public function getAnomalyCalendar(int $days = 365, array $currentStates = []): array
    {
        return $this->anomalyLogModel->getCalendarData($days, $currentStates);
    }

    /**
     * Delegates to AnomalyLogModel::getHistory().
     *
     * @return array Most recent anomaly log entries
     */
    public function getAnomalyHistory(): array
    {
        return $this->anomalyLogModel->getHistory();
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Returns today's daily_averages row as an array, or empty array if unavailable.
     *
     * @return array
     */
    private function _getTodayRow(): array
    {
        try {
            $today = (new \DateTime('today'))->format('Y-m-d');
            $row   = $this->dailyModel
                ->where('DATE(date)', $today)
                ->first();

            return $row
                ? ($row instanceof \CodeIgniter\Entity\Entity ? $row->toRawArray() : (is_array($row) ? $row : (array) $row))
                : [];
        } catch (\Exception $e) {
            log_message('error', 'AnomalyModel::_getTodayRow error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Computes the Z-score of the current SWE against historical same-season SWE
     * values for the same calendar day across past years.
     *
     * @param \DateTime $today
     * @param float     $currentSWE
     * @param array     $currentSeasonRows
     * @return float|null
     */
    private function _computeSweSweZScore(\DateTime $today, float $currentSWE, array $currentSeasonRows): ?float
    {
        try {
            $md         = $today->format('m-d');
            $year       = (int) $today->format('Y');
            $historical = [];

            // Iterate past seasons (from the earliest available year back)
            for ($y = $year - 1; $y >= 2022; $y--) {
                $pastDate    = new \DateTime("{$y}-{$md}");
                [$sStart, ]  = $this->snowpack->getSeasonRange($pastDate);
                $sEnd        = $pastDate->format('Y-m-d');

                $pastRows = $this->dailyModel
                    ->where('date >=', $sStart)
                    ->where('date <=', $sEnd)
                    ->orderBy('date', 'ASC')
                    ->findAll();

                $pastArr   = array_map(
                    fn($r) => $r instanceof \CodeIgniter\Entity\Entity ? $r->toRawArray() : (is_array($r) ? $r : (array) $r),
                    $pastRows
                );
                $pastSeries = $this->snowpack->computeSWESeries($pastArr);

                if (!empty($pastSeries)) {
                    $historical[] = end($pastSeries)['swe'];
                }
            }

            if (count($historical) < 2) {
                return null;
            }

            $mean     = array_sum($historical) / count($historical);
            $variance = array_sum(array_map(fn($v) => ($v - $mean) ** 2, $historical)) / count($historical);
            $std      = sqrt($variance);

            return $std > 1e-9 ? ($currentSWE - $mean) / $std : 0.0;
        } catch (\Exception $e) {
            log_message('error', 'AnomalyModel::_computeSweSweZScore error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Computes the linear temperature slope (°C/day) over the last 14 days
     * using least-squares regression.
     *
     * @param array $dailyRows Season rows sorted ASC
     * @return float Slope in °C/day (positive = warming trend)
     */
    private function _compute14DayTempSlope(array $dailyRows): float
    {
        $window = array_slice($dailyRows, -14);
        $n      = count($window);

        if ($n < 2) {
            return 0.0;
        }

        $temps  = array_column($window, 'temperature');
        $x      = range(0, $n - 1);
        $sumX   = array_sum($x);
        $sumY   = array_sum($temps);
        $sumXY  = 0.0;
        $sumX2  = 0.0;

        for ($i = 0; $i < $n; $i++) {
            $sumXY += $x[$i] * (float) $temps[$i];
            $sumX2 += $x[$i] ** 2;
        }

        $denom = $n * $sumX2 - $sumX ** 2;

        return abs($denom) > 1e-9
            ? ($n * $sumXY - $sumX * $sumY) / $denom
            : 0.0;
    }

    /**
     * Clamps a value between min and max.
     *
     * @param float $value
     * @param float $min
     * @param float $max
     * @return float
     */
    private function _clamp(float $value, float $min, float $max): float
    {
        return max($min, min($max, $value));
    }

    /**
     * Maps a numeric score to a risk level string.
     *
     * @param int $score 0–100
     * @return string 'low' | 'elevated' | 'high' | 'critical'
     */
    private function _scoreToLevel(int $score): string
    {
        if ($score < 20) {
            return 'low';
        }

        if ($score <= 45) {
            return 'elevated';
        }

        if ($score <= 70) {
            return 'high';
        }

        return 'critical';
    }

    /**
     * Returns an empty components array for off-season or error states.
     *
     * @return array
     */
    protected function _emptyComponents(): array
    {
        return [
            'sweAnomaly'       => ['value' => 0.0, 'weight' => 0.35, 'contribution' => 0.0],
            'meltRate'         => ['value' => 0.0, 'weight' => 0.25, 'contribution' => 0.0],
            'rainOnSnowDays'   => ['value' => 0,   'weight' => 0.20, 'contribution' => 0.0],
            'precipAnomaly'    => ['value' => 0.0, 'weight' => 0.10, 'contribution' => 0.0],
            'temperatureTrend' => ['value' => 0.0, 'weight' => 0.10, 'contribution' => 0.0],
        ];
    }
}
