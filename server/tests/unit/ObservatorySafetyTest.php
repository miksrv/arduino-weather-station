<?php

use App\Libraries\ObservatorySafety;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Libraries\ObservatorySafety (pure functions, no DB).
 *
 * The reference time is 2024-01-15 10:30 UTC.
 *
 * @internal
 */
final class ObservatorySafetyTest extends CIUnitTestCase
{
    private DateTimeImmutable $now;

    protected function setUp(): void
    {
        parent::setUp();
        $this->now = new DateTimeImmutable('2024-01-15 10:30:00', new DateTimeZone('UTC'));
    }

    /**
     * @param array<string, mixed> $values
     * @return array<string, mixed>
     */
    private function _row(string $time, string $source, array $values): array
    {
        return array_merge(['date' => '2024-01-15 ' . $time, 'source' => $source], $values);
    }

    /**
     * @return array<string, mixed>
     */
    private function _forecast(string $time, string $source, ?float $precipitation): array
    {
        return ['forecast_time' => '2024-01-15 ' . $time, 'source' => $source, 'precipitation' => $precipitation];
    }

    // -------------------------------------------------------------------------
    // precipitation
    // -------------------------------------------------------------------------

    public function testPrecipitationNeedsTwoSources(): void
    {
        $this->assertSame(0.0, ObservatorySafety::precipitation([
            $this->_row('10:00:00', 'OpenWeatherMap', ['precipitation' => 2.5]),
            $this->_row('10:00:00', 'WeatherAPI', ['precipitation' => 0.0]),
            $this->_row('10:00:00', 'OpenMeteo', ['precipitation' => 0.0]),
        ], $this->now));
    }

    public function testPrecipitationConfirmedByTwoSourcesReportsTheLowerOfThem(): void
    {
        $this->assertSame(0.4, ObservatorySafety::precipitation([
            $this->_row('10:00:00', 'OpenWeatherMap', ['precipitation' => 2.5]),
            $this->_row('10:00:00', 'WeatherAPI', ['precipitation' => 0.4]),
            $this->_row('10:00:00', 'OpenMeteo', ['precipitation' => 0.0]),
        ], $this->now));
    }

    public function testPrecipitationBelowWetHourIsDry(): void
    {
        $this->assertSame(0.0, ObservatorySafety::precipitation([
            $this->_row('10:00:00', 'WeatherAPI', ['precipitation' => 0.05]),
            $this->_row('10:00:00', 'OpenMeteo', ['precipitation' => 0.05]),
        ], $this->now));
    }

    /**
     * Only the latest report of a source counts: rain it reported earlier and
     * then stopped reporting does not confirm current rain.
     */
    public function testPrecipitationUsesLatestReportOfEverySource(): void
    {
        $this->assertSame(0.0, ObservatorySafety::precipitation([
            $this->_row('09:10:00', 'OpenWeatherMap', ['precipitation' => 1.0]),
            $this->_row('10:10:00', 'OpenWeatherMap', ['precipitation' => null]),
            $this->_row('10:00:00', 'WeatherAPI', ['precipitation' => 1.0]),
        ], $this->now));
    }

    public function testPrecipitationIgnoresReportsOutsideTheWindow(): void
    {
        $this->assertSame(0.0, ObservatorySafety::precipitation([
            $this->_row('08:30:00', 'OpenWeatherMap', ['precipitation' => 1.0]),
            $this->_row('10:00:00', 'WeatherAPI', ['precipitation' => 1.0]),
        ], $this->now));
    }

    public function testPrecipitationWithoutDataIsDry(): void
    {
        $this->assertSame(0.0, ObservatorySafety::precipitation([], $this->now));
    }

    // -------------------------------------------------------------------------
    // windSpeed / windGust
    // -------------------------------------------------------------------------

    /**
     * The station median ignores a single spike.
     */
    public function testWindSpeedUsesStationMedian(): void
    {
        $this->assertSame(3.0, ObservatorySafety::windSpeed([
            $this->_row('10:20:00', 'CustomStation', ['wind_speed' => 2.0]),
            $this->_row('10:21:00', 'CustomStation', ['wind_speed' => 30.0]),
            $this->_row('10:22:00', 'CustomStation', ['wind_speed' => 3.0]),
            $this->_row('10:23:00', 'CustomStation', ['wind_speed' => 4.0]),
            $this->_row('10:24:00', 'CustomStation', ['wind_speed' => 3.0]),
        ], $this->now));
    }

    /**
     * Sustained strong wind at the station is reported even when no API agrees.
     */
    public function testWindSpeedReportsSustainedStationWind(): void
    {
        $this->assertSame(11.0, ObservatorySafety::windSpeed([
            $this->_row('10:20:00', 'CustomStation', ['wind_speed' => 11.0]),
            $this->_row('10:21:00', 'CustomStation', ['wind_speed' => 12.0]),
            $this->_row('10:22:00', 'CustomStation', ['wind_speed' => 10.0]),
            $this->_row('10:00:00', 'OpenWeatherMap', ['wind_speed' => 2.0]),
        ], $this->now));
    }

    public function testWindSpeedFallsBackToConfirmedApiSources(): void
    {
        $this->assertSame(6.0, ObservatorySafety::windSpeed([
            $this->_row('10:00:00', 'OpenWeatherMap', ['wind_speed' => 14.0]),
            $this->_row('10:00:00', 'WeatherAPI', ['wind_speed' => 6.0]),
            $this->_row('10:00:00', 'OpenMeteo', ['wind_speed' => 5.0]),
        ], $this->now));
    }

    public function testWindSpeedIgnoresStationReadingsOlderThanItsWindow(): void
    {
        $this->assertSame(0.0, ObservatorySafety::windSpeed([
            $this->_row('09:50:00', 'CustomStation', ['wind_speed' => 12.0]),
        ], $this->now));
    }

    public function testWindGustNeedsTwoSources(): void
    {
        $this->assertSame(7.0, ObservatorySafety::windGust([
            $this->_row('10:00:00', 'OpenWeatherMap', ['wind_gust' => 30.0]),
            $this->_row('10:00:00', 'WeatherAPI', ['wind_gust' => 7.0]),
            $this->_row('10:00:00', 'OpenMeteo', ['wind_gust' => 6.0]),
        ], $this->now));
    }

    public function testWindGustIsNeverBelowConfirmedWindSpeed(): void
    {
        $this->assertSame(11.0, ObservatorySafety::windGust([
            $this->_row('10:20:00', 'CustomStation', ['wind_speed' => 11.0]),
            $this->_row('10:00:00', 'OpenWeatherMap', ['wind_gust' => 30.0]),
        ], $this->now));
    }

    // -------------------------------------------------------------------------
    // clouds
    // -------------------------------------------------------------------------

    /**
     * One source reporting overcast does not move the median of the others.
     */
    public function testCloudsIsTheMedianOfSources(): void
    {
        $this->assertSame(10.0, ObservatorySafety::clouds([
            $this->_row('10:00:00', 'OpenWeatherMap', ['clouds' => 100]),
            $this->_row('10:00:00', 'WeatherAPI', ['clouds' => 10]),
            $this->_row('10:00:00', 'OpenMeteo', ['clouds' => 5]),
        ], $this->now));
    }

    public function testCloudsNeedsTwoSources(): void
    {
        $this->assertSame(0.0, ObservatorySafety::clouds([
            $this->_row('10:00:00', 'OpenWeatherMap', ['clouds' => 100]),
        ], $this->now));
        $this->assertSame(0.0, ObservatorySafety::clouds([], $this->now));
    }

    public function testCloudsReportsOvercastConfirmedBySources(): void
    {
        $this->assertSame(85.0, ObservatorySafety::clouds([
            $this->_row('10:00:00', 'OpenWeatherMap', ['clouds' => 90]),
            $this->_row('10:00:00', 'WeatherAPI', ['clouds' => 80]),
        ], $this->now));
    }

    // -------------------------------------------------------------------------
    // forecastFlag
    // -------------------------------------------------------------------------

    public function testForecastFlagIsClearWhenOneSourceForecastsRain(): void
    {
        $this->assertSame(1, ObservatorySafety::forecastFlag([
            $this->_forecast('11:00:00', 'WeatherAPI', 3.0),
            $this->_forecast('11:00:00', 'OpenMeteo', 0.0),
            $this->_forecast('11:00:00', 'VisualCrossing', 0.0),
        ], $this->now));
    }

    public function testForecastFlagIsUnsafeWhenTwoSourcesForecastRainInTheSameHour(): void
    {
        $this->assertSame(-1, ObservatorySafety::forecastFlag([
            $this->_forecast('12:00:00', 'WeatherAPI', 0.3),
            $this->_forecast('12:00:00', 'OpenMeteo', 0.1),
            $this->_forecast('12:00:00', 'VisualCrossing', 0.0),
        ], $this->now));
    }

    /**
     * Two sources wet in different hours do not confirm each other.
     */
    public function testForecastFlagNeedsAgreementWithinOneHour(): void
    {
        $this->assertSame(1, ObservatorySafety::forecastFlag([
            $this->_forecast('11:00:00', 'WeatherAPI', 0.5),
            $this->_forecast('12:00:00', 'OpenMeteo', 0.5),
        ], $this->now));
    }

    /**
     * The current hour counts: rain forecast for 10:00-11:00 is rain now.
     */
    public function testForecastFlagIncludesTheCurrentHour(): void
    {
        $this->assertSame(-1, ObservatorySafety::forecastFlag([
            $this->_forecast('10:00:00', 'WeatherAPI', 0.5),
            $this->_forecast('10:00:00', 'OpenMeteo', 0.5),
        ], $this->now));
    }

    public function testForecastFlagIgnoresHoursBeyondTheLookAhead(): void
    {
        $this->assertSame(1, ObservatorySafety::forecastFlag([
            $this->_forecast('09:00:00', 'WeatherAPI', 5.0),
            $this->_forecast('09:00:00', 'OpenMeteo', 5.0),
            $this->_forecast('13:00:00', 'WeatherAPI', 5.0),
            $this->_forecast('13:00:00', 'OpenMeteo', 5.0),
        ], $this->now));
    }

    public function testForecastFlagIgnoresDrizzleBelowWetHour(): void
    {
        $this->assertSame(1, ObservatorySafety::forecastFlag([
            $this->_forecast('11:00:00', 'WeatherAPI', 0.05),
            $this->_forecast('11:00:00', 'OpenMeteo', 0.05),
        ], $this->now));
    }

    public function testForecastFlagIsClearWithoutForecastData(): void
    {
        $this->assertSame(1, ObservatorySafety::forecastFlag([], $this->now));
        $this->assertSame(1, ObservatorySafety::forecastFlag([
            $this->_forecast('11:00:00', 'WeatherAPI', null),
            $this->_forecast('11:00:00', 'OpenMeteo', null),
        ], $this->now));
    }
}
