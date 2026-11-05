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
     * Band is -4..+1 °C (inclusive) with at least RAIN_THRESHOLD_MM of precipitation.
     */
    public function testFreezingRainAtBoundaryTemp(): void
    {
        $detector = $this->_makeDetector();

        $this->assertTrue($detector->checkFreezingRain([['temperature' => 1.0, 'precipitation' => 0.5]]));
        $this->assertTrue($detector->checkFreezingRain([['temperature' => -4.0, 'precipitation' => 0.5]]));
        $this->assertFalse($detector->checkFreezingRain([['temperature' => 1.1, 'precipitation' => 0.5]]));
        $this->assertFalse($detector->checkFreezingRain([['temperature' => -4.1, 'precipitation' => 0.5]]));
    }

    /**
     * Trace amounts (below RAIN_THRESHOLD_MM) are no freezing rain.
     */
    public function testFreezingRainIgnoresTraceAmounts(): void
    {
        $detector = $this->_makeDetector();

        $this->assertFalse($detector->checkFreezingRain([['temperature' => -1.0, 'precipitation' => 0.05]]));
        $this->assertFalse($detector->checkFreezingRain([['temperature' => -1.0, 'precipitation' => 0.0]]));
        $this->assertTrue($detector->checkFreezingRain([['temperature' => -1.0, 'precipitation' => 0.1]]));
    }

    /**
     * With a weather code the precipitation must be drizzle/rain (3xx, 5xx incl. 511), not snow.
     */
    public function testFreezingRainRequiresLiquidWeatherCode(): void
    {
        $detector = $this->_makeDetector();
        $row      = ['temperature' => -1.0, 'precipitation' => 1.0];

        $this->assertTrue($detector->checkFreezingRain([$row + ['weather_id' => 511]]));
        $this->assertTrue($detector->checkFreezingRain([$row + ['weather_id' => 500]]));
        $this->assertTrue($detector->checkFreezingRain([$row + ['weather_id' => 301]]));
        $this->assertFalse($detector->checkFreezingRain([$row + ['weather_id' => 600]]));
        $this->assertFalse($detector->checkFreezingRain([$row + ['weather_id' => 616]]));
        $this->assertFalse($detector->checkFreezingRain([$row + ['weather_id' => 804]]));
        $this->assertTrue($detector->checkFreezingRain([$row + ['weather_id' => null]]));
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
     * Builds a daily stub for SPI: findAll() returns $current for the first call and
     * the next entries of $historical for the following ones; first() gives the first
     * data date.
     *
     * @param array  $current    Rows of the current window
     * @param array  $historical Rows per historical window, newest year first
     * @param string $firstDate  Value of MIN(date)
     */
    private function _spiStub(array $current, array $historical, string $firstDate): DailyAveragesModel
    {
        $stub = $this->getMockBuilder(DailyAveragesModel::class)
            ->disableOriginalConstructor()
            ->getMock();

        $stub->method('__call')->willReturnCallback(fn() => $stub);

        $queue = array_merge([$current], $historical);
        $stub->method('findAll')->willReturnCallback(function () use (&$queue) {
            return array_shift($queue) ?? [];
        });
        $stub->method('first')->willReturn(['first_date' => $firstDate]);

        return $stub;
    }

    /**
     * Dry current window against wetter, varying history gives a negative SPI.
     * History starts at the first data year (2021): 2024, 2023, 2022 and 2021 are used.
     */
    public function testSPINegativeUnderDrought(): void
    {
        $stub = $this->_spiStub(
            array_fill(0, 30, ['precipitation' => 0.1]),
            [
                array_fill(0, 30, ['precipitation' => 1.0]),
                array_fill(0, 30, ['precipitation' => 2.0]),
                array_fill(0, 30, ['precipitation' => 1.0]),
                array_fill(0, 30, ['precipitation' => 2.0]),
            ],
            '2021-11-08 00:00:00'
        );

        $hourly = $this->createMock(HourlyAveragesModel::class);
        $hourly->method('__call')->willReturnSelf();

        $spi = (new AnomalyDetector($stub, $hourly))->computeSPI('2025-08-01', 30);

        $this->assertNotNull($spi);
        $this->assertLessThan(0.0, $spi);
    }

    /**
     * A current window with less than 90% of its days present gives no SPI.
     */
    public function testSPINullWhenCurrentWindowIncomplete(): void
    {
        $stub = $this->_spiStub(
            array_fill(0, 26, ['precipitation' => 0.0]),   // 26 < 27 of 30 days
            array_fill(0, 4, array_fill(0, 30, ['precipitation' => 1.0])),
            '2021-01-01 00:00:00'
        );

        $hourly = $this->createMock(HourlyAveragesModel::class);
        $hourly->method('__call')->willReturnSelf();

        $this->assertNull((new AnomalyDetector($stub, $hourly))->computeSPI('2025-08-01', 30));
    }

    /**
     * Historical windows with less than 90% of their days are not part of the baseline:
     * with only 2 complete ones (< 3) no SPI is computed.
     */
    public function testSPINullInsufficientHistory(): void
    {
        $stub = $this->_spiStub(
            array_fill(0, 30, ['precipitation' => 1.0]),
            [
                array_fill(0, 30, ['precipitation' => 1.0]),
                array_fill(0, 30, ['precipitation' => 2.0]),
                array_fill(0, 5, ['precipitation' => 0.5]),    // partial window, skipped
                array_fill(0, 5, ['precipitation' => 0.5]),    // partial window, skipped
            ],
            '2021-11-08 00:00:00'
        );

        $hourly = $this->createMock(HourlyAveragesModel::class);
        $hourly->method('__call')->willReturnSelf();

        $this->assertNull((new AnomalyDetector($stub, $hourly))->computeSPI('2025-08-01', 30));
    }

    /**
     * The baseline starts at the first data year instead of 2000: exactly one
     * window query per year from endYear-1 down to the first year, plus the current one.
     */
    public function testSPIQueriesOnlyYearsFromFirstData(): void
    {
        $stub = $this->getMockBuilder(DailyAveragesModel::class)
            ->disableOriginalConstructor()
            ->getMock();
        $stub->method('__call')->willReturnCallback(fn() => $stub);
        $stub->method('first')->willReturn(['first_date' => '2023-01-01 00:00:00']);
        $stub->expects($this->exactly(3))->method('findAll')->willReturn(array_fill(0, 30, ['precipitation' => 1.0]));

        $hourly = $this->createMock(HourlyAveragesModel::class);
        $hourly->method('__call')->willReturnSelf();

        // 1 current window + 2024 + 2023 = 3 queries (not 26); only 2 baseline windows -> null
        $this->assertNull((new AnomalyDetector($stub, $hourly))->computeSPI('2025-08-01', 30));
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

    public function testMaxPressureDropWithoutDates(): void
    {
        $detector = $this->_makeDetector();
        $rows = [
            ['pressure' => 1005.0],  // newest (index 0, DESC)
            ['pressure' => 1007.5],
            ['pressure' => 1010.0],  // oldest
        ];

        $ref = new \ReflectionMethod($detector, '_maxPressureDrop');
        $ref->setAccessible(true);

        $this->assertEqualsWithDelta(5.0, $ref->invoke($detector, $rows), 0.001);
    }

    /**
     * With fewer than 2 readings the drop is 0.0.
     */
    public function testMaxPressureDropFewerThanTwoRows(): void
    {
        $detector = $this->_makeDetector();

        $ref = new \ReflectionMethod($detector, '_maxPressureDrop');
        $ref->setAccessible(true);

        $this->assertSame(0.0, $ref->invoke($detector, []));
        $this->assertSame(0.0, $ref->invoke($detector, [['pressure' => 1010.0]]));
    }

    /**
     * A collapse in the middle of the day (not in the newest rows) is found, using the
     * real timestamps: 6 hPa between 10:00 and 13:00.
     */
    public function testPressureCollapseScansWholeDay(): void
    {
        $detector = $this->_makeDetector();
        $rows     = [];

        // DESC: 23:00 .. 00:00; pressure steady except 10:00 -> 13:00 (-6)
        for ($h = 23; $h >= 0; $h--) {
            $p = $h <= 10 ? 1010.0 : ($h >= 13 ? 1004.0 : 1010.0 - ($h - 10) * 2.0);
            $rows[] = ['date' => sprintf('2026-03-10 %02d:00:00', $h), 'pressure' => $p];
        }

        $this->assertTrue($detector->checkPressureCollapse($rows));
    }

    /**
     * The same 6 hPa spread over 4 hours (> 3 h window) is no collapse.
     */
    public function testPressureCollapseIgnoresSlowFall(): void
    {
        $detector = $this->_makeDetector();
        $rows     = [];

        for ($h = 4; $h >= 0; $h--) {
            $rows[] = ['date' => sprintf('2026-03-10 %02d:00:00', $h), 'pressure' => 1010.0 - (4 - $h) * 1.5];
        }

        $this->assertFalse($detector->checkPressureCollapse($rows));
    }

    /**
     * A drop straddling midnight is found through the previous day's tail rows.
     */
    public function testPressureCollapseAcrossMidnightUsesContextRows(): void
    {
        $detector = $this->_makeDetector();
        $day      = [
            ['date' => '2026-03-10 01:00:00', 'pressure' => 1004.0],
            ['date' => '2026-03-10 00:00:00', 'pressure' => 1006.0],
        ];
        $tail     = [
            ['date' => '2026-03-09 23:00:00', 'pressure' => 1008.0],
            ['date' => '2026-03-09 22:00:00', 'pressure' => 1010.0],
        ];

        $this->assertFalse($detector->checkPressureCollapse($day));
        $this->assertTrue($detector->checkPressureCollapse($day, $tail));
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

    // -------------------------------------------------------------------------
    // extreme_uv / evaluateDay
    // -------------------------------------------------------------------------

    /**
     * extreme_uv looks at the day's maximum hourly uv_index, not the 24h mean.
     */
    public function testExtremeUvUsesHourlyMaximum(): void
    {
        $detector = $this->_makeDetector();
        $today    = new \DateTime('2026-07-10');
        $hourly   = [
            ['date' => '2026-07-10 12:00:00', 'uv_index' => 7.5],
            ['date' => '2026-07-10 06:00:00', 'uv_index' => 1.0],
            ['date' => '2026-07-10 00:00:00', 'uv_index' => 0.0],
        ];

        $states = $detector->checkAllAnomalies($today, $hourly, ['uv_index' => 2.4]);

        $this->assertTrue($states['extreme_uv']['active']);
        $this->assertSame(7.5, $states['extreme_uv']['extraMetric']['value']);

        $states = $detector->checkAllAnomalies($today, [['uv_index' => 6.9]], ['uv_index' => 6.9]);
        $this->assertFalse($states['extreme_uv']['active']);

        $states = $detector->checkAllAnomalies($today, [], ['uv_index' => 9.0]);
        $this->assertFalse($states['extreme_uv']['active']);
        $this->assertNull($states['extreme_uv']['extraMetric']);
    }

    /**
     * evaluateDay() returns null when daily_averages has no row for the day.
     */
    public function testEvaluateDayReturnsNullWithoutDailyRow(): void
    {
        $daily = $this->getMockBuilder(DailyAveragesModel::class)->disableOriginalConstructor()->getMock();
        $daily->method('__call')->willReturnCallback(fn() => $daily);
        $daily->method('first')->willReturn(null);

        $hourly = $this->createMock(HourlyAveragesModel::class);
        $hourly->method('__call')->willReturnSelf();

        $this->assertNull((new AnomalyDetector($daily, $hourly))->evaluateDay(new \DateTime('2026-07-10')));
    }

    /**
     * evaluateDay() evaluates the stored row of that day (not "today") and feeds the
     * previous day's tail to the pressure check.
     */
    public function testEvaluateDayRunsAllChecksOnTheDay(): void
    {
        $daily = $this->getMockBuilder(DailyAveragesModel::class)->disableOriginalConstructor()->getMock();
        $daily->method('__call')->willReturnCallback(fn() => $daily);
        $daily->method('findAll')->willReturn([]);
        $daily->method('first')->willReturn(['date' => '2026-03-10 00:00:00', 'temperature' => 1.0, 'uv_index' => 0.2]);

        $hourly = $this->getMockBuilder(HourlyAveragesModel::class)->disableOriginalConstructor()->getMock();
        $hourly->method('__call')->willReturnCallback(fn() => $hourly);
        $calls = 0;
        $hourly->method('findAll')->willReturnCallback(function () use (&$calls) {
            return $calls++ === 0
                ? [['date' => '2026-03-10 01:00:00', 'pressure' => 1004.0]]
                : [['date' => '2026-03-09 22:00:00', 'pressure' => 1010.0]];   // tail of the previous day
        });

        $states = (new AnomalyDetector($daily, $hourly))->evaluateDay(new \DateTime('2026-03-10'));

        $this->assertIsArray($states);
        $this->assertTrue($states['pressure_collapse']['active']);
        $this->assertFalse($states['extreme_uv']['active']);
    }

    // -------------------------------------------------------------------------
    // _checkConsecutiveZScore (heat wave / cold snap)
    // -------------------------------------------------------------------------

    public function testConsecutiveZScoreRequiresConsecutiveDates(): void
    {
        // The two latest rows are 2026-07-10 and 2026-07-08: a missing day in between
        $daily = $this->_stubDaily([
            ['date' => '2026-07-10 00:00:00', 'temperature' => 35.0],
            ['date' => '2026-07-08 00:00:00', 'temperature' => 35.0],
        ]);
        $hourly = $this->createMock(HourlyAveragesModel::class);
        $hourly->method('__call')->willReturnSelf();

        $method = new \ReflectionMethod(AnomalyDetector::class, '_checkConsecutiveZScore');

        $this->assertFalse(
            $method->invoke(new AnomalyDetector($daily, $hourly), new \DateTime('2026-07-10'), 'temperature', 1.5, 2, 'above')
        );
    }

    public function testConsecutiveZScoreRequiresTodayAsLatestRow(): void
    {
        // Latest data is two days old: the run of days does not reach the evaluated day
        $daily = $this->_stubDaily([
            ['date' => '2026-07-08 00:00:00', 'temperature' => 35.0],
            ['date' => '2026-07-07 00:00:00', 'temperature' => 35.0],
        ]);
        $hourly = $this->createMock(HourlyAveragesModel::class);
        $hourly->method('__call')->willReturnSelf();

        $method = new \ReflectionMethod(AnomalyDetector::class, '_checkConsecutiveZScore');

        $this->assertFalse(
            $method->invoke(new AnomalyDetector($daily, $hourly), new \DateTime('2026-07-10'), 'temperature', 1.5, 2, 'above')
        );
    }
}
