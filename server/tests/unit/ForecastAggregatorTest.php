<?php

use App\Libraries\ForecastAggregator;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Libraries\ForecastAggregator (pure functions, no DB).
 *
 * @internal
 */
final class ForecastAggregatorTest extends CIUnitTestCase
{
    /**
     * @param array<string, mixed> $over
     * @return array<string, mixed>
     */
    private function _row(string $time, string $source = 'A', array $over = []): array
    {
        return array_merge([
            'forecast_time' => $time,
            'source'        => $source,
            'temperature'   => 10.0,
            'feels_like'    => 8.0,
            'pressure'      => 1010,
            'humidity'      => 60,
            'dew_point'     => 3.0,
            'uv_index'      => 0.0,
            'sol_energy'    => null,
            'sol_radiation' => null,
            'precipitation' => 0.0,
            'clouds'        => 50,
            'visibility'    => 10000,
            'wind_speed'    => 4.0,
            'wind_deg'      => 90,
            'wind_gust'     => 6.0,
            'weather_id'    => 803,
        ], $over);
    }

    /**
     * @param array<string, mixed> $over
     * @return array<string, mixed>
     */
    private function _hour(string $date, array $over = []): array
    {
        return array_merge([
            'date' => $date, 'temperature' => 10.0, 'feelsLike' => 8.0, 'humidity' => 60, 'pressure' => 1010,
            'dewPoint' => 3.0, 'clouds' => 50, 'visibility' => 10000, 'uvIndex' => 0.0, 'precipitation' => 0.0,
            'windSpeed' => 4.0, 'windGust' => 6.0, 'windDeg' => 90, 'weatherId' => 803,
        ], $over);
    }

    // ---- circularMean ------------------------------------------------------

    public function testCircularMeanWrapsAroundNorth(): void
    {
        $this->assertSame(0, ForecastAggregator::circularMean([350, 10]));
    }

    public function testCircularMeanSimple(): void
    {
        $this->assertSame(90, ForecastAggregator::circularMean([80, 100]));
        $this->assertSame(355, ForecastAggregator::circularMean([350, 0]));
    }

    public function testCircularMeanEmptyAndNullsGiveNull(): void
    {
        $this->assertNull(ForecastAggregator::circularMean([]));
        $this->assertNull(ForecastAggregator::circularMean([null, null]));
    }

    public function testCircularMeanOppositeFallsBackToFirst(): void
    {
        $this->assertSame(0, ForecastAggregator::circularMean([0, 180]));
    }

    public function testCircularMeanWeighted(): void
    {
        // Strong wind from 90, near-calm from 270.
        $this->assertSame(90, ForecastAggregator::circularMean([90, 270], [10.0, 1.0]));
        $this->assertSame(270, ForecastAggregator::circularMean([90, 270], [1.0, 10.0]));
    }

    // ---- weather id --------------------------------------------------------

    public function testRainBeatsOvercast(): void
    {
        $this->assertSame(500, ForecastAggregator::representativeWeatherId([500, 804, 804], 0.4, 100.0));
    }

    public function testSnowOutranksRainThunderOutranksSnow(): void
    {
        $this->assertSame(601, ForecastAggregator::representativeWeatherId([500, 601], 1.0, 90.0));
        $this->assertSame(211, ForecastAggregator::representativeWeatherId([601, 211, 500], 1.0, 90.0));
        $this->assertSame(500, ForecastAggregator::representativeWeatherId([300, 500], 1.0, 90.0));
    }

    public function testMostFrequentCodeWithinGroup(): void
    {
        $this->assertSame(501, ForecastAggregator::representativeWeatherId([500, 501, 501], 1.0, 90.0));
    }

    public function testPrecipitationCodeIgnoredWhenDryAndMinority(): void
    {
        $this->assertSame(804, ForecastAggregator::representativeWeatherId([500, 804, 804], 0.0, 100.0));
    }

    public function testPrecipitationCodeMajorityWithoutMeasuredPrecip(): void
    {
        $this->assertSame(500, ForecastAggregator::representativeWeatherId([500, 500, 804], 0.0, 100.0));
    }

    public function testFogByMajority(): void
    {
        $this->assertSame(741, ForecastAggregator::representativeWeatherId([741, 741, 803], 0.0, 70.0));
        $this->assertSame(803, ForecastAggregator::representativeWeatherId([741, 803, 803], 0.0, 70.0));
    }

    public function testCloudThresholds(): void
    {
        $this->assertSame(800, ForecastAggregator::cloudsToWeatherId(0));
        $this->assertSame(800, ForecastAggregator::cloudsToWeatherId(10.9));
        $this->assertSame(801, ForecastAggregator::cloudsToWeatherId(11));
        $this->assertSame(801, ForecastAggregator::cloudsToWeatherId(24.9));
        $this->assertSame(802, ForecastAggregator::cloudsToWeatherId(25));
        $this->assertSame(802, ForecastAggregator::cloudsToWeatherId(49.9));
        $this->assertSame(803, ForecastAggregator::cloudsToWeatherId(50));
        $this->assertSame(803, ForecastAggregator::cloudsToWeatherId(84.9));
        $this->assertSame(804, ForecastAggregator::cloudsToWeatherId(85));
        $this->assertSame(804, ForecastAggregator::cloudsToWeatherId(100));
    }

    public function testWeatherIdFromCloudsAndFallbacks(): void
    {
        $this->assertSame(802, ForecastAggregator::representativeWeatherId([804], 0.0, 30.0));
        $this->assertSame(801, ForecastAggregator::representativeWeatherId([801, 801, 802], 0.0, null));
        $this->assertNull(ForecastAggregator::representativeWeatherId([], null, null));
    }

    // ---- hourly ------------------------------------------------------------

    public function testHourlyAveragesSourcesAndTakesMaxGust(): void
    {
        $rows = [
            $this->_row('2026-01-01 10:00:00', 'A', ['temperature' => 10, 'wind_gust' => 5, 'wind_deg' => 350, 'precipitation' => 0.4]),
            $this->_row('2026-01-01 10:00:00', 'B', ['temperature' => 12, 'wind_gust' => 9, 'wind_deg' => 10, 'precipitation' => 0.2, 'weather_id' => 500]),
            $this->_row('2026-01-01 11:00:00', 'A', ['temperature' => 20]),
        ];

        $hourly = ForecastAggregator::hourly($rows);

        $this->assertCount(2, $hourly);
        $this->assertSame('2026-01-01 10:00:00', $hourly[0]['date']);
        $this->assertEqualsWithDelta(11.0, $hourly[0]['temperature'], 0.001);
        $this->assertEqualsWithDelta(9.0, $hourly[0]['windGust'], 0.001);
        $this->assertSame(0, $hourly[0]['windDeg']);
        $this->assertEqualsWithDelta(0.3, $hourly[0]['precipitation'], 0.001);
        $this->assertSame(500, $hourly[0]['weatherId']);
        $this->assertSame('2026-01-01 11:00:00', $hourly[1]['date']);
    }

    public function testHourlySortsAndSkipsRowsWithoutTime(): void
    {
        $rows = [
            $this->_row('2026-01-01 12:00:00'),
            $this->_row('2026-01-01 09:00:00'),
            ['forecast_time' => null],
        ];

        $hourly = ForecastAggregator::hourly($rows);

        $this->assertSame(['2026-01-01 09:00:00', '2026-01-01 12:00:00'], array_column($hourly, 'date'));
    }

    // ---- daily -------------------------------------------------------------

    public function testDailySumsPrecipitationAndCountsWetHours(): void
    {
        $hours = [
            $this->_hour('2026-01-01 00:00:00', ['precipitation' => 0.5, 'weatherId' => 500]),
            $this->_hour('2026-01-01 01:00:00', ['precipitation' => 0.74, 'weatherId' => 500]),
            $this->_hour('2026-01-01 02:00:00', ['precipitation' => 0.05, 'weatherId' => 804]),
            $this->_hour('2026-01-01 03:00:00', ['precipitation' => 0.0, 'weatherId' => 804]),
        ];

        $day = ForecastAggregator::daily($hours, new DateTimeZone('UTC'))[0];

        $this->assertEqualsWithDelta(1.3, $day['precipitation'], 0.0001);
        $this->assertSame(2, $day['precipitationHours']);
        $this->assertSame(500, $day['weatherId']);
    }

    public function testDailyLocalDayBucketingAcrossUtcMidnight(): void
    {
        // Yekaterinburg is UTC+5: 19:00Z on the 1st is already 00:00 on the 2nd locally.
        $hours = [
            $this->_hour('2026-01-01 18:00:00', ['temperature' => 1.0]),
            $this->_hour('2026-01-01 19:00:00', ['temperature' => 3.0]),
            $this->_hour('2026-01-02 18:00:00', ['temperature' => 5.0]),
            $this->_hour('2026-01-02 19:00:00', ['temperature' => 7.0]),
        ];

        $days = ForecastAggregator::daily($hours, new DateTimeZone('Asia/Yekaterinburg'));

        $this->assertSame(['2026-01-01 00:00:00', '2026-01-02 00:00:00', '2026-01-03 00:00:00'], array_column($days, 'date'));
        $this->assertEqualsWithDelta(1.0, $days[0]['temperature'], 0.001);   // 18:00Z = 23:00 local on the 1st
        $this->assertEqualsWithDelta(4.0, $days[1]['temperature'], 0.001);   // 19:00Z (1st) and 18:00Z (2nd)
        $this->assertEqualsWithDelta(3.0, $days[1]['temperatureMin'], 0.001);
        $this->assertEqualsWithDelta(5.0, $days[1]['temperatureMax'], 0.001);
        $this->assertEqualsWithDelta(7.0, $days[2]['temperature'], 0.001);
    }

    public function testDailyMinMaxAndMaxima(): void
    {
        $hours = [
            $this->_hour('2026-01-01 03:00:00', ['temperature' => -4.0, 'feelsLike' => -9.0, 'windSpeed' => 2.0, 'windGust' => 4.0, 'uvIndex' => 0.0]),
            $this->_hour('2026-01-01 08:00:00', ['temperature' => 6.0, 'feelsLike' => 3.0, 'windSpeed' => 8.0, 'windGust' => 15.5, 'uvIndex' => 2.4]),
        ];

        $day = ForecastAggregator::daily($hours, new DateTimeZone('UTC'))[0];

        $this->assertEqualsWithDelta(-4.0, $day['temperatureMin'], 0.001);
        $this->assertEqualsWithDelta(6.0, $day['temperatureMax'], 0.001);
        $this->assertEqualsWithDelta(-9.0, $day['feelsLikeMin'], 0.001);
        $this->assertEqualsWithDelta(3.0, $day['feelsLikeMax'], 0.001);
        $this->assertEqualsWithDelta(1.0, $day['temperature'], 0.001);
        $this->assertEqualsWithDelta(8.0, $day['windSpeedMax'], 0.001);
        $this->assertEqualsWithDelta(5.0, $day['windSpeed'], 0.001);
        $this->assertEqualsWithDelta(15.5, $day['windGust'], 0.001);
        $this->assertEqualsWithDelta(2.4, $day['uvIndex'], 0.001);
    }

    public function testDailyWindDirectionIsSpeedWeightedCircularMean(): void
    {
        $hours = [
            $this->_hour('2026-01-01 03:00:00', ['windDeg' => 350, 'windSpeed' => 5.0]),
            $this->_hour('2026-01-01 04:00:00', ['windDeg' => 10, 'windSpeed' => 5.0]),
        ];

        $this->assertSame(0, ForecastAggregator::daily($hours, new DateTimeZone('UTC'))[0]['windDeg']);
    }

    public function testDailyRainDayBeatsOvercastHours(): void
    {
        $hours = [];
        for ($h = 0; $h < 24; $h++) {
            $wet     = $h >= 10 && $h < 13;
            $hours[] = $this->_hour(sprintf('2026-01-01 %02d:00:00', $h), [
                'precipitation' => $wet ? 0.6 : 0.0,
                'weatherId'     => $wet ? 501 : 804,
                'clouds'        => 100,
            ]);
        }

        $day = ForecastAggregator::daily($hours, new DateTimeZone('UTC'))[0];

        $this->assertSame(501, $day['weatherId']);
        $this->assertSame(3, $day['precipitationHours']);
    }

    public function testDailySnowBeatsRainAndThunderBeatsSnow(): void
    {
        $mk = fn (array $ids) => array_map(
            fn (int $i) => $this->_hour(sprintf('2026-01-01 %02d:00:00', $i), ['precipitation' => 0.5, 'weatherId' => $ids[$i]]),
            array_keys($ids)
        );
        $tz = new DateTimeZone('UTC');

        $this->assertSame(601, ForecastAggregator::daily($mk([500, 500, 500, 601, 601]), $tz)[0]['weatherId']);
        $this->assertSame(200, ForecastAggregator::daily($mk([601, 601, 601, 200]), $tz)[0]['weatherId']);
    }

    public function testDailyFogNeedsThreeHours(): void
    {
        $fog = fn (int $n) => array_map(
            fn (int $i) => $this->_hour(sprintf('2026-01-01 %02d:00:00', $i), ['weatherId' => $i < $n ? 741 : 804, 'clouds' => 100]),
            range(0, 5)
        );
        $tz = new DateTimeZone('UTC');

        $this->assertSame(741, ForecastAggregator::daily($fog(3), $tz)[0]['weatherId']);
        $this->assertSame(804, ForecastAggregator::daily($fog(2), $tz)[0]['weatherId']);
    }

    public function testDailyDryDayUsesMeanCloudThresholds(): void
    {
        $hours = [
            $this->_hour('2026-01-01 03:00:00', ['clouds' => 0, 'weatherId' => 800]),
            $this->_hour('2026-01-01 04:00:00', ['clouds' => 20, 'weatherId' => 801]),
        ];

        $this->assertSame(800, ForecastAggregator::daily($hours, new DateTimeZone('UTC'))[0]['weatherId']);
    }

    public function testDailyLimitsNumberOfDays(): void
    {
        $hours = [];
        for ($d = 1; $d <= 10; $d++) {
            $hours[] = $this->_hour(sprintf('2026-01-%02d 06:00:00', $d));
        }

        $this->assertCount(8, ForecastAggregator::daily($hours, new DateTimeZone('UTC')));
        $this->assertCount(3, ForecastAggregator::daily($hours, new DateTimeZone('UTC'), 3));
    }

    public function testStationTimezoneConfigDefault(): void
    {
        $this->assertSame('Asia/Yekaterinburg', config(\Config\App::class)->stationTimezone);
    }
}
