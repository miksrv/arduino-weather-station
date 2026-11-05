<?php

namespace App\Libraries;

use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use App\Models\PrecipitationModel;

/**
 * Class AnomalyDetector
 *
 * Detects meteorological anomalies using Z-score analysis, threshold checks,
 * and compound condition evaluation against historical daily/hourly averages.
 *
 * @package App\Libraries
 */
class AnomalyDetector
{
    protected DailyAveragesModel  $dailyModel;
    protected HourlyAveragesModel $hourlyModel;

    /** @var float Pressure drop (hPa) over a 3-hour window that counts as a collapse */
    public const PRESSURE_COLLAPSE_HPA = 5.0;

    /** @var int Length (seconds) of the window in which the pressure drop is measured */
    public const PRESSURE_WINDOW_SECONDS = 3 * 3600;

    /** @var float Lower bound (°C) of the hourly mean temperature for freezing rain */
    public const FREEZING_RAIN_MIN_C = -4.0;

    /** @var float Upper bound (°C) of the hourly mean temperature for freezing rain */
    public const FREEZING_RAIN_MAX_C = 1.0;

    /** @var float Share of the days of a precipitation window that must have data */
    public const WINDOW_COVERAGE = 0.9;

    private ?int $firstPrecipYear = null;
    private bool $firstPrecipYearLoaded = false;

    /**
     * @param DailyAveragesModel  $dailyModel  Injected daily averages model
     * @param HourlyAveragesModel $hourlyModel Injected hourly averages model
     */
    public function __construct(DailyAveragesModel $dailyModel, HourlyAveragesModel $hourlyModel)
    {
        $this->dailyModel  = $dailyModel;
        $this->hourlyModel = $hourlyModel;
    }

    /**
     * Computes the Z-score for a given parameter on a given date against all
     * historical readings within ±7 calendar days of that date across past years.
     *
     * Returns null if fewer than 10 historical data points exist.
     *
     * @param string    $parameter    Column name in daily_averages (e.g. 'temperature')
     * @param \DateTime $date         Reference date
     * @param float     $currentValue The value to score
     * @return float|null Z-score or null if insufficient data
     */
    public function computeZScore(string $parameter, \DateTime $date, float $currentValue): ?float
    {
        try {
            $month = (int) $date->format('n');
            $day   = (int) $date->format('j');
            $year  = (int) $date->format('Y');

            // Build ±7-day window as a set of (month, day) pairs, accounting for month boundaries
            $datePairs = [];
            for ($offset = -7; $offset <= 7; $offset++) {
                $d = (clone $date)->modify("{$offset} days");
                $datePairs[] = $d->format('m-d');
            }

            // Query all historical rows matching those calendar days, excluding the current year
            $allowedColumns = [
                'temperature', 'feels_like', 'pressure', 'humidity', 'dew_point',
                'uv_index', 'sol_energy', 'sol_radiation', 'precipitation',
                'clouds', 'visibility', 'wind_speed', 'wind_deg', 'wind_gust',
            ];

            if (!in_array($parameter, $allowedColumns, true)) {
                return null;
            }

            $rows = $this->dailyModel
                ->select("DATE_FORMAT(date, '%m-%d') as md, {$parameter} as val")
                ->where("YEAR(date) <", $year)
                ->whereIn("DATE_FORMAT(date, '%m-%d')", $datePairs)
                ->where("{$parameter} IS NOT NULL")
                ->findAll();

            if (count($rows) < 10) {
                return null;
            }

            $values = array_map(fn($r) => (float) (is_array($r) ? ($r['val'] ?? 0.0) : $r->val), $rows);

            $mean = array_sum($values) / count($values);
            $variance = array_sum(array_map(fn($v) => ($v - $mean) ** 2, $values)) / count($values);
            $std  = sqrt($variance);

            if ($std < 1e-9) {
                return 0.0;
            }

            return ($currentValue - $mean) / $std;
        } catch (\Exception $e) {
            log_message('error', 'AnomalyDetector::computeZScore error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Evaluates all anomalies for one COMPLETE UTC day, exactly as the cron and the
     * backfill do, so both produce the same anomaly_log.
     *
     * Returns null when daily_averages has no row for the day.
     *
     * @param \DateTime $date Day to evaluate (time part ignored)
     * @return array|null Anomaly state keyed by type, or null without data
     */
    public function evaluateDay(\DateTime $date): ?array
    {
        $dateStr = $date->format('Y-m-d');

        $dailyRow = $this->dailyModel
            ->where('date >=', $dateStr . ' 00:00:00')
            ->where('date <=', $dateStr . ' 23:59:59')
            ->first();

        if (!$dailyRow) {
            return null;
        }

        $hourly = $this->hourlyModel
            ->where('date >=', $dateStr . ' 00:00:00')
            ->where('date <=', $dateStr . ' 23:59:59')
            ->orderBy('date', 'DESC')
            ->findAll();

        // The previous day's last hours let a pressure collapse straddle midnight
        $prevDay   = (clone $date)->modify('-1 day')->format('Y-m-d');
        $tailStart = $prevDay . ' ' . sprintf('%02d:00:00', 24 - (int) (self::PRESSURE_WINDOW_SECONDS / 3600));
        $tail      = $this->hourlyModel
            ->where('date >=', $tailStart)
            ->where('date <', $dateStr . ' 00:00:00')
            ->orderBy('date', 'DESC')
            ->findAll();

        return $this->checkAllAnomalies(
            new \DateTime($dateStr),
            $this->_toArrays($hourly),
            $this->_toArray($dailyRow),
            $this->_toArrays($tail)
        );
    }

    /**
     * Returns true if some pair of hourly readings at most 3 hours apart shows a pressure
     * drop of >= 5 hPa. Uses the rows' real timestamps; rows without a date are assumed
     * to be consecutive hours, newest first.
     *
     * @param array $hourlyRows   Hourly rows of the day
     * @param array $contextRows  Optional extra rows (e.g. the previous day's last hours)
     * @return bool
     */
    public function checkPressureCollapse(array $hourlyRows, array $contextRows = []): bool
    {
        return $this->_maxPressureDrop($hourlyRows, $contextRows) >= self::PRESSURE_COLLAPSE_HPA;
    }

    /**
     * Returns true if ANY hourly row shows freezing rain: at least RAIN_THRESHOLD_MM
     * of precipitation with a mean temperature between -4 °C and +1 °C and, when the
     * weather code is known, a drizzle/rain code (3xx, 5xx incl. 511) rather than snow.
     *
     * @param array $hourlyRows All hourly rows for the day, each as a plain array
     * @return bool
     */
    public function checkFreezingRain(array $hourlyRows): bool
    {
        foreach ($hourlyRows as $row) {
            if ($this->_isFreezingRainRow($row)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns true if ANY hourly row has (temperature - dew_point) <= 2.5°C
     * AND wind_speed < 2.0 m/s AND clouds < 40%.
     *
     * @param array $hourlyRows All hourly rows for the day, each as a plain array
     * @return bool
     */
    public function checkFogRisk(array $hourlyRows): bool
    {
        foreach ($hourlyRows as $row) {
            $temp      = (float) ($row['temperature'] ?? PHP_FLOAT_MAX);
            $dewPoint  = (float) ($row['dew_point']   ?? -PHP_FLOAT_MAX);
            $windSpeed = (float) ($row['wind_speed']  ?? PHP_FLOAT_MAX);
            $clouds    = (float) ($row['clouds']      ?? PHP_FLOAT_MAX);

            if (($temp - $dewPoint) <= 2.5 && $windSpeed < 2.0 && $clouds < 40.0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns true if ANY hourly row has wind_speed > 12.0 m/s.
     *
     * @param array $hourlyRows All hourly rows for the day, each as a plain array
     * @return bool
     */
    public function checkStrongWind(array $hourlyRows): bool
    {
        foreach ($hourlyRows as $row) {
            $windSpeed = (float) ($row['wind_speed'] ?? 0.0);

            if ($windSpeed > 12.0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns true if ANY hourly row has humidity < 28% AND wind_speed > 4.0 m/s,
     * AND 7-day accumulated precipitation < 3.0 mm — classic dry steppe fire conditions.
     *
     * @param array $hourlyRows  All hourly rows for the day, each as a plain array
     * @param float $precip7days Rolling 7-day accumulated precipitation in mm
     * @return bool
     */
    public function checkFireRisk(array $hourlyRows, float $precip7days): bool
    {
        if ($precip7days >= 3.0) {
            return false;
        }

        foreach ($hourlyRows as $row) {
            $humidity  = (float) ($row['humidity']   ?? PHP_FLOAT_MAX);
            $windSpeed = (float) ($row['wind_speed'] ?? 0.0);

            if ($humidity < 28.0 && $windSpeed > 4.0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns true if today's temperature < -2°C AND at least 5 consecutive
     * preceding days all had average temperature > +5°C (spring onset detected).
     *
     * The last element of $recentDailyRows is treated as today's row.
     *
     * @param array $recentDailyRows Daily rows sorted ASC, last row = today
     * @return bool
     */
    public function checkLateFrost(array $recentDailyRows): bool
    {
        $count = count($recentDailyRows);

        if ($count < 2) {
            return false;
        }

        $todayTemp = (float) ($recentDailyRows[$count - 1]['temperature'] ?? PHP_FLOAT_MAX);

        if ($todayTemp >= -2.0) {
            return false;
        }

        // Check whether 5+ consecutive days preceding today were all > +5°C
        $warmStreak = 0;
        for ($i = $count - 2; $i >= 0; $i--) {
            $t = (float) ($recentDailyRows[$i]['temperature'] ?? -PHP_FLOAT_MAX);

            if ($t > 5.0) {
                $warmStreak++;
            } else {
                break;
            }
        }

        return $warmStreak >= 5;
    }

    /**
     * Returns true if the Steadman apparent temperature (heat index) exceeds 36°C
     * for ANY hourly row. Pre-check: T >= 25°C and RH >= 35%.
     *
     * @param array $hourlyRows All hourly rows for the day, each as a plain array
     * @return bool
     */
    public function checkHeatStress(array $hourlyRows): bool
    {
        foreach ($hourlyRows as $row) {
            $T  = (float) ($row['temperature'] ?? 0.0);
            $RH = (float) ($row['humidity']    ?? 0.0);

            if ($T < 25.0 || $RH < 35.0) {
                continue;
            }

            $hi = $this->_computeHeatIndex($T, $RH);

            if ($hi > 36.0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Computes the Standardised Precipitation Index (SPI) for a rolling window
     * of $days days (inclusive of $endDate) ending on $endDate.
     *
     * Only windows with at least 90% of their days present in daily_averages count,
     * both the current one and the historical ones (those start at the first year with
     * precipitation data), so a partly recorded window never looks like a drought.
     * Returns null if the current window is incomplete or fewer than 3 historical
     * windows qualify.
     *
     * @param string $endDate End date in 'Y-m-d' format
     * @param int    $days    Window length in days
     * @return float|null SPI value or null if insufficient history
     */
    public function computeSPI(string $endDate, int $days): ?float
    {
        try {
            $end        = new \DateTime($endDate);
            $start      = (clone $end)->modify('-' . ($days - 1) . ' days');
            $minPresent = (int) ceil(self::WINDOW_COVERAGE * $days);

            $currentSum = $this->_windowPrecipSum($start, $end, $minPresent);

            if ($currentSum === null) {
                return null;
            }

            $firstYear = $this->_firstPrecipYear();

            if ($firstYear === null) {
                return null;
            }

            $endYear = (int) $end->format('Y');
            $endMonth = (int) $end->format('n');
            $endDay   = (int) $end->format('j');

            $historicalSums = [];

            for ($y = $endYear - 1; $y >= $firstYear; $y--) {
                $histEnd   = (new \DateTime())->setDate($y, $endMonth, $endDay)->setTime(0, 0);
                $histStart = (clone $histEnd)->modify('-' . ($days - 1) . ' days');
                $sum       = $this->_windowPrecipSum($histStart, $histEnd, $minPresent);

                if ($sum !== null) {
                    $historicalSums[] = $sum;
                }
            }

            if (count($historicalSums) < 3) {
                return null;
            }

            $mean = array_sum($historicalSums) / count($historicalSums);
            $variance = array_sum(array_map(fn($v) => ($v - $mean) ** 2, $historicalSums)) / count($historicalSums);
            $std  = sqrt($variance);

            if ($std < 1e-9) {
                return 0.0;
            }

            return ($currentSum - $mean) / $std;
        } catch (\Exception $e) {
            log_message('error', 'AnomalyDetector::computeSPI error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Returns an associative array of current Z-scores for all key parameters:
     * temperature, pressure, precipitation, windSpeed, humidity, uvIndex.
     *
     * @param \DateTime $today    Reference date
     * @param array     $todayRow Single daily_averages row for today
     * @return array Keyed by parameter name, values are float|null Z-scores
     */
    public function computeAllParameterZScores(\DateTime $today, array $todayRow): array
    {
        $mapping = [
            'temperature'   => 'temperature',
            'pressure'      => 'pressure',
            'precipitation' => 'precipitation',
            'windSpeed'     => 'wind_speed',
            'humidity'      => 'humidity',
            'uvIndex'       => 'uv_index',
        ];

        $scores = [];

        foreach ($mapping as $key => $column) {
            $value = isset($todayRow[$column]) ? (float) $todayRow[$column] : null;

            if ($value === null) {
                $scores[$key] = null;
            } else {
                $scores[$key] = $this->computeZScore($column, $today, $value);
            }
        }

        return $scores;
    }

    /**
     * Runs all anomaly checks for the given day and returns an array keyed by anomaly type string.
     * Each value is ['active' => bool, 'zScore' => ?float, 'extraMetric' => ?array].
     *
     * @param \DateTime $today            Reference date
     * @param array     $recentHourlyRows All hourly rows for the day, sorted DESC
     * @param array     $todayRow         Today's daily_averages row (plain array)
     * @param array     $contextHourlyRows Hourly rows just before the day (used only for the pressure collapse)
     * @return array Anomaly state keyed by type
     */
    public function checkAllAnomalies(
        \DateTime $today,
        array $recentHourlyRows,
        array $todayRow,
        array $contextHourlyRows = []
    ): array
    {
        $zScores = $this->computeAllParameterZScores($today, $todayRow);

        // Fetch last few daily rows for consecutive-day checks
        try {
            $recentDailyRows = $this->dailyModel
                ->where('date <=', $today->format('Y-m-d'))
                ->orderBy('date', 'DESC')
                ->limit(10)
                ->findAll();

            // Reverse to ASC order for checkLateFrost
            $recentDailyRows = array_reverse(array_map(
                fn($r) => $r instanceof \CodeIgniter\Entity\Entity ? $r->toRawArray() : (is_array($r) ? $r : (array) $r),
                $recentDailyRows
            ));
        } catch (\Exception $e) {
            log_message('error', 'AnomalyDetector::checkAllAnomalies fetch daily rows error: ' . $e->getMessage());
            $recentDailyRows = [];
        }

        // Heat wave: temp Z-score > 1.5 for 2+ consecutive recent days
        $heatWaveActive = $this->_checkConsecutiveZScore($today, 'temperature', 1.5, 2, 'above');

        // Cold snap: temp Z-score < -1.5 for 2+ consecutive recent days
        $coldSnapActive = $this->_checkConsecutiveZScore($today, 'temperature', -1.5, 2, 'below');

        // Rolling 7-day precip for fire risk
        try {
            $precip7Rows = $this->dailyModel
                ->select('precipitation')
                ->where('date >=', (clone $today)->modify('-6 days')->format('Y-m-d'))
                ->where('date <=', $today->format('Y-m-d'))
                ->where('precipitation IS NOT NULL')
                ->findAll();

            $precip7days = array_sum(array_map(
                fn($r) => (float) (is_array($r) ? ($r['precipitation'] ?? 0.0) : ($r->precipitation ?? 0.0)),
                $precip7Rows
            ));
        } catch (\Exception $e) {
            log_message('error', 'AnomalyDetector::checkAllAnomalies precip7 error: ' . $e->getMessage());
            $precip7days = 0.0;
        }

        $spi30     = $this->computeSPI($today->format('Y-m-d'), 30);
        $pressureZ = $zScores['pressure'] ?? 0.0;
        $windZScore = $zScores['windSpeed'] ?? 0.0;

        // hourlyRows as plain arrays for all intraday threshold checks
        $hourlyArr  = $this->_toArrays($recentHourlyRows);
        $contextArr = $this->_toArrays($contextHourlyRows);

        $uvMax = $this->_getMaxUv($hourlyArr);

        return [
            'heat_wave' => [
                'active'      => $heatWaveActive,
                'zScore'      => $zScores['temperature'],
                'extraMetric' => null,
            ],
            'cold_snap' => [
                'active'      => $coldSnapActive,
                'zScore'      => $zScores['temperature'],
                'extraMetric' => null,
            ],
            'pressure_collapse' => [
                'active'      => $this->checkPressureCollapse($hourlyArr, $contextArr),
                'zScore'      => null,
                'extraMetric' => ['label' => 'pressure_drop_hpa', 'value' => round($this->_maxPressureDrop($hourlyArr, $contextArr), 2)],
            ],
            'freezing_rain' => [
                'active'      => $this->checkFreezingRain($hourlyArr),
                'zScore'      => null,
                'extraMetric' => ['label' => 'temperature_c', 'value' => $this->_getMinFreezingRainTemp($hourlyArr) ?? round((float) ($todayRow['temperature'] ?? 0.0), 1)],
            ],
            'fog_risk' => [
                'active'      => $this->checkFogRisk($hourlyArr),
                'zScore'      => null,
                'extraMetric' => ['label' => 'dew_spread_c', 'value' => $this->_getMinDewSpread($hourlyArr) ?? round((float) ($todayRow['temperature'] ?? 0.0) - (float) ($todayRow['dew_point'] ?? 0.0), 1)],
            ],
            'drought_spi30' => [
                'active'      => $spi30 !== null && $spi30 < -1.5,
                'zScore'      => null,
                'extraMetric' => ['label' => 'SPI-30', 'value' => $spi30],
            ],
            'extreme_uv' => [
                'active'      => $uvMax !== null && $uvMax >= 7.0,
                'zScore'      => $zScores['uvIndex'],
                'extraMetric' => $uvMax !== null ? ['label' => 'uv_index_max', 'value' => round($uvMax, 1)] : null,
            ],
            'pressure_high' => [
                'active'      => $pressureZ !== null && $pressureZ > 1.8,
                'zScore'      => $pressureZ,
                'extraMetric' => null,
            ],
            'strong_wind' => [
                'active'      => $this->checkStrongWind($hourlyArr),
                'zScore'      => $windZScore,
                'extraMetric' => ['label' => 'wind_speed_ms', 'value' => $this->_getMaxWindSpeed($hourlyArr) ?? round((float) ($todayRow['wind_speed'] ?? 0.0), 1)],
            ],
            'fire_risk' => [
                'active'      => $this->checkFireRisk($hourlyArr, $precip7days),
                'zScore'      => null,
                'extraMetric' => ['label' => 'precip7d', 'value' => $precip7days],
            ],
            'late_frost' => [
                'active'      => $this->checkLateFrost($recentDailyRows),
                'zScore'      => $zScores['temperature'],
                'extraMetric' => ['label' => 'temperature_c', 'value' => round((float) ($todayRow['temperature'] ?? 0.0), 1)],
            ],
            'heat_stress' => [
                'active'      => $this->checkHeatStress($hourlyArr),
                'zScore'      => null,
                'extraMetric' => ['label' => 'heat_index_c', 'value' => $this->_getMaxHeatIndex($hourlyArr) ?? round((float) ($todayRow['temperature'] ?? 0.0), 1)],
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Checks whether the Z-score for $parameter has been consistently above/below
     * a threshold for the last $consecutiveDays days (including today).
     *
     * @param \DateTime $today
     * @param string    $parameter
     * @param float     $threshold
     * @param int       $consecutiveDays
     * @param string    $direction 'above' or 'below'
     * @return bool
     */
    private function _checkConsecutiveZScore(
        \DateTime $today,
        string $parameter,
        float $threshold,
        int $consecutiveDays,
        string $direction
    ): bool {
        try {
            $rows = $this->dailyModel
                ->select("date, {$parameter}")
                ->where('date <=', $today->format('Y-m-d'))
                ->where("{$parameter} IS NOT NULL")
                ->orderBy('date', 'DESC')
                ->limit($consecutiveDays)
                ->findAll();

            if (count($rows) < $consecutiveDays) {
                return false;
            }

            foreach (array_values($rows) as $index => $row) {
                $rowArr  = $row instanceof \CodeIgniter\Entity\Entity ? $row->toRawArray() : (is_array($row) ? $row : (array) $row);
                $dateStr = substr((string) ($rowArr['date'] ?? ''), 0, 10);
                $value   = (float) ($rowArr[$parameter] ?? 0.0);

                // The rows must be today, yesterday, … with no missing day in between
                $expected = (clone $today)->modify('-' . $index . ' days')->format('Y-m-d');

                if ($dateStr !== $expected) {
                    return false;
                }

                $rowDate = new \DateTime($dateStr);
                $z       = $this->computeZScore($parameter, $rowDate, $value);

                if ($z === null) {
                    return false;
                }

                if ($direction === 'above' && $z <= $threshold) {
                    return false;
                }

                if ($direction === 'below' && $z >= $threshold) {
                    return false;
                }
            }

            return true;
        } catch (\Exception $e) {
            log_message('error', 'AnomalyDetector::_checkConsecutiveZScore error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Computes the Steadman heat index (°C) from temperature (°C) and relative humidity (%).
     *
     * @param float $T  Temperature in °C
     * @param float $RH Relative humidity 0–100
     * @return float Heat index in °C
     */
    private function _computeHeatIndex(float $T, float $RH): float
    {
        return -8.78469475556
            + 1.61139411   * $T
            + 2.33854883889 * $RH
            - 0.14611605   * $T * $RH
            - 0.012308094  * $T ** 2
            - 0.0164248277778 * $RH ** 2
            + 0.002211732  * $T ** 2 * $RH
            + 0.00072546   * $T * $RH ** 2
            - 0.000003582  * $T ** 2 * $RH ** 2;
    }

    /**
     * Returns the largest pressure drop (earlier minus later reading) found between
     * two hourly readings at most PRESSURE_WINDOW_SECONDS apart.
     *
     * Rows carrying a 'date' are ordered by it; rows without one are taken as
     * consecutive hours, newest first.
     *
     * @param array $hourlyRows  Hourly rows of the day
     * @param array $contextRows Extra rows before the day (optional)
     * @return float Largest drop in hPa (0.0 if none or fewer than 2 readings)
     */
    private function _maxPressureDrop(array $hourlyRows, array $contextRows = []): float
    {
        $rows   = array_merge($hourlyRows, $contextRows);
        $points = [];

        foreach ($rows as $index => $row) {
            if (!isset($row['pressure']) || $row['pressure'] === null || $row['pressure'] === '') {
                continue;
            }

            $ts = isset($row['date']) && $row['date'] !== ''
                ? strtotime(substr((string) $row['date'], 0, 19) . ' UTC')
                : -$index * 3600;

            if ($ts === false) {
                continue;
            }

            $points[] = ['ts' => $ts, 'p' => (float) $row['pressure']];
        }

        usort($points, static fn(array $a, array $b): int => $a['ts'] <=> $b['ts']);

        $count   = count($points);
        $maxDrop = 0.0;

        for ($i = 0; $i < $count; $i++) {
            for ($j = $i + 1; $j < $count && $points[$j]['ts'] - $points[$i]['ts'] <= self::PRESSURE_WINDOW_SECONDS; $j++) {
                $maxDrop = max($maxDrop, $points[$i]['p'] - $points[$j]['p']);
            }
        }

        return $maxDrop;
    }

    /**
     * Whether one hourly row qualifies as freezing rain.
     *
     * @param array $row Hourly row
     * @return bool
     */
    private function _isFreezingRainRow(array $row): bool
    {
        if (!isset($row['temperature'], $row['precipitation'])) {
            return false;
        }

        $temp   = (float) $row['temperature'];
        $precip = (float) $row['precipitation'];

        if ($precip < PrecipitationModel::RAIN_THRESHOLD_MM
            || $temp < self::FREEZING_RAIN_MIN_C
            || $temp > self::FREEZING_RAIN_MAX_C) {
            return false;
        }

        if (isset($row['weather_id']) && $row['weather_id'] !== '') {
            $id = (int) $row['weather_id'];

            return ($id >= 300 && $id < 400) || ($id >= 500 && $id < 600);
        }

        return true;
    }

    /**
     * Highest hourly uv_index of the day, or null if no row has one.
     *
     * @param array $hourlyRows Hourly rows as plain arrays
     * @return float|null
     */
    private function _getMaxUv(array $hourlyRows): ?float
    {
        $max = null;

        foreach ($hourlyRows as $row) {
            if (!isset($row['uv_index'])) {
                continue;
            }

            $uv = (float) $row['uv_index'];

            if ($max === null || $uv > $max) {
                $max = $uv;
            }
        }

        return $max;
    }

    /**
     * Sum of daily precipitation over [$start, $end], or null when fewer than
     * $minPresent days have a (non-NULL) value.
     *
     * @param \DateTime $start      First day (inclusive)
     * @param \DateTime $end        Last day (inclusive)
     * @param int       $minPresent Minimum number of days with data
     * @return float|null
     */
    private function _windowPrecipSum(\DateTime $start, \DateTime $end, int $minPresent): ?float
    {
        $rows = $this->dailyModel
            ->select('precipitation')
            ->where('date >=', $start->format('Y-m-d'))
            ->where('date <=', $end->format('Y-m-d') . ' 23:59:59')
            ->where('precipitation IS NOT NULL')
            ->findAll();

        if (count($rows) < $minPresent) {
            return null;
        }

        return array_sum(array_map(
            fn($r) => (float) (is_array($r) ? ($r['precipitation'] ?? 0.0) : ($r->precipitation ?? 0.0)),
            $rows
        ));
    }

    /**
     * Year of the first daily_averages row with precipitation, or null if none.
     *
     * @return int|null
     */
    private function _firstPrecipYear(): ?int
    {
        if ($this->firstPrecipYearLoaded) {
            return $this->firstPrecipYear;
        }

        $row = $this->dailyModel
            ->select('MIN(date) AS first_date')
            ->where('precipitation IS NOT NULL')
            ->first();

        $arr   = $row ? $this->_toArray($row) : [];
        $first = $arr['first_date'] ?? ($arr['date'] ?? null);

        $this->firstPrecipYear       = $first ? (int) substr((string) $first, 0, 4) : null;
        $this->firstPrecipYearLoaded = true;

        return $this->firstPrecipYear;
    }

    /**
     * Normalises a model row (entity, array or object) to a plain array.
     *
     * @param mixed $row
     * @return array
     */
    private function _toArray(mixed $row): array
    {
        return $row instanceof \CodeIgniter\Entity\Entity
            ? $row->toRawArray()
            : (is_array($row) ? $row : (array) $row);
    }

    /**
     * Normalises a list of model rows to plain arrays.
     *
     * @param array $rows
     * @return array
     */
    private function _toArrays(array $rows): array
    {
        return array_map(fn($r) => $this->_toArray($r), $rows);
    }

    /**
     * Returns the temperature of the coldest hourly row that meets freezing-rain
     * conditions (see _isFreezingRainRow), or null if none found.
     *
     * @param array $hourlyRows All hourly rows for the day, each as a plain array
     * @return float|null Minimum qualifying temperature rounded to 1dp, or null
     */
    private function _getMinFreezingRainTemp(array $hourlyRows): ?float
    {
        $minTemp = null;

        foreach ($hourlyRows as $row) {
            if (!$this->_isFreezingRainRow($row)) {
                continue;
            }

            $temp = (float) $row['temperature'];

            if ($minTemp === null || $temp < $minTemp) {
                $minTemp = $temp;
            }
        }

        return $minTemp !== null ? round($minTemp, 1) : null;
    }

    /**
     * Returns the minimum (temperature - dew_point) spread found across all
     * hourly rows, or null if no rows have both fields.
     *
     * @param array $hourlyRows All hourly rows for the day, each as a plain array
     * @return float|null Minimum dew-point spread rounded to 1dp, or null
     */
    private function _getMinDewSpread(array $hourlyRows): ?float
    {
        $minSpread = null;

        foreach ($hourlyRows as $row) {
            $temp     = isset($row['temperature']) ? (float) $row['temperature'] : null;
            $dewPoint = isset($row['dew_point'])   ? (float) $row['dew_point']   : null;

            if ($temp === null || $dewPoint === null) {
                continue;
            }

            $spread = round($temp - $dewPoint, 1);

            if ($minSpread === null || $spread < $minSpread) {
                $minSpread = $spread;
            }
        }

        return $minSpread;
    }

    /**
     * Returns the highest wind_speed found across all hourly rows,
     * or null if the array is empty.
     *
     * @param array $hourlyRows All hourly rows for the day, each as a plain array
     * @return float|null Maximum wind speed rounded to 1dp, or null
     */
    private function _getMaxWindSpeed(array $hourlyRows): ?float
    {
        if (empty($hourlyRows)) {
            return null;
        }

        $max = null;

        foreach ($hourlyRows as $row) {
            $ws = (float) ($row['wind_speed'] ?? 0.0);

            if ($max === null || $ws > $max) {
                $max = $ws;
            }
        }

        return $max !== null ? round($max, 1) : null;
    }

    /**
     * Returns the highest computed heat index across qualifying hourly rows
     * (T >= 25°C, RH >= 35%), or null if none qualify.
     *
     * @param array $hourlyRows All hourly rows for the day, each as a plain array
     * @return float|null Maximum heat index rounded to 1dp, or null
     */
    private function _getMaxHeatIndex(array $hourlyRows): ?float
    {
        $maxHI = null;

        foreach ($hourlyRows as $row) {
            $T  = (float) ($row['temperature'] ?? 0.0);
            $RH = (float) ($row['humidity']    ?? 0.0);

            if ($T < 25.0 || $RH < 35.0) {
                continue;
            }

            $hi = $this->_computeHeatIndex($T, $RH);

            if ($maxHI === null || $hi > $maxHI) {
                $maxHI = $hi;
            }
        }

        return $maxHI !== null ? round($maxHI, 1) : null;
    }
}
