<?php

namespace App\Models;

use CodeIgniter\Model;
use DateInterval;
use DatePeriod;
use DateTime;

/**
 * Class PrecipitationModel
 *
 * Provides precipitation-specific queries and pure-PHP statistical computations
 * for the precipitation calendar feature.
 *
 * Daily totals are sourced from raw_weather_data using a two-level aggregation:
 * hourly AVG across all sources (inner query) followed by SUM of those hourly
 * averages per day (outer query). This correctly handles multiple concurrent
 * sources without inflating totals. Available years are resolved against
 * daily_averages, which is a cheaper aggregated proxy for the same year coverage.
 *
 * @package App\Models
 *
 * Public Methods:
 * - getDailyTotals(int $year): array  — daily precipitation sums for a given year
 * - getAvailableYears(): array        — distinct years present in daily_averages
 * - getStats(int $year, array $dailyTotals): array — yearly statistics computed in PHP
 */
class PrecipitationModel extends Model
{
    protected $table         = 'daily_averages';
    protected $primaryKey    = 'id';
    protected $useTimestamps = false;
    protected $returnType    = 'array';

    /**
     * Returns the daily precipitation totals for the given year.
     *
     * Queries raw_weather_data directly (same source as the heatmap) using a
     * two-step aggregation to eliminate source duplication without relying on
     * COUNT(DISTINCT source):
     *
     *   1. Inner query — for each calendar hour, compute the average precipitation
     *      across all sources that reported during that hour (AVG collapses multiple
     *      sources recording the same physical rain event into a single figure).
     *
     *   2. Outer query — sum those hourly averages per day, giving an accumulated
     *      daily total that is independent of how many sources were active in each
     *      hour.
     *
     * Rows where precipitation is NULL or zero are excluded before the inner
     * aggregation for efficiency.
     *
     * Each element contains:
     *   - 'date'  => 'YYYY-MM-DD'
     *   - 'total' => float  (rounded to 1 decimal place)
     *
     * @param int $year
     * @return array
     */
    public function getDailyTotals(int $year): array
    {
        $rows = $this->db
            ->query(
                'SELECT day, ROUND(SUM(hour_avg), 1) AS total
                 FROM (
                     SELECT DATE(date)                             AS day,
                            DATE_FORMAT(date, \'%Y-%m-%d %H:00:00\') AS hour_slot,
                            AVG(precipitation)                    AS hour_avg
                     FROM raw_weather_data
                     WHERE YEAR(date) = ?
                       AND precipitation IS NOT NULL
                       AND precipitation > 0
                     GROUP BY day, hour_slot
                 ) AS hourly
                 GROUP BY day
                 ORDER BY day',
                [$year]
            )
            ->getResultArray();

        $result = [];

        foreach ($rows as $row) {
            $result[] = [
                'date'  => (string) $row['day'],
                'total' => round((float) ($row['total'] ?? 0), 1),
            ];
        }

        return $result;
    }

    /**
     * Returns an ascending list of distinct years that have rows in daily_averages.
     *
     * @return int[]
     */
    public function getAvailableYears(): array
    {
        $rows = $this->db
            ->query('SELECT DISTINCT YEAR(date) AS yr FROM daily_averages ORDER BY yr')
            ->getResultArray();

        return array_map(static fn(array $r): int => (int) $r['yr'], $rows);
    }

    /**
     * Computes precipitation statistics for the given year entirely from the
     * already-fetched $dailyTotals array — no additional database queries.
     *
     * Before computing any statistics, $dailyTotals is expanded into a full
     * calendar via _buildFullCalendar(). Days absent from $dailyTotals are
     * inserted with total = 0.0 mm so that dry-day counts and dry-streak
     * detection are correct. Future days in the current year are not included.
     *
     * Returns:
     * [
     *   'totalYear'        => float,
     *   'rainyDays'        => int,
     *   'dryDays'          => int,
     *   'maxDailyTotal'    => ['value' => float, 'date' => string],
     *   'longestWetStreak' => ['days' => int, 'start' => string, 'end' => string],
     *   'longestDryStreak' => ['days' => int, 'start' => string, 'end' => string],
     *   'monthlyTotals'    => [['month' => int, 'total' => float], ...],  // 12 entries
     * ]
     *
     * @param int   $year
     * @param array $dailyTotals  Output of getDailyTotals()
     * @return array
     */
    public function getStats(int $year, array $dailyTotals): array
    {
        $fullCalendar = $this->_buildFullCalendar($year, $dailyTotals);

        $totalYear = 0.0;
        $rainyDays = 0;
        $dryDays   = 0;
        $maxValue  = 0.0;
        $maxDate   = '';
        $monthly   = array_fill(1, 12, 0.0);

        foreach ($fullCalendar as $entry) {
            $total = (float) $entry['total'];
            $date  = (string) $entry['date'];

            $totalYear += $total;

            if ($total > 0.1) {
                $rainyDays++;
            } else {
                $dryDays++;
            }

            if ($total > $maxValue) {
                $maxValue = $total;
                $maxDate  = $date;
            }

            $month = (int) date('n', strtotime($date));

            if ($month >= 1 && $month <= 12) {
                $monthly[$month] += $total;
            }
        }

        $streaks = $this->_computeStreaks($fullCalendar);

        $monthlyTotals = [];

        for ($m = 1; $m <= 12; $m++) {
            $monthlyTotals[] = [
                'month' => $m,
                'total' => round($monthly[$m], 1),
            ];
        }

        return [
            'totalYear'        => round($totalYear, 1),
            'rainyDays'        => $rainyDays,
            'dryDays'          => $dryDays,
            'maxDailyTotal'    => [
                'value' => round($maxValue, 1),
                'date'  => $maxDate,
            ],
            'longestWetStreak' => $streaks['wet'],
            'longestDryStreak' => $streaks['dry'],
            'monthlyTotals'    => $monthlyTotals,
        ];
    }

    /**
     * Builds a complete, chronologically sorted array of daily entries for the
     * given year, covering every calendar day from {$year}-01-01 through the
     * earlier of {$year}-12-31 and today.
     *
     * Days present in $dailyTotals are taken at face value; days absent are
     * inserted with total = 0.0, ensuring that dry days are never silently
     * omitted from downstream statistics.
     *
     * @param int   $year
     * @param array $dailyTotals  Array of ['date' => 'YYYY-MM-DD', 'total' => float]
     * @return array              Array of ['date' => 'YYYY-MM-DD', 'total' => float]
     */
    private function _buildFullCalendar(int $year, array $dailyTotals): array
    {
        $lookup = [];

        foreach ($dailyTotals as $entry) {
            $lookup[(string) $entry['date']] = (float) $entry['total'];
        }

        $start  = new DateTime("{$year}-01-01");
        $endOfYear = new DateTime("{$year}-12-31");
        $today  = new DateTime('today');
        $end    = $endOfYear < $today ? $endOfYear : $today;

        // DatePeriod end is exclusive, so add one day
        $end->modify('+1 day');

        $period  = new DatePeriod($start, new DateInterval('P1D'), $end);
        $calendar = [];

        foreach ($period as $day) {
            $dateStr    = $day->format('Y-m-d');
            $calendar[] = [
                'date'  => $dateStr,
                'total' => $lookup[$dateStr] ?? 0.0,
            ];
        }

        return $calendar;
    }

    /**
     * Iterates over sorted daily entries and computes the longest consecutive
     * wet streak (total > 0) and the longest consecutive dry streak (total = 0).
     *
     * Returns:
     * [
     *   'wet' => ['days' => int, 'start' => string, 'end' => string],
     *   'dry' => ['days' => int, 'start' => string, 'end' => string],
     * ]
     *
     * @param array $days  Array of ['date' => 'YYYY-MM-DD', 'total' => float]
     * @return array
     */
    private function _computeStreaks(array $days): array
    {
        $empty = ['days' => 0, 'start' => '', 'end' => ''];

        $bestWet = $empty;
        $bestDry = $empty;

        $curWetStart = '';
        $curWetCount = 0;
        $curDryStart = '';
        $curDryCount = 0;

        foreach ($days as $entry) {
            $total = (float) $entry['total'];
            $date  = (string) $entry['date'];
            $isWet = $total > 0.0;

            // --- wet streak ---
            if ($isWet) {
                if ($curWetCount === 0) {
                    $curWetStart = $date;
                }
                $curWetCount++;

                if ($curWetCount > $bestWet['days']) {
                    $bestWet = [
                        'days'  => $curWetCount,
                        'start' => $curWetStart,
                        'end'   => $date,
                    ];
                }
            } else {
                $curWetCount = 0;
                $curWetStart = '';
            }

            // --- dry streak ---
            if (!$isWet) {
                if ($curDryCount === 0) {
                    $curDryStart = $date;
                }
                $curDryCount++;

                if ($curDryCount > $bestDry['days']) {
                    $bestDry = [
                        'days'  => $curDryCount,
                        'start' => $curDryStart,
                        'end'   => $date,
                    ];
                }
            } else {
                $curDryCount = 0;
                $curDryStart = '';
            }
        }

        return [
            'wet' => $bestWet,
            'dry' => $bestDry,
        ];
    }
}
