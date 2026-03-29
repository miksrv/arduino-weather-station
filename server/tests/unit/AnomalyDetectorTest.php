<?php

use App\Libraries\AnomalyDetector;
use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Libraries\AnomalyDetector.
 *
 * Uses PHPUnit mocks for DailyAveragesModel and HourlyAveragesModel to inject
 * controlled historical data without requiring a live database connection.
 *
 * Because CI4 models expose query builder methods via __call magic, mocks are
 * built with getMockBuilder()->disableOriginalConstructor()->getMock() and only
 * the real public methods (findAll, first) are stubbed with willReturn.
 * The fluent __call chain is handled by returning $this from __call.
 *
 * @internal
 */
final class AnomalyDetectorTest extends CIUnitTestCase
{
    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Returns a DailyAveragesModel stub whose __call chain returns itself and
     * whose findAll/first return the provided rows.
     *
     * @param array $rows Rows to return from findAll()
     */
    private function _stubDaily(array $rows): DailyAveragesModel
    {
        $stub = $this->getMockBuilder(DailyAveragesModel::class)
            ->disableOriginalConstructor()
            ->getMock();

        $stub->method('__call')->willReturnCallback(fn() => $stub);
        $stub->method('findAll')->willReturn($rows);
        $stub->method('first')->willReturn($rows[0] ?? null);

        return $stub;
    }

    /**
     * Builds a minimal no-op AnomalyDetector (for tests that don't need DB).
     */
    private function _makeDetector(): AnomalyDetector
    {
        $daily  = $this->_stubDaily([]);
        $hourly = $this->createMock(HourlyAveragesModel::class);
        $hourly->method('__call')->willReturnSelf();

        return new AnomalyDetector($daily, $hourly);
    }

    /**
     * Builds a DailyAveragesModel stub returning rows formatted so that
     * AnomalyDetector::computeZScore maps them through $row['val'].
     *
     * computeZScore selects 'val' alias and accesses $r['val'].
     */
    private function _stubDailyForZScore(array $values): DailyAveragesModel
    {
        $rows = array_map(fn($v) => ['md' => '03-15', 'val' => $v], $values);

        $stub = $this->getMockBuilder(DailyAveragesModel::class)
            ->disableOriginalConstructor()
            ->getMock();

        $stub->method('__call')->willReturnCallback(fn() => $stub);
        $stub->method('findAll')->willReturn($rows);
        $stub->method('first')->willReturn(null);

        return $stub;
    }

    // -------------------------------------------------------------------------
    // computeZScore
    // -------------------------------------------------------------------------

    /**
     * When the current value equals the historical mean, Z-score must be 0.0.
     * Uses 20 rows all with value 10.0, then queries with currentValue = 10.0.
     */
    public function testZScoreZeroAtMean(): void
    {
        $values   = array_fill(0, 20, 10.0);
        $stub     = $this->_stubDailyForZScore($values);
        $hourly   = $this->createMock(HourlyAveragesModel::class);
        $hourly->method('__call')->willReturnSelf();
        $detector = new AnomalyDetector($stub, $hourly);

        $z = $detector->computeZScore('temperature', new \DateTime('2025-03-15'), 10.0);

        $this->assertNotNull($z);
        $this->assertEqualsWithDelta(0.0, $z, 0.001);
    }

    /**
     * When the current value is exactly 2 standard deviations above the historical
     * mean, Z-score must be approximately 2.0.
     * 20 rows: 10 × 8.0, 10 × 12.0 → mean = 10.0, std = 2.0
     * currentValue = 14.0 → Z = (14 - 10) / 2 = 2.0
     */
    public function testZScorePositiveAboveMean(): void
    {
        $values   = array_merge(array_fill(0, 10, 8.0), array_fill(0, 10, 12.0));
        $stub     = $this->_stubDailyForZScore($values);
        $hourly   = $this->createMock(HourlyAveragesModel::class);
        $hourly->method('__call')->willReturnSelf();
        $detector = new AnomalyDetector($stub, $hourly);

        // Z = (14 - 10) / 2 = 2.0
        $z = $detector->computeZScore('temperature', new \DateTime('2025-03-15'), 14.0);

        $this->assertNotNull($z);
        $this->assertEqualsWithDelta(2.0, $z, 0.01);
    }

    /**
     * With fewer than 10 historical data points, computeZScore must return null.
     */
    public function testZScoreNullInsufficientData(): void
    {
        $values   = array_fill(0, 9, 10.0); // only 9 — below the 10-point minimum
        $stub     = $this->_stubDailyForZScore($values);
        $hourly   = $this->createMock(HourlyAveragesModel::class);
        $hourly->method('__call')->willReturnSelf();
        $detector = new AnomalyDetector($stub, $hourly);

        $z = $detector->computeZScore('temperature', new \DateTime('2025-03-15'), 10.0);

        $this->assertNull($z);
    }

    // -------------------------------------------------------------------------
    // checkPressureCollapse
    // -------------------------------------------------------------------------

    /**
     * Three hourly rows spanning exactly 5 hPa drop (oldest=1010, newest=1005)
     * must trigger the pressure collapse alert (true).
     * Rows are sorted DESC (newest first).
     */
    public function testPressureCollapseTriggersAt5hPa(): void
    {
        $hourlyRows = [
            ['pressure' => 1005.0],   // newest (index 0 = DESC)
            ['pressure' => 1007.5],
            ['pressure' => 1010.0],   // oldest
        ];

        $detector = $this->_makeDetector();
        $this->assertTrue($detector->checkPressureCollapse($hourlyRows));
    }

    /**
     * A drop of only 4.9 hPa (oldest=1010.0, newest=1005.1) must NOT trigger.
     */
    public function testPressureCollapseNoTriggerBelow5hPa(): void
    {
        $hourlyRows = [
            ['pressure' => 1005.1],
            ['pressure' => 1007.5],
            ['pressure' => 1010.0],
        ];

        $detector = $this->_makeDetector();
        $this->assertFalse($detector->checkPressureCollapse($hourlyRows));
    }

    // -------------------------------------------------------------------------
    // checkFreezingRain
    // -------------------------------------------------------------------------

    /**
     * ANY hourly row with temp +1.5°C (upper boundary, inclusive) and precip > 0 → true.
     * An array where ALL rows have temp +1.6°C (above +1.5 boundary) → false.
     */
    public function testFreezingRainAtBoundaryTemp(): void
    {
        $detector = $this->_makeDetector();

        $trueRows  = [['temperature' =>  1.5, 'precipitation' => 0.5]];
        $falseRows = [['temperature' =>  1.6, 'precipitation' => 0.5]];

        $this->assertTrue($detector->checkFreezingRain($trueRows));
        $this->assertFalse($detector->checkFreezingRain($falseRows));
    }

    // -------------------------------------------------------------------------
    // checkFogRisk
    // -------------------------------------------------------------------------

    /**
     * ANY hourly row with spread exactly 2.5°C (temp - dew_point), wind < 2.0, clouds < 40 → true.
     */
    public function testFogRiskSpreadExactly2(): void
    {
        $detector = $this->_makeDetector();
        $rows     = [['temperature' => 10.0, 'dew_point' => 7.5, 'wind_speed' => 1.5, 'clouds' => 35.0]];

        $this->assertTrue($detector->checkFogRisk($rows));
    }

    /**
     * Spread of 2.6°C → false (just above the <= 2.5 threshold).
     */
    public function testFogRiskNoTriggerWideSpread(): void
    {
        $detector = $this->_makeDetector();
        $rows     = [['temperature' => 10.0, 'dew_point' => 7.4, 'wind_speed' => 1.5, 'clouds' => 35.0]];

        $this->assertFalse($detector->checkFogRisk($rows));
    }

    // -------------------------------------------------------------------------
    // computeSPI
    // -------------------------------------------------------------------------

    /**
     * When accumulated precipitation is significantly lower than the historical
     * mean, SPI must be negative (drought signal).
     *
     * The stub returns [['precipitation' => 0.5]] for all findAll() calls.
     * The first call is the current period (sum = 0.5 mm).
     * Subsequent calls (26 iterations for years 2024..1999) also return 0.5mm rows,
     * but we control the pattern so that historical sums around 50mm are produced
     * by returning 100 rows of 0.5mm each for historical calls.
     *
     * Simpler approach: build a stub that returns current=0.5 on first call, then
     * returns 100 rows of 0.5mm each (sum=50mm) for subsequent historical calls.
     */
    public function testSPINegativeUnderDrought(): void
    {
        $stub = $this->getMockBuilder(DailyAveragesModel::class)
            ->disableOriginalConstructor()
            ->getMock();

        $stub->method('__call')->willReturnCallback(fn() => $stub);

        // Build 100 rows of 0.5mm = 50mm historical sum
        $historicalRows = array_fill(0, 100, ['precipitation' => 0.5]);

        // Historical returns vary: alternating 40mm and 60mm sums so std > 0
        $callCount = 0;
        $stub->method('findAll')->willReturnCallback(function () use (&$callCount) {
            $callCount++;
            if ($callCount === 1) {
                // Current period: only 1 row with 0.1mm = drought
                return [['precipitation' => 0.1]];
            }
            // Alternate between 80 × 0.5mm (= 40mm) and 120 × 0.5mm (= 60mm)
            $size = ($callCount % 2 === 0) ? 80 : 120;
            return array_fill(0, $size, ['precipitation' => 0.5]);
        });

        $stub->method('first')->willReturn(null);

        $hourly   = $this->createMock(HourlyAveragesModel::class);
        $hourly->method('__call')->willReturnSelf();
        $detector = new AnomalyDetector($stub, $hourly);

        $spi = $detector->computeSPI('2025-08-01', 30);

        $this->assertNotNull($spi);
        $this->assertLessThan(0.0, $spi);
    }

    /**
     * When fewer than 3 historical years of data exist, computeSPI must return null.
     *
     * The stub returns rows for exactly 2 historical year calls, then empty arrays.
     * The SPI loop starts from endYear-1 and goes down to 2000. We need only 2 years
     * with data and all the rest empty, so that count($historicalSums) = 2 < 3.
     */
    public function testSPINullInsufficientHistory(): void
    {
        $stub = $this->getMockBuilder(DailyAveragesModel::class)
            ->disableOriginalConstructor()
            ->getMock();

        $stub->method('__call')->willReturnCallback(fn() => $stub);

        $callCount = 0;
        $stub->method('findAll')->willReturnCallback(function () use (&$callCount) {
            $callCount++;
            if ($callCount === 1) {
                // Current period
                return [['precipitation' => 10.0]];
            }
            if ($callCount === 2 || $callCount === 3) {
                // First 2 historical years: return rows summing to ~50mm
                return array_fill(0, 100, ['precipitation' => 0.5]);
            }
            // All subsequent years: empty — no data
            return [];
        });

        $stub->method('first')->willReturn(null);

        $hourly   = $this->createMock(HourlyAveragesModel::class);
        $hourly->method('__call')->willReturnSelf();
        $detector = new AnomalyDetector($stub, $hourly);

        $spi = $detector->computeSPI('2024-03-01', 30);

        $this->assertNull($spi);
    }

    // -------------------------------------------------------------------------
    // checkStrongWind
    // -------------------------------------------------------------------------

    /**
     * wind_speed = 12.0 m/s (at the 12.0 threshold, not strictly above) must NOT trigger.
     * wind_speed = 12.1 m/s (strictly above 12.0) must trigger.
     */
    public function testStrongWindNoTriggerBelowThreshold(): void
    {
        $detector = $this->_makeDetector();

        $this->assertFalse($detector->checkStrongWind([['wind_speed' => 12.0]]));
        $this->assertTrue($detector->checkStrongWind([['wind_speed' => 12.1]]));
    }

    // -------------------------------------------------------------------------
    // checkLateFrost
    // -------------------------------------------------------------------------

    /**
     * After 5 consecutive days all above +5°C (spring onset), a -3°C day triggers.
     */
    public function testLateFrostTriggersAfterSpringOnset(): void
    {
        $rows = [
            ['date' => '2026-04-01', 'temperature' =>  6.0],
            ['date' => '2026-04-02', 'temperature' =>  7.0],
            ['date' => '2026-04-03', 'temperature' =>  8.0],
            ['date' => '2026-04-04', 'temperature' =>  9.0],
            ['date' => '2026-04-05', 'temperature' => 10.0],
            ['date' => '2026-04-06', 'temperature' => -3.0],  // today
        ];

        $detector = $this->_makeDetector();
        $this->assertTrue($detector->checkLateFrost($rows));
    }

    /**
     * A sub-zero day without a preceding warm stretch of 5+ days does NOT trigger.
     */
    public function testLateFrostNoTriggerWithoutSpringOnset(): void
    {
        $rows = [
            ['date' => '2026-01-01', 'temperature' => -5.0],
            ['date' => '2026-01-02', 'temperature' => -3.0],
            ['date' => '2026-01-03', 'temperature' => -4.0],
            ['date' => '2026-01-04', 'temperature' => -6.0],
            ['date' => '2026-01-05', 'temperature' => -8.0],
            ['date' => '2026-01-06', 'temperature' => -3.0],  // today, still cold
        ];

        $detector = $this->_makeDetector();
        $this->assertFalse($detector->checkLateFrost($rows));
    }

    // -------------------------------------------------------------------------
    // checkHeatStress
    // -------------------------------------------------------------------------

    /**
     * ANY hourly row with temp = 35°C, humidity = 70% must produce a Steadman heat index above 36°C.
     * At these values the Steadman formula yields approximately 40–42°C.
     * An array of rows all below the pre-check threshold (T < 25°C) must NOT trigger.
     */
    public function testHeatStressTriggersAbove38C(): void
    {
        $detector = $this->_makeDetector();

        $triggerRows  = [['temperature' => 35.0, 'humidity' => 70.0]];
        $noTriggerRows = [['temperature' => 24.9, 'humidity' => 80.0]];

        $this->assertTrue($detector->checkHeatStress($triggerRows));
        $this->assertFalse($detector->checkHeatStress($noTriggerRows));
    }

    // -------------------------------------------------------------------------
    // Private helper: _computePressureDrop
    // -------------------------------------------------------------------------

    /**
     * With 3 rows (oldest=1010, newest=1005) the drop must be 5.0 hPa.
     */
    public function testComputePressureDropThreeRows(): void
    {
        $detector = $this->_makeDetector();
        $rows = [
            ['pressure' => 1005.0],  // newest (index 0, DESC)
            ['pressure' => 1007.5],
            ['pressure' => 1010.0],  // oldest
        ];

        $ref = new \ReflectionMethod($detector, '_computePressureDrop');
        $ref->setAccessible(true);

        $this->assertEqualsWithDelta(5.0, $ref->invoke($detector, $rows), 0.001);
    }

    /**
     * With fewer than 2 rows the method must return 0.0.
     */
    public function testComputePressureDropFewerThanTwoRows(): void
    {
        $detector = $this->_makeDetector();

        $ref = new \ReflectionMethod($detector, '_computePressureDrop');
        $ref->setAccessible(true);

        $this->assertSame(0.0, $ref->invoke($detector, []));
        $this->assertSame(0.0, $ref->invoke($detector, [['pressure' => 1010.0]]));
    }

    // -------------------------------------------------------------------------
    // Private helper: _getMinFreezingRainTemp
    // -------------------------------------------------------------------------

    /**
     * When qualifying rows exist (precip > 0, temp in [-5, +1.5]), returns the minimum temp.
     */
    public function testGetMinFreezingRainTempReturnsMinQualifyingTemp(): void
    {
        $detector = $this->_makeDetector();
        $rows = [
            ['temperature' =>  0.5, 'precipitation' => 1.0],
            ['temperature' => -1.0, 'precipitation' => 0.5],  // coldest qualifying
            ['temperature' =>  2.0, 'precipitation' => 0.5],  // outside range
        ];

        $ref = new \ReflectionMethod($detector, '_getMinFreezingRainTemp');
        $ref->setAccessible(true);

        $this->assertEqualsWithDelta(-1.0, $ref->invoke($detector, $rows), 0.01);
    }

    /**
     * When no rows qualify (no precip or temp out of range), must return null.
     */
    public function testGetMinFreezingRainTempReturnsNullWhenNoQualifyingRows(): void
    {
        $detector = $this->_makeDetector();
        $rows = [
            ['temperature' => 5.0, 'precipitation' => 1.0],   // too warm
            ['temperature' => 0.5, 'precipitation' => 0.0],   // no precip
        ];

        $ref = new \ReflectionMethod($detector, '_getMinFreezingRainTemp');
        $ref->setAccessible(true);

        $this->assertNull($ref->invoke($detector, $rows));
    }

    // -------------------------------------------------------------------------
    // Private helper: _getMinDewSpread
    // -------------------------------------------------------------------------

    /**
     * Returns the minimum (temperature - dew_point) spread across all rows.
     */
    public function testGetMinDewSpreadReturnsMinimum(): void
    {
        $detector = $this->_makeDetector();
        $rows = [
            ['temperature' => 10.0, 'dew_point' => 7.5],   // spread = 2.5
            ['temperature' => 15.0, 'dew_point' => 14.0],  // spread = 1.0 — minimum
            ['temperature' => 20.0, 'dew_point' => 16.0],  // spread = 4.0
        ];

        $ref = new \ReflectionMethod($detector, '_getMinDewSpread');
        $ref->setAccessible(true);

        $this->assertEqualsWithDelta(1.0, $ref->invoke($detector, $rows), 0.01);
    }

    /**
     * When no rows have both temperature and dew_point, must return null.
     */
    public function testGetMinDewSpreadReturnsNullWhenNoValidRows(): void
    {
        $detector = $this->_makeDetector();
        $rows = [
            ['temperature' => 10.0],   // missing dew_point
            ['dew_point'   =>  8.0],   // missing temperature
        ];

        $ref = new \ReflectionMethod($detector, '_getMinDewSpread');
        $ref->setAccessible(true);

        $this->assertNull($ref->invoke($detector, $rows));
    }

    // -------------------------------------------------------------------------
    // Private helper: _getMaxWindSpeed
    // -------------------------------------------------------------------------

    /**
     * Returns the maximum wind_speed across all rows, rounded to 1dp.
     */
    public function testGetMaxWindSpeedReturnsMaximum(): void
    {
        $detector = $this->_makeDetector();
        $rows = [
            ['wind_speed' =>  5.3],
            ['wind_speed' => 14.7],  // maximum
            ['wind_speed' =>  9.1],
        ];

        $ref = new \ReflectionMethod($detector, '_getMaxWindSpeed');
        $ref->setAccessible(true);

        $this->assertEqualsWithDelta(14.7, $ref->invoke($detector, $rows), 0.01);
    }

    /**
     * When the array is empty, must return null.
     */
    public function testGetMaxWindSpeedReturnsNullForEmptyArray(): void
    {
        $detector = $this->_makeDetector();

        $ref = new \ReflectionMethod($detector, '_getMaxWindSpeed');
        $ref->setAccessible(true);

        $this->assertNull($ref->invoke($detector, []));
    }

    // -------------------------------------------------------------------------
    // Private helper: _getMaxHeatIndex
    // -------------------------------------------------------------------------

    /**
     * With a row at T=35, RH=70 the computed heat index exceeds 36°C,
     * so the method returns a non-null float greater than 36.
     */
    public function testGetMaxHeatIndexReturnsComputedValue(): void
    {
        $detector = $this->_makeDetector();
        $rows = [
            ['temperature' => 35.0, 'humidity' => 70.0],
        ];

        $ref = new \ReflectionMethod($detector, '_getMaxHeatIndex');
        $ref->setAccessible(true);

        $result = $ref->invoke($detector, $rows);
        $this->assertNotNull($result);
        $this->assertGreaterThan(36.0, $result);
    }

    /**
     * When no rows meet the pre-check (T < 25 or RH < 35), must return null.
     */
    public function testGetMaxHeatIndexReturnsNullWhenNoQualifyingRows(): void
    {
        $detector = $this->_makeDetector();
        $rows = [
            ['temperature' => 24.9, 'humidity' => 80.0],  // T below threshold
            ['temperature' => 30.0, 'humidity' => 34.9],  // RH below threshold
        ];

        $ref = new \ReflectionMethod($detector, '_getMaxHeatIndex');
        $ref->setAccessible(true);

        $this->assertNull($ref->invoke($detector, $rows));
    }
}
