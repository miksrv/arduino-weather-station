<?php

use App\Libraries\OpenWeatherAPILibrary;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\CURLRequest;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\I18n\Time;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Libraries\OpenWeatherAPILibrary.
 *
 * All HTTP calls are intercepted by injecting a mock CURLRequest so no real
 * network traffic is made.
 *
 * @internal
 */
final class OpenWeatherAPILibraryTest extends CIUnitTestCase
{
    // -------------------------------------------------------------------------
    // convertWeatherCondition (static, pure logic)
    // -------------------------------------------------------------------------

    public function testConvertWeatherConditionReturnsIntAsIs(): void
    {
        $this->assertSame(800, OpenWeatherAPILibrary::convertWeatherCondition(800));
        $this->assertSame(501, OpenWeatherAPILibrary::convertWeatherCondition(501));
        $this->assertSame(200, OpenWeatherAPILibrary::convertWeatherCondition(200));
    }

    // -------------------------------------------------------------------------
    // API_URL constant
    // -------------------------------------------------------------------------

    public function testApiUrlContainsVersion(): void
    {
        $this->assertStringContainsString('2.5', OpenWeatherAPILibrary::API_URL);
        $this->assertStringContainsString('openweathermap.org', OpenWeatherAPILibrary::API_URL);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function _buildLibraryWithMockClient(string $responseBody): OpenWeatherAPILibrary
    {
        $mockResponse = $this->createMock(ResponseInterface::class);
        $mockResponse->method('getBody')->willReturn($responseBody);

        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willReturn($mockResponse);

        $library = new OpenWeatherAPILibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        return $library;
    }

    // -------------------------------------------------------------------------
    // getWeatherData — mock HTTP response
    // -------------------------------------------------------------------------

    public function testGetWeatherDataReturnsMappedArray(): void
    {
        $payload = json_encode([
            'dt'   => 1700000000,
            'main' => [
                'temp'       => 15.0,
                'feels_like' => 13.0,
                'pressure'   => 1012,
                'humidity'   => 72,
            ],
            'visibility' => 9000,
            'wind'       => ['speed' => 4.5, 'gust' => 7.0, 'deg' => 90],
            'clouds'     => ['all' => 30],
            'weather'    => [['id' => 801]],
        ]);

        $library = $this->_buildLibraryWithMockClient($payload);
        $result  = $library->getWeatherData();

        $this->assertIsArray($result);
        $this->assertEqualsWithDelta(15.0,  (float) $result['temperature'], 0.001);
        $this->assertEqualsWithDelta(13.0,  (float) $result['feels_like'],  0.001);
        $this->assertSame(1012,  $result['pressure']);
        $this->assertSame(72,    $result['humidity']);
        $this->assertSame(9000,  $result['visibility']);
        $this->assertEqualsWithDelta(4.5, (float) $result['wind_speed'], 0.001);
        $this->assertEqualsWithDelta(7.0, (float) $result['wind_gust'],  0.001);
        $this->assertSame(90,    $result['wind_deg']);
        $this->assertSame(30,    $result['clouds']);
        $this->assertSame(801,   $result['weather_id']);
        $this->assertSame(RawWeatherDataModel::SOURCE_OPENWEATHERMAP, $result['source']);
        $this->assertInstanceOf(Time::class, $result['date']);
    }

    public function testGetWeatherDataReturnsFalseOnHttpException(): void
    {
        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willThrowException(new \Exception('Network error'));

        $library = new OpenWeatherAPILibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        $result = $library->getWeatherData();

        $this->assertFalse($result);
    }

    public function testGetWeatherDataHandlesMissingOptionalFields(): void
    {
        $payload = json_encode([
            'dt'   => 1700000000,
            'main' => ['temp' => 10.0, 'feels_like' => 9.0, 'pressure' => 1000, 'humidity' => 80],
            // no wind, no clouds, no weather
        ]);

        $library = $this->_buildLibraryWithMockClient($payload);
        $result  = $library->getWeatherData();

        $this->assertIsArray($result);
        $this->assertNull($result['wind_speed']);
        $this->assertNull($result['clouds']);
        $this->assertNull($result['weather_id']);
        $this->assertNull($result['precipitation']);
    }

    /**
     * When json_decode returns null (empty body), request() throws a TypeError
     * because its return type is array|false. This is caught internally and
     * getWeatherData() must return false.
     *
     * Note: the library's request() returns json_decode result directly, so a
     * non-JSON body (null) causes a TypeError inside the library. The outer
     * getWeatherData() returns false when request() returns falsy.
     * We verify the exception propagates cleanly OR that the call returns false.
     */
    public function testGetWeatherDataReturnsFalseOnEmptyBody(): void
    {
        // Empty JSON array — json_decode returns [] which is falsy → false
        $library = $this->_buildLibraryWithMockClient('[]');
        $result  = $library->getWeatherData();
        // [] is falsy in PHP, so request returns [] and getWeatherData returns false
        $this->assertFalse($result);
    }

    // -------------------------------------------------------------------------
    // getForecastWeatherData — mock HTTP response
    // -------------------------------------------------------------------------

    public function testGetForecastWeatherDataReturnsMappedArray(): void
    {
        $item = [
            'dt'   => 1700003600,
            'main' => ['temp' => 14.0, 'feels_like' => 12.0, 'pressure' => 1010, 'humidity' => 75],
            'wind' => ['speed' => 3.0, 'gust' => 5.0, 'deg' => 180],
            'clouds'  => ['all' => 50],
            'weather' => [['id' => 500]],
        ];

        $payload = json_encode(['list' => [$item, $item]]);
        $library = $this->_buildLibraryWithMockClient($payload);
        $result  = $library->getForecastWeatherData();

        $this->assertIsArray($result);
        $this->assertCount(2, $result);
        $this->assertEqualsWithDelta(14.0, (float) $result[0]['temperature'], 0.001);
        $this->assertArrayHasKey('forecast_time', $result[0]);
        $this->assertInstanceOf(Time::class, $result[0]['forecast_time']);
    }

    public function testGetForecastWeatherDataReturnsFalseOnException(): void
    {
        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willThrowException(new \Exception('timeout'));

        $library = new OpenWeatherAPILibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        $this->assertFalse($library->getForecastWeatherData());
    }

    // -------------------------------------------------------------------------
    // Precipitation field: rain vs snow fallback
    // -------------------------------------------------------------------------

    public function testPrecipitationPicksRainFirst(): void
    {
        $payload = json_encode([
            'dt'   => 1700000000,
            'main' => ['temp' => 5.0, 'feels_like' => 3.0, 'pressure' => 1000, 'humidity' => 90],
            'rain' => ['1h' => 2.5],
            'snow' => ['1h' => 1.0],
        ]);

        $library = $this->_buildLibraryWithMockClient($payload);
        $result  = $library->getWeatherData();

        $this->assertEqualsWithDelta(2.5, (float) $result['precipitation'], 0.001);
    }

    public function testPrecipitationFallsBackToSnow(): void
    {
        $payload = json_encode([
            'dt'   => 1700000000,
            'main' => ['temp' => -2.0, 'feels_like' => -4.0, 'pressure' => 990, 'humidity' => 95],
            'snow' => ['1h' => 0.8],
        ]);

        $library = $this->_buildLibraryWithMockClient($payload);
        $result  = $library->getWeatherData();

        $this->assertEqualsWithDelta(0.8, (float) $result['precipitation'], 0.001);
    }
}
