<?php

namespace App\Libraries;

/**
 * Class SnowpackCalculator
 *
 * Computes Snow Water Equivalent (SWE) accumulation and melt using a simplified
 * temperature-index (degree-day) model. Constants are calibrated to the
 * Roshydromet values for the Ural River basin open steppe.
 *
 * @package App\Libraries
 */
class SnowpackCalculator
{
    /** @var float All precipitation is snow below this temperature (°C) */
    private float $T_SNOW = -1.0;

    /** @var float All precipitation is rain above this temperature (°C) */
    private float $T_RAIN = 2.0;

    /** @var float Snowmelt begins above this temperature (°C) */
    private float $T_MELT = 0.0;

    /** @var float Degree-day factor — mm SWE melt per °C per day */
    private float $DDF = 3.5;

    /** @var float Fraction of rain-on-snow that converts to additional melt */
    private float $RAIN_ON_SNOW_FACTOR = 0.8;

    /**
     * Returns the [start, end] date strings of the hydrological season (Oct 1 – May 31)
     * that contains the given reference date. If the date falls between Jun 1 and Sep 30
     * (off-season), returns the upcoming season (next Oct 1 – following May 31).
     *
     * @param \DateTime $referenceDate
     * @return array{0: string, 1: string} [start_date, end_date] as 'Y-m-d' strings
     */
    public function getSeasonRange(\DateTime $referenceDate): array
    {
        $month = (int) $referenceDate->format('n');
        $year  = (int) $referenceDate->format('Y');

        if ($month >= 10) {
            // Oct–Dec: season starts this year
            $startYear = $year;
        } elseif ($month <= 5) {
            // Jan–May: season started last October
            $startYear = $year - 1;
        } else {
            // Jun–Sep: off-season, return upcoming season
            $startYear = $year;
        }

        $start = sprintf('%d-10-01', $startYear);
        $end   = sprintf('%d-05-31', $startYear + 1);

        return [$start, $end];
    }

    /**
     * Iterates the provided daily rows (sorted ASC by date, covering the season
     * from Oct 1 onwards) and computes the running SWE at each step using the
     * temperature-index accumulation and degree-day melt model.
     *
     * Each row must have 'date', 'temperature', and 'precipitation' keys.
     * SWE is clamped to 0 — it never goes negative.
     *
     * @param array $dailyRows Rows from daily_averages, sorted ASC by date
     * @return array Array of ['date' => 'Y-m-d', 'swe' => float]
     */
    public function computeSWESeries(array $dailyRows): array
    {
        $swe    = 0.0;
        $series = [];

        foreach ($dailyRows as $row) {
            $temp   = (float) ($row['temperature']   ?? 0.0);
            $precip = (float) ($row['precipitation'] ?? 0.0);
            $date   = is_string($row['date'])
                ? substr($row['date'], 0, 10)
                : (($row['date'] instanceof \DateTimeInterface) ? $row['date']->format('Y-m-d') : (string) $row['date']);

            // Accumulation phase
            if ($temp < $this->T_SNOW) {
                $swe += $precip;
            } elseif ($temp < $this->T_RAIN) {
                $swe += $precip * 0.5;
            }
            // else: above T_RAIN — no accumulation

            // Melt phase
            if ($temp > $this->T_MELT && $swe > 0.0) {
                $melt = $this->DDF * ($temp - $this->T_MELT);

                if ($precip > 1.0) {
                    $melt += $precip * $this->RAIN_ON_SNOW_FACTOR;
                }

                $swe = max(0.0, $swe - $melt);
            }

            $series[] = ['date' => $date, 'swe' => round($swe, 4)];
        }

        return $series;
    }

    /**
     * Given a SWE series (output of computeSWESeries), returns the total melt
     * (decrease in SWE) that occurred over the last $days days.
     *
     * Melt is computed as the sum of all day-to-day SWE reductions within the window.
     * Increases (accumulation days) are ignored.
     *
     * @param array $sweSeries Output of computeSWESeries
     * @param int   $days      Lookback window in days
     * @return float Total melt in mm SWE over the window
     */
    public function computeMeltRateLast14Days(array $sweSeries, int $days = 14): float
    {
        $count = count($sweSeries);

        if ($count < 2) {
            return 0.0;
        }

        $window = array_slice($sweSeries, -$days);
        $melt   = 0.0;

        for ($i = 1, $len = count($window); $i < $len; $i++) {
            $delta = $window[$i - 1]['swe'] - $window[$i]['swe'];

            if ($delta > 0.0) {
                $melt += $delta;
            }
        }

        return round($melt, 4);
    }

    /**
     * Counts days in the last $lookbackDays where a rain-on-snow event occurred:
     *   temperature > T_MELT  AND  precipitation > 1.0  AND  swe > 0
     *
     * Requires both the daily rows and the parallel SWE series to check swe > 0.
     *
     * @param array $dailyRows    Rows from daily_averages, sorted ASC by date
     * @param array $sweSeries    Parallel SWE series from computeSWESeries
     * @param int   $lookbackDays Number of most-recent days to check
     * @return int Count of rain-on-snow days
     */
    public function countRainOnSnowDays(array $dailyRows, array $sweSeries, int $lookbackDays = 21): int
    {
        $count   = 0;
        $total   = count($dailyRows);
        $sweMap  = [];

        foreach ($sweSeries as $entry) {
            $sweMap[$entry['date']] = $entry['swe'];
        }

        // Take only the last $lookbackDays rows
        $window = array_slice($dailyRows, -$lookbackDays);

        foreach ($window as $row) {
            $temp   = (float) ($row['temperature']   ?? 0.0);
            $precip = (float) ($row['precipitation'] ?? 0.0);
            $date   = is_string($row['date'])
                ? substr($row['date'], 0, 10)
                : (($row['date'] instanceof \DateTimeInterface) ? $row['date']->format('Y-m-d') : (string) $row['date']);

            $swe = $sweMap[$date] ?? 0.0;

            if ($temp > $this->T_MELT && $precip > 1.0 && $swe > 0.0) {
                $count++;
            }
        }

        return $count;
    }
}
