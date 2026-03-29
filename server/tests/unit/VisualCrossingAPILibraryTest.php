<?php

use App\Libraries\VisualCrossingAPILibrary;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\CURLRequest;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\I18n\Time;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Libraries\VisualCrossingAPILibrary.
 *
 * @internal
 */
final class VisualCrossingAPILibraryTest extends CIUnitTestCase
{
    // -------------------------------------------------------------------------
    // convertWeatherCondition (static, pure logic)
    // -------------------------------------------------------------------------

    public function testConvertWeatherConditionKnownSingleCondition(): void
    {
        $this->assertSame(800, VisualCrossingAPILibrary::convertWeatherCondition('Clear'));
        $this->assertSame(741, VisualCrossingAPILibrary::convertWeatherCondition('Fog'));
        $this->assertSame(501, VisualCrossingAPILibrary::convertWeatherCondition('Rain'));
        $this->assertSame(601, VisualCrossingAPILibrary::convertWeatherCondition('Snow'));
    }

    public function testConvertWeatherConditionPicksFirstTokenWhenCommaDelimited(): void
    {
        // "Rain, Overcast" → picks "Rain" → 501
        $this->assertSame(501, VisualCrossingAPILibrary::convertWeatherCondition('Rain, Overcast'));
    }

    public function testConvertWeatherConditionUnknownConditionReturnsNull(): void
    {
        $this->assertNull(VisualCrossingAPILibrary::convertWeatherCondition('Unknown Condition'));
    }

    public function testConvertWeatherConditionPartiallyCloudyMapped(): void
    {
        $this->assertSame(802, VisualCrossingAPILibrary::convertWeatherCondition('Partially cloudy'));
    }

    public function testConvertWeatherConditionOvercastMapped(): void
    {
        $this->assertSame(804, VisualCrossingAPILibrary::convertWeatherCondition('Overcast'));
    }

    public function testConvertWeatherConditionThunderstormMapped(): void
    {
        $this->assertSame(211, VisualCrossingAPILibrary::convertWeatherCondition('Thunderstorm'));
    }

    // -------------------------------------------------------------------------
    // getForecastWeatherData always returns false (not implemented)
    // -------------------------------------------------------------------------

    public function testGetForecastWeatherDataAlwaysReturnsFalse(): void
    {
        $library = new VisualCrossingAPILibrary();
        $this->assertFalse($library->getForecastWeatherData());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function _buildLibraryWithMockClient(string $responseBody): VisualCrossingAPILibrary
    {
        $mockResponse = $this->createMock(ResponseInterface::class);
        $mockResponse->method('getBody')->willReturn($responseBody);

        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willReturn($mockResponse);

        $library = new VisualCrossingAPILibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        return $library;
    }

    // -------------------------------------------------------------------------
    // getWeatherData
    // -------------------------------------------------------------------------

    public function testGetWeatherDataReturnsMappedArray(): void
    {
        helper('weather');

        $payload = json_encode([
            'currentConditions' => [
                'temp'            => 22.0,
                'dew'             => 13.0,
                'feelslike'       => 21.0,
                'pressure'        => 1014.0,
                'humidity'        => 57.0,
                'visibility'      => 15.0,
                'windspeed'       => 18.0,   // km/h → kmh_to_ms
                'windgust'        => 28.0,   // km/h → kmh_to_ms
                'winddir'         => 250,
                'cloudcover'      => 20,
                'uvindex'         => 5.0,
                'solarenergy'     => 2.1,
                'solarradiation'  => 310.0,
                'precip'          => 0.0,
                'datetimeEpoch'   => 1700000000,
                'conditions'      => 'Clear',
            ],
        ]);

        $library = $this->_buildLibraryWithMockClient($payload);
        $result  = $library->getWeatherData();

        $this->assertIsArray($result);
        $this->assertEqualsWithDelta(22.0, (float) $result['temperature'], 0.001);
        $this->assertEqualsWithDelta(13.0, (float) $result['dew_point'],   0.001);
        $this->assertEqualsWithDelta(21.0, (float) $result['feels_like'],  0.001);
        $this->assertSame(1014,  $result['pressure']);
        // visibility = 15 * 1000 = 15000
        $this->assertSame(15000, $result['visibility']);
        // windspeed = 18 km/h → kmh_to_ms → 5 m/s
        $this->assertEqualsWithDelta(5.0, (float) $result['wind_speed'], 0.01);
        $this->assertSame(250,   $result['wind_deg']);
        $this->assertSame(20,    $result['clouds']);
        $this->assertEqualsWithDelta(5.0, (float) $result['uv_index'], 0.001);
        $this->assertSame(800,   $result['weather_id']); // 'Clear' → 800
        $this->assertSame(RawWeatherDataModel::SOURCE_VISUALCROSSING, $result['source']);
        $this->assertInstanceOf(Time::class, $result['date']);
    }

    public function testGetWeatherDataReturnsFalseOnHttpException(): void
    {
        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willThrowException(new \Exception('network error'));

        $library = new VisualCrossingAPILibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        $this->assertFalse($library->getWeatherData());
    }

    /**
     * An empty JSON array is falsy → getWeatherData returns false.
     */
    public function testGetWeatherDataReturnsFalseOnEmptyArrayBody(): void
    {
        $library = $this->_buildLibraryWithMockClient('[]');
        $this->assertFalse($library->getWeatherData());
    }
}
