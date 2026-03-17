<?php

use App\Libraries\SnowpackCalculator;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Libraries\SnowpackCalculator.
 *
 * Tests cover SWE accumulation, melt, rain-on-snow acceleration, the SWE
 * non-negativity invariant, rain-on-snow day counting, and season range logic.
 *
 * @internal
 */
final class SnowpackCalculatorTest extends CIUnitTestCase
{
    private SnowpackCalculator $calc;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calc = new SnowpackCalculator();
    }

    // -------------------------------------------------------------------------
    // SWE Accumulation
    // -------------------------------------------------------------------------

    /**
     * A cold day (-5°C) with 10mm precipitation must add exactly 10mm to SWE
     * (all precipitation treated as snow below T_SNOW = -1°C).
     */
    public function testSnowAccumulationBelowTSnow(): void
    {
        $rows = [
            ['date' => '2025-11-01', 'temperature' => -5.0, 'precipitation' => 10.0],
        ];

        $series = $this->calc->computeSWESeries($rows);

        $this->assertCount(1, $series);
        $this->assertEqualsWithDelta(10.0, $series[0]['swe'], 0.001);
    }

    /**
     * A day at exactly 0°C with 10mm precipitation must add exactly 5mm to SWE
     * (mixed phase: 0°C is between T_SNOW and T_RAIN so half contributes).
     */
    public function testMixedPhaseHalfContribution(): void
    {
        $rows = [
            ['date' => '2025-11-01', 'temperature' => 0.0, 'precipitation' => 10.0],
        ];

        $series = $this->calc->computeSWESeries($rows);

        // 0°C is >= T_SNOW (-1) and < T_RAIN (2), so accumulation = 10 * 0.5 = 5mm
        // 0°C is NOT > T_MELT (0.0) so no melt
        $this->assertEqualsWithDelta(5.0, $series[0]['swe'], 0.001);
    }

    /**
     * A warm day (+5°C) with 10mm precipitation must add 0mm to SWE
     * (above T_RAIN = 2°C, all precipitation is rain — no accumulation).
     */
    public function testNoAccumulationAboveTRain(): void
    {
        $rows = [
            ['date' => '2025-11-01', 'temperature' => 5.0, 'precipitation' => 10.0],
        ];

        $series = $this->calc->computeSWESeries($rows);

        // No accumulation because temp > T_RAIN; no melt because SWE starts at 0
        $this->assertEqualsWithDelta(0.0, $series[0]['swe'], 0.001);
    }

    // -------------------------------------------------------------------------
    // SWE Melt
    // -------------------------------------------------------------------------

    /**
     * A +4°C day on a 50mm SWE pack must reduce SWE by DDF * 4 = 3.5 * 4 = 14mm.
     * No rain so no rain-on-snow bonus melt.
     */
    public function testMeltReducesSWE(): void
    {
        $rows = [
            // Build up 50mm first (all snow)
            ['date' => '2025-11-01', 'temperature' => -5.0, 'precipitation' => 50.0],
            // +4°C melt day, no precipitation
            ['date' => '2025-11-02', 'temperature' =>  4.0, 'precipitation' =>  0.0],
        ];

        $series = $this->calc->computeSWESeries($rows);

        $this->assertCount(2, $series);
        $this->assertEqualsWithDelta(50.0, $series[0]['swe'], 0.001);
        $this->assertEqualsWithDelta(36.0, $series[1]['swe'], 0.001); // 50 - 14 = 36
    }

    /**
     * When melt exceeds the available SWE, the pack must clamp to 0, not go negative.
     * 5mm SWE at +10°C: melt = 3.5 * 10 = 35mm — vastly more than 5mm available.
     */
    public function testSWENeverGoesNegative(): void
    {
        $rows = [
            // Build 5mm pack
            ['date' => '2025-11-01', 'temperature' => -5.0, 'precipitation' =>  5.0],
            // Extreme melt: +10°C
            ['date' => '2025-11-02', 'temperature' => 10.0, 'precipitation' =>  0.0],
        ];

        $series = $this->calc->computeSWESeries($rows);

        $this->assertGreaterThanOrEqual(0.0, $series[1]['swe']);
        $this->assertEqualsWithDelta(0.0, $series[1]['swe'], 0.001);
    }

    // -------------------------------------------------------------------------
    // Rain-on-Snow
    // -------------------------------------------------------------------------

    /**
     * +3°C day with 5mm rain on a 50mm SWE pack:
     *   - DDF melt           = 3.5 * 3 = 10.5mm
     *   - rain-on-snow bonus = 5 * 0.8 = 4.0mm
     *   - total melt         = 14.5mm
     * Expected SWE after the melt day: 50 - 14.5 = 35.5mm
     */
    public function testRainOnSnowAcceleratesMelt(): void
    {
        $rows = [
            // Build 50mm SWE pack
            ['date' => '2025-11-01', 'temperature' => -5.0, 'precipitation' => 50.0],
            // Rain-on-snow event: +3°C, 5mm rain
            ['date' => '2025-11-02', 'temperature' =>  3.0, 'precipitation' =>  5.0],
        ];

        $series = $this->calc->computeSWESeries($rows);

        $this->assertCount(2, $series);
        $this->assertEqualsWithDelta(50.0, $series[0]['swe'], 0.001);
        // 3°C > T_RAIN (2°C) so no accumulation from rain; melt = 10.5 + 4.0 = 14.5
        $this->assertEqualsWithDelta(35.5, $series[1]['swe'], 0.001);
    }

    // -------------------------------------------------------------------------
    // countRainOnSnowDays
    // -------------------------------------------------------------------------

    /**
     * Known sequence of daily rows must produce the expected rain-on-snow count.
     *
     * Day 1: -5°C, 20mm snow → SWE = 20mm (snow accumulation)
     * Day 2: +1°C,  2mm rain → SWE > 0, temp > T_MELT, precip > 1 → rain-on-snow
     * Day 3: +1°C,  2mm rain → SWE still > 0 → rain-on-snow
     * Day 4: +5°C,  0mm      → pure melt, no rain-on-snow
     * Day 5: +1°C, 0.5mm     → precip ≤ 1, not a rain-on-snow event
     * Expected count: 2
     */
    public function testCountRainOnSnowDays(): void
    {
        $rows = [
            ['date' => '2026-03-01', 'temperature' => -5.0, 'precipitation' => 20.0],
            ['date' => '2026-03-02', 'temperature' =>  1.0, 'precipitation' =>  2.0],
            ['date' => '2026-03-03', 'temperature' =>  1.0, 'precipitation' =>  2.0],
            ['date' => '2026-03-04', 'temperature' =>  5.0, 'precipitation' =>  0.0],
            ['date' => '2026-03-05', 'temperature' =>  1.0, 'precipitation' =>  0.5],
        ];

        $sweSeries = $this->calc->computeSWESeries($rows);
        $count     = $this->calc->countRainOnSnowDays($rows, $sweSeries, 21);

        $this->assertSame(2, $count);
    }

    // -------------------------------------------------------------------------
    // getSeasonRange
    // -------------------------------------------------------------------------

    /**
     * A date in the middle of the active snow season (2026-03-15) must map to
     * the season starting Oct 1, 2025 and ending May 31, 2026.
     */
    public function testSeasonRangeActiveMonth(): void
    {
        $date              = new \DateTime('2026-03-15');
        [$start, $end]     = $this->calc->getSeasonRange($date);

        $this->assertSame('2025-10-01', $start);
        $this->assertSame('2026-05-31', $end);
    }

    /**
     * A date in the off-season (2026-07-15, between Jun 1 and Sep 30) must return
     * the UPCOMING season: Oct 1, 2026 – May 31, 2027.
     */
    public function testSeasonRangeOffseason(): void
    {
        $date          = new \DateTime('2026-07-15');
        [$start, $end] = $this->calc->getSeasonRange($date);

        $this->assertSame('2026-10-01', $start);
        $this->assertSame('2027-05-31', $end);
    }
}
