<?php

use App\Libraries\WeatherAPILibrary;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\CURLRequest;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\I18n\Time;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Libraries\WeatherAPILibrary.
 *
 * @internal
 */
final class WeatherAPILibraryTest extends CIUnitTestCase
{
    // -------------------------------------------------------------------------
    // convertWeatherCondition (static, pure logic — no HTTP)
    // -------------------------------------------------------------------------

    public function testConvertWeatherConditionKnownCode(): void
    {
        // 1000 → 800 (Clear sky)
        $this->assertSame(800, WeatherAPILibrary::convertWeatherCondition(1000));
        // 1009 → 804 (Overcast)
        $this->assertSame(804, WeatherAPILibrary::convertWeatherCondition(1009));
        // 1087 → 211 (Thunderstorm)
        $this->assertSame(211, WeatherAPILibrary::convertWeatherCondition(1087));
    }

    public function testConvertWeatherConditionUnknownCodeReturnsNull(): void
    {
        $this->assertNull(WeatherAPILibrary::convertWeatherCondition(9999));
    }

    public function testConvertWeatherConditionSnowCode(): void
    {
        // 1225 → 602 Heavy snow
        $this->assertSame(602, WeatherAPILibrary::convertWeatherCondition(1225));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function _buildLibraryWithMockClient(string $responseBody): WeatherAPILibrary
    {
        $mockResponse = $this->createMock(ResponseInterface::class);
        $mockResponse->method('getBody')->willReturn($responseBody);

        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willReturn($mockResponse);

        $library = new WeatherAPILibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        return $library;
    }

    // -------------------------------------------------------------------------
    // getWeatherData
    // -------------------------------------------------------------------------

    public function testGetWeatherDataReturnsMappedArray(): void
    {
        $payload = json_encode([
            'current' => [
                'temp_c'              => 18.5,
                'dewpoint_c'          => 10.0,
                'feelslike_c'         => 17.0,
                'pressure_mb'         => 1015,
                'humidity'            => 68,
                'vis_km'              => 10,
                'wind_kph'            => 14.4,
                'gust_mph'            => 20.0,
                'wind_degree'         => 270,
                'cloud'               => 25,
                'uv'                  => 4.0,
                'precip_mm'           => 0.0,
                'last_updated_epoch'  => 1700000000,
                'condition'           => ['code' => 1000],
            ],
        ]);

        $library = $this->_buildLibraryWithMockClient($payload);
        $result  = $library->getWeatherData();

        $this->assertIsArray($result);
        $this->assertEqualsWithDelta(18.5, (float) $result['temperature'], 0.001);
        $this->assertEqualsWithDelta(10.0, (float) $result['dew_point'],   0.001);
        $this->assertEqualsWithDelta(17.0, (float) $result['feels_like'],  0.001);
        $this->assertSame(1015, $result['pressure']);
        // vis_km=10 → 10*1000 = 10000
        $this->assertSame(10000, $result['visibility']);
        // wind_kph=14.4 → kmh_to_ms → 4.0
        $this->assertEqualsWithDelta(4.0, (float) $result['wind_speed'], 0.01);
        $this->assertSame(270,   $result['wind_deg']);
        $this->assertSame(800,   $result['weather_id']);
        $this->assertSame(RawWeatherDataModel::SOURCE_WEATHERAPI, $result['source']);
        $this->assertInstanceOf(Time::class, $result['date']);
    }

    public function testGetWeatherDataReturnsFalseOnException(): void
    {
        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willThrowException(new \Exception('timeout'));

        $library = new WeatherAPILibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        $this->assertFalse($library->getWeatherData());
    }

    /**
     * An empty JSON array response — getWeatherData returns false because
     * request() returns [] which is falsy.
     */
    public function testGetWeatherDataReturnsFalseOnEmptyArrayResponse(): void
    {
        $library = $this->_buildLibraryWithMockClient('[]');
        $this->assertFalse($library->getWeatherData());
    }

    // -------------------------------------------------------------------------
    // getForecastWeatherData
    // -------------------------------------------------------------------------

    public function testGetForecastWeatherDataReturnsMappedArray(): void
    {
        $hour = [
            'temp_c'       => 12.0,
            'dewpoint_c'   => 8.0,
            'feelslike_c'  => 10.0,
            'pressure_mb'  => 1008,
            'humidity'     => 80.0,
            'vis_km'       => 8,
            'wind_kph'     => 18.0,
            'gust_mph'     => 25.0,
            'wind_degree'  => 90,
            'cloud'        => 70,
            'uv'           => 1.0,
            'precip_mm'    => 1.5,
            'time_epoch'   => 1700007200,
            'condition'    => ['code' => 1003],
        ];

        $payload = json_encode([
            'forecast' => [
                'forecastday' => [
                    ['hour' => [$hour, $hour]],
                ],
            ],
        ]);

        $library = $this->_buildLibraryWithMockClient($payload);
        $result  = $library->getForecastWeatherData();

        $this->assertIsArray($result);
        $this->assertCount(2, $result);
        $this->assertEqualsWithDelta(12.0, (float) $result[0]['temperature'], 0.001);
        $this->assertArrayHasKey('forecast_time', $result[0]);
        $this->assertInstanceOf(Time::class, $result[0]['forecast_time']);
        // 1003 → 801
        $this->assertSame(801, $result[0]['weather_id']);
    }

    public function testGetForecastWeatherDataReturnsFalseOnException(): void
    {
        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willThrowException(new \Exception('error'));

        $library = new WeatherAPILibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        $this->assertFalse($library->getForecastWeatherData());
    }

    /**
     * An empty array response causes getForecastWeatherData to return false.
     */
    public function testGetForecastWeatherDataReturnsFalseOnEmptyArrayResponse(): void
    {
        $library = $this->_buildLibraryWithMockClient('[]');
        $this->assertFalse($library->getForecastWeatherData());
    }
}
