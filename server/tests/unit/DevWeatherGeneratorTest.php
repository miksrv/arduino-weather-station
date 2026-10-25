<?php

use App\Libraries\DevWeatherGenerator;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for the pure helpers of DevWeatherGenerator (used by DevWeatherSeeder).
 *
 * @internal
 */
final class DevWeatherGeneratorTest extends CIUnitTestCase
{
    /**
     * The generated state is a pure function of the timestamp.
     */
    public function testStateIsDeterministic(): void
    {
        $ts = strtotime('2026-10-24 12:00:00 UTC');

        $this->assertSame(DevWeatherGenerator::state($ts), DevWeatherGenerator::state($ts));
        $this->assertSame(DevWeatherGenerator::customStationRow($ts), DevWeatherGenerator::customStationRow($ts));
    }

    /**
     * Values stay physically plausible across a full year.
     */
    public function testStateStaysWithinPlausibleRanges(): void
    {
        $start = strtotime('2026-01-01 UTC');

        for ($i = 0; $i < 365 * 4; $i++) {
            $s = DevWeatherGenerator::state($start + $i * 21600);

            $this->assertGreaterThan(-45, $s['temperature']);
            $this->assertLessThan(45, $s['temperature']);
            $this->assertGreaterThanOrEqual(22, $s['humidity']);
            $this->assertLessThanOrEqual(99, $s['humidity']);
            $this->assertGreaterThanOrEqual(985, $s['pressure']);
            $this->assertLessThanOrEqual(1045, $s['pressure']);
            $this->assertGreaterThanOrEqual(0, $s['wind_speed']);
            $this->assertGreaterThanOrEqual($s['wind_speed'], $s['wind_gust']);
            $this->assertGreaterThanOrEqual(0, $s['wind_deg']);
            $this->assertLessThan(360, $s['wind_deg']);
            $this->assertGreaterThanOrEqual(0, $s['precipitation']);
            $this->assertLessThanOrEqual(20, $s['uv_index']);
        }
    }

    /**
     * Solar quantities are zero at night and positive at midday; summer noon is brighter than autumn noon.
     */
    public function testSolarCycle(): void
    {
        $this->assertSame(0.0, DevWeatherGenerator::state(strtotime('2026-10-24 22:00:00 UTC'))['sol_radiation']);
        $this->assertSame(0.0, DevWeatherGenerator::state(strtotime('2026-07-20 20:00:00 UTC'))['uv_index']);
        $this->assertGreaterThan(
            DevWeatherGenerator::solarSin(strtotime('2026-10-24 07:00:00 UTC')),
            DevWeatherGenerator::solarSin(strtotime('2026-07-20 07:00:00 UTC'))
        );
    }

    /**
     * July is clearly warmer than January on average.
     */
    public function testSeasonalTemperatureTrend(): void
    {
        $avg = static function (string $day): float {
            $t0  = strtotime($day . ' UTC');
            $sum = 0.0;

            for ($i = 0; $i < 24 * 20; $i++) {
                $sum += DevWeatherGenerator::state($t0 + $i * 3600)['temperature'];
            }

            return $sum / (24 * 20);
        };

        $this->assertGreaterThan($avg('2026-01-05') + 20, $avg('2026-07-10'));
    }

    /**
     * Magnus dew point: equals air temperature at 100 % humidity and is lower below that.
     */
    public function testDewPoint(): void
    {
        $this->assertEqualsWithDelta(10.0, DevWeatherGenerator::dewPoint(10.0, 100.0), 0.01);
        $this->assertEqualsWithDelta(9.3, DevWeatherGenerator::dewPoint(20.0, 50.0), 0.2);
        $this->assertLessThan(5.0, DevWeatherGenerator::dewPoint(5.0, 60.0));
    }

    /**
     * Wind makes the air feel colder.
     */
    public function testFeelsLikeDropsWithWind(): void
    {
        $this->assertLessThan(
            DevWeatherGenerator::feelsLike(0.0, 70.0, 1.0),
            DevWeatherGenerator::feelsLike(0.0, 70.0, 8.0)
        );
    }

    /**
     * Condition codes follow precipitation, temperature and cloud cover.
     */
    public function testWeatherId(): void
    {
        $this->assertSame(800, DevWeatherGenerator::weatherId(0, 10, 5, 50, 3));
        $this->assertSame(804, DevWeatherGenerator::weatherId(0, 10, 95, 50, 3));
        $this->assertSame(741, DevWeatherGenerator::weatherId(0, 10, 50, 98, 1));
        $this->assertSame(501, DevWeatherGenerator::weatherId(1.5, 10, 90, 90, 3));
        $this->assertSame(601, DevWeatherGenerator::weatherId(1.0, -5, 90, 90, 3));
        $this->assertSame(211, DevWeatherGenerator::weatherId(3.0, 22, 100, 90, 3));
    }

    /**
     * Slots are strictly after the lower bound, on the cadence grid, and capped at the upper bound.
     */
    public function testSlots(): void
    {
        $this->assertSame([300, 600, 900], DevWeatherGenerator::slots(0, 900, 300));
        $this->assertSame([600, 900], DevWeatherGenerator::slots(300, 900, 300));
        $this->assertSame([840, 2640], DevWeatherGenerator::slots(100, 2700, 1800, 840));
        $this->assertSame([], DevWeatherGenerator::slots(900, 900, 300));
    }

    /**
     * A CustomStation row only holds what the Arduino POST /sensors stores.
     */
    public function testCustomStationRowShape(): void
    {
        $row = DevWeatherGenerator::customStationRow(strtotime('2026-10-24 06:00:00 UTC'));

        $this->assertSame('CustomStation', $row['source']);
        $this->assertSame(
            ['date', 'source', 'temperature', 'pressure', 'humidity', 'dew_point', 'uv_index', 'wind_speed', 'wind_deg'],
            array_keys($row)
        );
    }

    /**
     * External rows carry the columns each provider fills; forecast rows target the requested hour.
     */
    public function testExternalAndForecastRows(): void
    {
        $ts = strtotime('2026-10-24 12:00:00 UTC');

        $owm = DevWeatherGenerator::externalRow('OpenWeatherMap', $ts);
        $this->assertSame('OpenWeatherMap', $owm['source']);
        $this->assertArrayHasKey('weather_id', $owm);
        $this->assertLessThanOrEqual(10000, $owm['visibility']);

        $om = DevWeatherGenerator::externalRow('OpenMeteo', $ts);
        $this->assertArrayHasKey('pm2_5', $om);
        $this->assertArrayHasKey('sol_radiation', $om);

        $fc = DevWeatherGenerator::forecastRow('OpenMeteo', $ts + 7200, $ts);
        $this->assertSame('2026-10-24 14:00:00', $fc['forecast_time']);
        $this->assertSame('OpenMeteo', $fc['source']);
    }
}
