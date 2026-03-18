<?php

use App\Models\PrecipitationModel;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Models\PrecipitationModel.
 *
 * All test cases exercise getStats() — which is purely PHP logic that accepts
 * a pre-built $dailyTotals array — so no database connection is required.
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
     * Expected: longestWetStreak = 3 days (Jan 1–3), longestDryStreak = 7 days (Jan 4–10).
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

        $dry = $stats['longestDryStreak'];
        $this->assertSame(7, $dry['days']);
        $this->assertSame('2024-01-04', $dry['start']);
        $this->assertSame('2024-01-10', $dry['end']);
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
        $this->assertSame(2, $stats['dryDays']);
    }

    // -------------------------------------------------------------------------
    // 4. Monthly totals — sum matches daily sum
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
    // 5. All dry year
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
    // 6. Empty input
    // -------------------------------------------------------------------------

    /**
     * getStats() with an empty $dailyTotals array must return safe zero-value defaults.
     */
    public function testEmptyDailyTotalsReturnsZeroDefaults(): void
    {
        $stats = $this->model->getStats(2024, []);

        $this->assertSame(0.0, $stats['totalYear']);
        $this->assertSame(0, $stats['rainyDays']);
        $this->assertSame(0, $stats['dryDays']);
        $this->assertSame(0.0, $stats['maxDailyTotal']['value']);
        $this->assertSame('', $stats['maxDailyTotal']['date']);
        $this->assertSame(0, $stats['longestWetStreak']['days']);
        $this->assertSame(0, $stats['longestDryStreak']['days']);
    }

    // -------------------------------------------------------------------------
    // 7. maxDailyTotal picks the highest value day
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
