<?php

use CodeIgniter\Test\CIUnitTestCase;

/**
 * Tests for app/Helpers/weather_helper.php
 *
 * @internal
 */
final class WeatherHelperTest extends CIUnitTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        helper('weather');
    }

    // -------------------------------------------------------------------------
    // kmh_to_ms
    // -------------------------------------------------------------------------

    /**
     * 0 km/h → 0 m/s
     */
    public function testKmhToMsZero(): void
    {
        $this->assertEqualsWithDelta(0.0, kmh_to_ms(0.0), 0.0001);
    }

    /**
     * 3600 km/h → 1000 m/s
     */
    public function testKmhToMsLargeValue(): void
    {
        $this->assertEqualsWithDelta(1000.0, kmh_to_ms(3600.0), 0.0001);
    }

    /**
     * 36 km/h → 10 m/s
     */
    public function testKmhToMsTypicalValue(): void
    {
        $this->assertEqualsWithDelta(10.0, kmh_to_ms(36.0), 0.0001);
    }

    /**
     * 1.8 km/h → 0.5 m/s
     */
    public function testKmhToMsFractionalValue(): void
    {
        $this->assertEqualsWithDelta(0.5, kmh_to_ms(1.8), 0.0001);
    }

    // -------------------------------------------------------------------------
    // calculateDewPoint
    // -------------------------------------------------------------------------

    /**
     * At 100 % humidity the dew point equals the air temperature.
     */
    public function testCalculateDewPointAt100PercentHumidity(): void
    {
        $result = calculateDewPoint(20.0, 100.0);
        $this->assertEqualsWithDelta(20.0, $result, 0.1);
    }

    /**
     * Known reference value: 20°C / 50% → ~9.27°C
     */
    public function testCalculateDewPointKnownValue(): void
    {
        $result = calculateDewPoint(20.0, 50.0);
        // Using Magnus-Tetens: approx 9.27
        $this->assertEqualsWithDelta(9.27, $result, 0.1);
    }

    /**
     * Result is rounded to 2 decimal places.
     */
    public function testCalculateDewPointRoundedToTwoDecimals(): void
    {
        $result = calculateDewPoint(25.0, 60.0);
        // Result must have at most 2 decimal places
        $this->assertSame(round($result, 2), $result);
    }

    /**
     * Dew point is always ≤ air temperature.
     */
    public function testCalculateDewPointNeverExceedsTemperature(): void
    {
        foreach ([10, 20, 30] as $temp) {
            foreach ([30, 50, 80] as $humidity) {
                $dew = calculateDewPoint((float) $temp, (float) $humidity);
                $this->assertLessThanOrEqual((float) $temp, $dew,
                    "Dew point {$dew} exceeds temperature {$temp} at humidity {$humidity}%");
            }
        }
    }

    // -------------------------------------------------------------------------
    // mmHg_to_hPa
    // -------------------------------------------------------------------------

    /**
     * 0 mmHg → 0 hPa
     */
    public function testMmHgToHPaZero(): void
    {
        $this->assertSame(0, mmHg_to_hPa(0.0));
    }

    /**
     * 750 mmHg → ~999 hPa (known reference)
     */
    public function testMmHgToHPaTypicalAtmosphericPressure(): void
    {
        // 750 * 1.33322 = 999.915 → rounded to 1000
        $result = mmHg_to_hPa(750.0);
        $this->assertSame(1000, $result);
    }

    /**
     * 1 mmHg → 1 hPa (1 * 1.33322 rounds to 1)
     */
    public function testMmHgToHPaOneUnit(): void
    {
        $result = mmHg_to_hPa(1.0);
        $this->assertSame(1, $result);
    }

    /**
     * Return type is always int.
     */
    public function testMmHgToHPaReturnsInt(): void
    {
        $result = mmHg_to_hPa(760.0);
        $this->assertIsInt($result);
    }

    /**
     * 760 mmHg is standard atmosphere: should be ~1013 hPa
     */
    public function testMmHgToHPaStandardAtmosphere(): void
    {
        // 760 * 1.33322 = 1013.2472 → rounds to 1013
        $result = mmHg_to_hPa(760.0);
        $this->assertSame(1013, $result);
    }
}
