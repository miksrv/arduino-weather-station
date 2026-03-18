<?php

namespace App\Models;

use CodeIgniter\Model;

/**
 * Class PrecipitationModel
 *
 * Provides precipitation-specific queries against the daily_averages table
 * and pure-PHP statistical computations for the precipitation calendar feature.
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
                'SELECT DATE(date) AS day, SUM(precipitation) AS total
                 FROM daily_averages
                 WHERE YEAR(date) = ?
                 GROUP BY DATE(date)
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
        $totalYear = 0.0;
        $rainyDays = 0;
        $dryDays   = 0;
        $maxValue  = 0.0;
        $maxDate   = '';
        $monthly   = array_fill(1, 12, 0.0);

        foreach ($dailyTotals as $entry) {
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

        $streaks = $this->_computeStreaks($dailyTotals);

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
     * Iterates over sorted daily entries and computes the longest consecutive
     * wet streak (total > 0.1) and the longest consecutive dry streak (total <= 0.1).
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
            $isWet = $total > 0.1;

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
