<?php

use App\Models\PrecipitationModel;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Models\PrecipitationModel.
 *
 * All test cases exercise getStats() — which is purely PHP logic that accepts
 * a pre-built $dailyTotals array — so no database connection is required.
 *
 * Note: getDailyTotals() sources data from raw_weather_data (not daily_averages),
 * matching the heatmap's calculation approach for accurate accumulated rainfall.
 * That method is tested at the database layer; these tests cover only the
 * pure-PHP statistical logic in getStats().
 *
 * @internal
 */
final class PrecipitationModelTest extends CIUnitTestCase
{
    private PrecipitationModel $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->model = new PrecipitationModel();
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    /**
     * Generates an array of daily entries for a consecutive date range.
     *
     * @param string $startDate 'YYYY-MM-DD'
     * @param int    $days      Number of days
     * @param float  $total     Precipitation total assigned to every day
     * @return array
     */
    private function _makeDays(string $startDate, int $days, float $total): array
    {
        $result = [];
        $ts     = strtotime($startDate);

        for ($i = 0; $i < $days; $i++) {
            $result[] = [
                'date'  => date('Y-m-d', $ts + $i * 86400),
                'total' => $total,
            ];
        }

        return $result;
    }

    // -------------------------------------------------------------------------
    // 1. Streak detection — simple wet then dry
    // -------------------------------------------------------------------------

    /**
     * Jan 1–3 wet (1.5 mm each), Jan 4–10 dry (0 mm), Jan 11–12 wet (2 mm each).
     *
     * _buildFullCalendar() fills all 366 days of 2024 (leap year). Days Jan 13–Dec 31
     * (354 days) are filled with 0.0, so the longest dry streak is Jan 13 – Dec 31
     * (354 days), not the 7-day Jan 4–10 window that the sparse input alone would imply.
     *
     * Expected: longestWetStreak = 3 days (Jan 1–3), longestDryStreak = 354 days (Jan 13–Dec 31).
     */
    public function testStreakDetectionSimpleWetThenDry(): void
    {
        $days = array_merge(
            $this->_makeDays('2024-01-01', 3, 1.5),  // wet
            $this->_makeDays('2024-01-04', 7, 0.0),  // dry
            $this->_makeDays('2024-01-11', 2, 2.0)   // wet
        );

        $stats = $this->model->getStats(2024, $days);

        $wet = $stats['longestWetStreak'];
        $this->assertSame(3, $wet['days']);
        $this->assertSame('2024-01-01', $wet['start']);
        $this->assertSame('2024-01-03', $wet['end']);

        // Jan 13 – Dec 31 2024 = 354 days of 0.0 mm (calendar fill) — longer than Jan 4–10
        $dry = $stats['longestDryStreak'];
        $this->assertSame(354, $dry['days']);
        $this->assertSame('2024-01-13', $dry['start']);
        $this->assertSame('2024-12-31', $dry['end']);
    }

    // -------------------------------------------------------------------------
    // 2. Streak spanning month boundary
    // -------------------------------------------------------------------------

    /**
     * Jan 30–31 wet, Feb 1–3 wet (5 consecutive wet days), then dry.
     * Expected: longestWetStreak = 5 days (Jan 30 – Feb 3).
     */
    public function testStreakSpanningMonthBoundary(): void
    {
        $days = array_merge(
            $this->_makeDays('2024-01-30', 2, 3.0),  // Jan 30–31 wet
            $this->_makeDays('2024-02-01', 3, 1.0),  // Feb 1–3 wet
            $this->_makeDays('2024-02-04', 5, 0.0)   // dry
        );

        $stats = $this->model->getStats(2024, $days);

        $wet = $stats['longestWetStreak'];
        $this->assertSame(5, $wet['days']);
        $this->assertSame('2024-01-30', $wet['start']);
        $this->assertSame('2024-02-03', $wet['end']);
    }

    // -------------------------------------------------------------------------
    // 3. Rainy day threshold — exactly 0.1 mm
    // -------------------------------------------------------------------------

    /**
     * A day with total = 0.1 is NOT rainy (threshold is strictly > 0.1).
     * A day with total = 0.11 IS rainy.
     *
     * _buildFullCalendar() fills all 366 days of 2024 (leap year). The 3 explicit
     * days are included; the remaining 363 days are filled with 0.0 and counted as
     * dry. Total: 1 rainy day, 365 dry days (2 explicit non-rainy + 363 filled).
     */
    public function testRainyDayThreshold(): void
    {
        $days = [
            ['date' => '2024-06-01', 'total' => 0.1],   // NOT rainy
            ['date' => '2024-06-02', 'total' => 0.11],  // rainy
            ['date' => '2024-06-03', 'total' => 0.0],   // NOT rainy
        ];

        $stats = $this->model->getStats(2024, $days);

        $this->assertSame(1, $stats['rainyDays']);
        // 366 days total (2024 leap year) minus 1 rainy day = 365 dry days
        $this->assertSame(365, $stats['dryDays']);
    }

    // -------------------------------------------------------------------------
    // 4. Trace amount (0.1 mm) breaks a dry streak
    // -------------------------------------------------------------------------

    /**
     * Jan 1–5 dry (0.0 mm), Jan 6 trace (0.1 mm), Jan 7–10 dry (0.0 mm).
     *
     * The 0.1 mm on Jan 6 must break the dry streak even though it is not
     * counted as a "rainy day" in the rainyDays counter (threshold > 0.1).
     *
     * _buildFullCalendar() fills all 366 days of 2024 (leap year). Days Jan 11–Dec 31
     * (356 days) are filled with 0.0, extending the post-trace dry run from 4 (Jan 7–10)
     * to 360 consecutive dry days (Jan 7 – Dec 31). That run is longer than Jan 1–5 (5 days).
     * Expected: longestDryStreak = 360 days (Jan 7 – Dec 31 2024).
     */
    public function testTraceAmountBreaksDryStreak(): void
    {
        $days = array_merge(
            $this->_makeDays('2024-01-01', 5, 0.0),  // dry: Jan 1–5
            $this->_makeDays('2024-01-06', 1, 0.1),  // trace: Jan 6
            $this->_makeDays('2024-01-07', 4, 0.0)   // dry: Jan 7–10
        );

        $stats = $this->model->getStats(2024, $days);

        // The trace on Jan 6 breaks the Jan 1–5 dry streak (correct behaviour).
        // After calendar fill, the post-trace dry run (Jan 7 – Dec 31) is the longest.
        $dry = $stats['longestDryStreak'];
        $this->assertSame(360, $dry['days'], 'Trace amount (0.1 mm) must break the dry streak');
        $this->assertSame('2024-01-07', $dry['start']);
        $this->assertSame('2024-12-31', $dry['end']);
    }

    // -------------------------------------------------------------------------
    // 5. Monthly totals — sum matches daily sum
    // -------------------------------------------------------------------------

    /**
     * 28 days of February with known per-day totals.
     * The monthlyTotals entry for month=2 must equal their summed total.
     */
    public function testMonthlyTotalsSumMatchesDailySumForFebruary(): void
    {
        $days      = [];
        $expected  = 0.0;
        $perDay    = 2.5;

        for ($d = 1; $d <= 28; $d++) {
            $days[]   = ['date' => sprintf('2024-02-%02d', $d), 'total' => $perDay];
            $expected += $perDay;
        }

        $stats = $this->model->getStats(2024, $days);

        $febEntry = null;

        foreach ($stats['monthlyTotals'] as $entry) {
            if ($entry['month'] === 2) {
                $febEntry = $entry;
                break;
            }
        }

        $this->assertNotNull($febEntry, 'monthlyTotals must contain an entry for month 2');
        $this->assertSame(round($expected, 1), $febEntry['total']);
    }

    /**
     * monthlyTotals must always contain exactly 12 entries (one per month).
     */
    public function testMonthlyTotalsAlwaysHas12Entries(): void
    {
        $stats = $this->model->getStats(2024, []);
        $this->assertCount(12, $stats['monthlyTotals']);

        $months = array_column($stats['monthlyTotals'], 'month');
        $this->assertSame(range(1, 12), $months);
    }

    // -------------------------------------------------------------------------
    // 6. All dry year
    // -------------------------------------------------------------------------

    /**
     * 365 days all at 0 mm.
     * Expected: rainyDays = 0, longestWetStreak.days = 0, dryDays = 365.
     */
    public function testAllDryYear(): void
    {
        $days = $this->_makeDays('2023-01-01', 365, 0.0);

        $stats = $this->model->getStats(2023, $days);

        $this->assertSame(0, $stats['rainyDays']);
        $this->assertSame(365, $stats['dryDays']);
        $this->assertSame(0, $stats['longestWetStreak']['days']);
        $this->assertSame('', $stats['longestWetStreak']['start']);
        $this->assertSame('', $stats['longestWetStreak']['end']);

        // Dry streak must span the entire year
        $this->assertSame(365, $stats['longestDryStreak']['days']);
        $this->assertSame('2023-01-01', $stats['longestDryStreak']['start']);
        $this->assertSame('2023-12-31', $stats['longestDryStreak']['end']);
    }

    // -------------------------------------------------------------------------
    // 7. Empty input
    // -------------------------------------------------------------------------

    /**
     * getStats() with an empty $dailyTotals array for a fully-elapsed year (2024).
     *
     * _buildFullCalendar() fills all 366 days of 2024 (leap year) with 0.0 mm.
     * Therefore: totalYear = 0.0, rainyDays = 0, dryDays = 366, no max date,
     * longestWetStreak.days = 0, longestDryStreak.days = 366 (entire year).
     */
    public function testEmptyDailyTotalsReturnsZeroDefaults(): void
    {
        $stats = $this->model->getStats(2024, []);

        $this->assertSame(0.0, $stats['totalYear']);
        $this->assertSame(0, $stats['rainyDays']);
        // All 366 days of 2024 are filled with 0.0 mm by _buildFullCalendar()
        $this->assertSame(366, $stats['dryDays']);
        $this->assertSame(0.0, $stats['maxDailyTotal']['value']);
        $this->assertSame('', $stats['maxDailyTotal']['date']);
        $this->assertSame(0, $stats['longestWetStreak']['days']);
        // Dry streak spans all 366 days
        $this->assertSame(366, $stats['longestDryStreak']['days']);
    }

    // -------------------------------------------------------------------------
    // 8. maxDailyTotal picks the highest value day
    // -------------------------------------------------------------------------

    public function testMaxDailyTotalIdentifiesCorrectDay(): void
    {
        $days = [
            ['date' => '2024-03-01', 'total' => 5.0],
            ['date' => '2024-03-02', 'total' => 12.3],
            ['date' => '2024-03-03', 'total' => 7.8],
        ];

        $stats = $this->model->getStats(2024, $days);

        $this->assertSame(12.3, $stats['maxDailyTotal']['value']);
        $this->assertSame('2024-03-02', $stats['maxDailyTotal']['date']);
    }
}
