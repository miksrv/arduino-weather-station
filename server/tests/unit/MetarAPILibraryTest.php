<?php

use App\Libraries\MetarAPILibrary;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\CURLRequest;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Libraries\MetarAPILibrary.
 *
 * @internal
 */
final class MetarAPILibraryTest extends CIUnitTestCase
{
    private string|false $originalStation;

    protected function setUp(): void
    {
        parent::setUp();
        $this->originalStation = getenv('app.metar.station');
        putenv('app.metar.station=UWOO');
    }

    protected function tearDown(): void
    {
        putenv($this->originalStation === false ? 'app.metar.station' : 'app.metar.station=' . $this->originalStation);
        parent::tearDown();
    }

    // -------------------------------------------------------------------------
    // parseWeather
    // -------------------------------------------------------------------------

    public function testParseWeatherNoWeatherIsDry(): void
    {
        $this->assertSame(['precipitation' => 0.0, 'weather_id' => null], MetarAPILibrary::parseWeather(''));
    }

    public function testParseWeatherRainIntensities(): void
    {
        $this->assertSame(['precipitation' => 0.5, 'weather_id' => 500], MetarAPILibrary::parseWeather('-RA'));
        $this->assertSame(['precipitation' => 2.0, 'weather_id' => 501], MetarAPILibrary::parseWeather('RA'));
        $this->assertSame(['precipitation' => 6.0, 'weather_id' => 502], MetarAPILibrary::parseWeather('+RA'));
    }

    public function testParseWeatherShowersSnowDrizzle(): void
    {
        $this->assertSame(520, MetarAPILibrary::parseWeather('-SHRA')['weather_id']);
        $this->assertSame(621, MetarAPILibrary::parseWeather('SHSN')['weather_id']);
        $this->assertSame(602, MetarAPILibrary::parseWeather('+SN')['weather_id']);
        $this->assertSame(['precipitation' => 0.1, 'weather_id' => 300], MetarAPILibrary::parseWeather('-DZ'));
    }

    public function testParseWeatherMixedFreezingAndThunderstorm(): void
    {
        $this->assertSame(['precipitation' => 2.0, 'weather_id' => 616], MetarAPILibrary::parseWeather('RASN'));
        $this->assertSame(511, MetarAPILibrary::parseWeather('-FZRA')['weather_id']);
        $this->assertSame(['precipitation' => 2.0, 'weather_id' => 201], MetarAPILibrary::parseWeather('TSRA'));
        $this->assertSame(['precipitation' => 0.0, 'weather_id' => 211], MetarAPILibrary::parseWeather('TS'));
    }

    public function testParseWeatherPrecipitationWinsOverObscuration(): void
    {
        $this->assertSame(['precipitation' => 0.5, 'weather_id' => 500], MetarAPILibrary::parseWeather('-RA BR'));
        $this->assertSame(['precipitation' => 0.0, 'weather_id' => 741], MetarAPILibrary::parseWeather('FZFG'));
    }

    public function testParseWeatherIgnoresVicinityAndRecent(): void
    {
        $this->assertSame(['precipitation' => 0.0, 'weather_id' => null], MetarAPILibrary::parseWeather('VCSH RERA'));
    }

    // -------------------------------------------------------------------------
    // Conversions
    // -------------------------------------------------------------------------

    public function testCloudCoverCodeUsesCoverThenDensestLayer(): void
    {
        $this->assertSame('OVC', MetarAPILibrary::cloudCoverCode(['cover' => 'OVC']));
        $this->assertSame('BKN', MetarAPILibrary::cloudCoverCode(['clouds' => [['cover' => 'FEW'], ['cover' => 'BKN'], ['cover' => 'SCT']]]));
        $this->assertSame('CAVOK', MetarAPILibrary::cloudCoverCode(['cover' => 'CAVOK']));
        $this->assertNull(MetarAPILibrary::cloudCoverCode([]));
    }

    public function testVisibilityMeters(): void
    {
        $this->assertSame(10000, MetarAPILibrary::visibilityMeters('6+'));
        $this->assertSame(2414, MetarAPILibrary::visibilityMeters(1.5));
        $this->assertSame(10000, MetarAPILibrary::visibilityMeters(10));
        $this->assertNull(MetarAPILibrary::visibilityMeters(null));
    }

    public function testRelativeHumidity(): void
    {
        $this->assertSame(100.0, MetarAPILibrary::relativeHumidity(5.0, 5.0));
        $this->assertEqualsWithDelta(56.5, MetarAPILibrary::relativeHumidity(6.0, -2.0), 0.5);
    }

    // -------------------------------------------------------------------------
    // getWeatherData
    // -------------------------------------------------------------------------

    public function testGetWeatherDataMapsNewestReport(): void
    {
        $library = $this->_buildLibrary(json_encode([
            [
                'obsTime' => 1793838600, 'temp' => 6, 'dewp' => -2, 'wdir' => 120, 'wspd' => 8,
                'visib' => '6+', 'altim' => 1009, 'cover' => 'OVC', 'clouds' => [['cover' => 'OVC', 'base' => 4900]],
            ],
            [
                'obsTime' => 1793840400, 'temp' => 6, 'dewp' => -2, 'wdir' => 120, 'wspd' => 8, 'wgst' => 20,
                'visib' => '6+', 'altim' => 1008.4, 'wxString' => '-RA', 'cover' => 'OVC',
                'clouds' => [['cover' => 'OVC', 'base' => 4900]],
            ],
        ]));

        $result = $library->getWeatherData();

        $this->assertIsArray($result);
        $this->assertSame(RawWeatherDataModel::SOURCE_METAR, $result['source']);
        $this->assertSame('2026-11-05 01:00:00', $result['date']->format('Y-m-d H:i:s'));
        $this->assertSame(6.0, $result['temperature']);
        $this->assertSame(-2.0, $result['dew_point']);
        $this->assertSame(1008, $result['pressure']);
        $this->assertSame(4.12, $result['wind_speed']);
        $this->assertSame(10.29, $result['wind_gust']);
        $this->assertSame(120, $result['wind_deg']);
        $this->assertSame(100, $result['clouds']);
        $this->assertSame(10000, $result['visibility']);
        $this->assertSame(0.5, $result['precipitation']);
        $this->assertSame(500, $result['weather_id']);
    }

    public function testGetWeatherDataDryReportUsesCoverCondition(): void
    {
        $library = $this->_buildLibrary(json_encode([
            ['obsTime' => 1793840400, 'temp' => 6, 'dewp' => -2, 'wdir' => 'VRB', 'wspd' => 2, 'cover' => 'SCT'],
        ]));

        $result = $library->getWeatherData();

        $this->assertNull($result['wind_deg']);
        $this->assertNull($result['wind_gust']);
        $this->assertSame(44, $result['clouds']);
        $this->assertSame(0.0, $result['precipitation']);
        $this->assertSame(802, $result['weather_id']);
    }

    public function testGetWeatherDataEmptyResponseReturnsFalse(): void
    {
        $this->assertFalse($this->_buildLibrary('[]')->getWeatherData());
    }

    public function testGetWeatherDataWithoutStationSkipsRequest(): void
    {
        putenv('app.metar.station=');

        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->expects($this->never())->method('request');

        $library = new MetarAPILibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        $this->assertFalse($library->getWeatherData());
    }

    public function testGetForecastWeatherDataReturnsFalse(): void
    {
        $this->assertFalse((new MetarAPILibrary())->getForecastWeatherData());
    }

    public function testSourceName(): void
    {
        $this->assertSame(RawWeatherDataModel::SOURCE_METAR, (new MetarAPILibrary())->getSourceName());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function _buildLibrary(string $body): MetarAPILibrary
    {
        $mockResponse = $this->createMock(ResponseInterface::class);
        $mockResponse->method('getBody')->willReturn($body);

        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willReturn($mockResponse);

        $library = new MetarAPILibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        return $library;
    }
}
