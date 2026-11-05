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
 * Daily totals and available years are read from daily_averages, whose
 * precipitation is the day's total (sum of hourly amounts, each hour balanced
 * across sources), the same figure the climate page sums up.
 *
 * @package App\Models
 *
 * Public Methods:
 * - getDailyTotals(int $year): array  — daily precipitation sums for a given year
 * - getAvailableYears(): array        — distinct years with precipitation data in daily_averages
 * - getObservedDays(int $year): array — days of a year that have a precipitation value
 * - getStats(int $year, array $dailyTotals, ?array $observedDays): array — yearly statistics computed in PHP
 */
class PrecipitationModel extends Model
{
    /**
     * @var float Noise floor (mm) used to decide whether a day actually
     * "rained" versus a spurious sensor reading. This is the single source
     * of truth for that threshold — App\Libraries\EventFeedBuilder references
     * this same constant for its precipitation events.
     */
    public const RAIN_THRESHOLD_MM = 0.1;

    protected $table            = 'daily_averages';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $allowedFields    = [];

    protected $useTimestamps = false;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $validationRules    = [];
    protected $validationMessages = [];
    protected $skipValidation     = false;

    /**
     * Returns the daily precipitation totals for the given year.
     *
     * Reads daily_averages, whose precipitation is the day's total: the sum of the
     * hourly amounts, each hour being the mean of the per-source means
     * ({@see HourlyAveragesModel::getDailyAverages()}). So the calendar shows the
     * same totals as the climate page; a dry report counts too, so one wet source
     * among dry ones no longer makes the whole hour wet. Dry days are left out.
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
                'SELECT DATE(date) AS day, ROUND(precipitation, 1) AS total
                 FROM daily_averages
                 WHERE date >= ?
                   AND date < ?
                   AND precipitation > 0
                 ORDER BY date',
                [sprintf('%04d-01-01 00:00:00', $year), sprintf('%04d-01-01 00:00:00', $year + 1)]
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
     * Returns an ascending list of distinct years that have precipitation data
     * (a year whose daily precipitation is all NULL is not listed).
     *
     * @return int[]
     */
    public function getAvailableYears(): array
    {
        $rows = $this->db
            ->query('SELECT DISTINCT YEAR(date) AS yr FROM daily_averages WHERE precipitation IS NOT NULL ORDER BY yr')
            ->getResultArray();

        return array_map(static fn(array $r): int => (int) $r['yr'], $rows);
    }

    /**
     * Returns the days of the given year that have a daily_averages row with a
     * (non-NULL) precipitation value, dry days included. Days missing from this
     * list were not observed and must not count as dry.
     *
     * @param int $year
     * @return string[] Ascending 'YYYY-MM-DD' dates
     */
    public function getObservedDays(int $year): array
    {
        $rows = $this->db
            ->query(
                'SELECT DATE(date) AS day
                 FROM daily_averages
                 WHERE date >= ?
                   AND date < ?
                   AND precipitation IS NOT NULL
                 ORDER BY date',
                [sprintf('%04d-01-01 00:00:00', $year), sprintf('%04d-01-01 00:00:00', $year + 1)]
            )
            ->getResultArray();

        return array_map(static fn(array $r): string => (string) $r['day'], $rows);
    }

    /**
     * Computes precipitation statistics for the given year entirely from the
     * already-fetched $dailyTotals array — no additional database queries.
     *
     * Before computing any statistics, $dailyTotals is expanded into a calendar
     * via _buildFullCalendar(). Days absent from $dailyTotals but listed in
     * $observedDays are inserted as dry (0.0 mm). Days that were not observed
     * (no daily row, or NULL precipitation) are left out: they are neither dry
     * days nor part of a streak, and they break one. With $observedDays = null
     * every day up to today counts as observed. Future days are not included.
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
     * @param array      $dailyTotals  Output of getDailyTotals()
     * @param array|null $observedDays Output of getObservedDays(); null = all days observed
     * @return array
     */
    public function getStats(int $year, array $dailyTotals, ?array $observedDays = null): array
    {
        $fullCalendar = $this->_buildFullCalendar($year, $dailyTotals, $observedDays);

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

            if ($total > self::RAIN_THRESHOLD_MM) {
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
     * Builds a chronologically sorted array of the observed daily entries for the
     * given year, from {$year}-01-01 through the earlier of {$year}-12-31 and today.
     *
     * Days present in $dailyTotals are taken at face value; other days are inserted
     * with total = 0.0 only when they are in $observedDays (or $observedDays is null).
     *
     * @param int        $year
     * @param array      $dailyTotals  Array of ['date' => 'YYYY-MM-DD', 'total' => float]
     * @param array|null $observedDays 'YYYY-MM-DD' strings of days with data, or null for all
     * @return array                   Array of ['date' => 'YYYY-MM-DD', 'total' => float]
     */
    private function _buildFullCalendar(int $year, array $dailyTotals, ?array $observedDays = null): array
    {
        $lookup = [];

        foreach ($dailyTotals as $entry) {
            $lookup[(string) $entry['date']] = (float) $entry['total'];
        }

        $observed = $observedDays !== null ? array_flip($observedDays) : null;

        $start  = new DateTime("{$year}-01-01");
        $endOfYear = new DateTime("{$year}-12-31");
        $today  = new DateTime('today');
        $end    = $endOfYear < $today ? $endOfYear : $today;

        // DatePeriod end is exclusive, so add one day
        $end->modify('+1 day');

        $period  = new DatePeriod($start, new DateInterval('P1D'), $end);
        $calendar = [];

        foreach ($period as $day) {
            $dateStr = $day->format('Y-m-d');

            if ($observed !== null && !isset($observed[$dateStr]) && !isset($lookup[$dateStr])) {
                continue;
            }

            $calendar[] = [
                'date'  => $dateStr,
                'total' => $lookup[$dateStr] ?? 0.0,
            ];
        }

        return $calendar;
    }

    /**
     * Iterates over sorted daily entries and computes the longest consecutive
     * wet streak (total > RAIN_THRESHOLD_MM) and the longest consecutive dry streak.
     * A gap in the dates (an unobserved day) ends both streaks.
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
        $prevDate    = null;

        foreach ($days as $entry) {
            $total = (float) $entry['total'];
            $date  = (string) $entry['date'];
            $isWet = $total > self::RAIN_THRESHOLD_MM;

            if ($prevDate !== null && (new DateTime($prevDate))->modify('+1 day')->format('Y-m-d') !== $date) {
                $curWetCount = 0;
                $curWetStart = '';
                $curDryCount = 0;
                $curDryStart = '';
            }

            $prevDate = $date;

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
