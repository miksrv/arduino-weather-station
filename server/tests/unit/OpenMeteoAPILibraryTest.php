<?php

use App\Libraries\OpenMeteoAPILibrary;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\CURLRequest;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\I18n\Time;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Libraries\OpenMeteoAPILibrary.
 *
 * OpenMeteoAPILibrary makes two HTTP calls per request (weather host +
 * air-quality host), so the mock CURLRequest routes its response based on
 * the requested URL rather than returning a single canned response.
 *
 * @internal
 */
final class OpenMeteoAPILibraryTest extends CIUnitTestCase
{
    // -------------------------------------------------------------------------
    // convertWeatherCondition (static, pure logic — no HTTP)
    // -------------------------------------------------------------------------

    public function testConvertWeatherConditionKnownCode(): void
    {
        $this->assertSame(800, OpenMeteoAPILibrary::convertWeatherCondition(0));  // Clear sky
        $this->assertSame(802, OpenMeteoAPILibrary::convertWeatherCondition(2));  // Partly cloudy
        $this->assertSame(804, OpenMeteoAPILibrary::convertWeatherCondition(3));  // Overcast
        $this->assertSame(211, OpenMeteoAPILibrary::convertWeatherCondition(95)); // Thunderstorm
        $this->assertSame(602, OpenMeteoAPILibrary::convertWeatherCondition(75)); // Heavy snow fall
    }

    public function testConvertWeatherConditionUnknownCodeReturnsNull(): void
    {
        $this->assertNull(OpenMeteoAPILibrary::convertWeatherCondition(9999));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Builds a library instance whose injected CURLRequest mock routes its
     * response by URL: requests to the air-quality host return $airQualityBody
     * (or throw $airQualityException), everything else (the weather host)
     * returns $weatherBody (or throws $weatherException).
     */
    private function _buildLibraryWithMockClient(
        ?string $weatherBody,
        ?string $airQualityBody,
        ?Exception $weatherException = null,
        ?Exception $airQualityException = null
    ): OpenMeteoAPILibrary {
        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willReturnCallback(
            function (string $method, string $url, array $options) use (
                $weatherBody,
                $airQualityBody,
                $weatherException,
                $airQualityException
            ): ResponseInterface {
                $isAirQuality = str_contains($url, 'air-quality-api');

                if ($isAirQuality && $airQualityException !== null) {
                    throw $airQualityException;
                }
                if (!$isAirQuality && $weatherException !== null) {
                    throw $weatherException;
                }

                $body = $isAirQuality ? $airQualityBody : $weatherBody;

                $mockResponse = $this->createMock(ResponseInterface::class);
                $mockResponse->method('getBody')->willReturn($body ?? '[]');

                return $mockResponse;
            }
        );

        $library = new OpenMeteoAPILibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        return $library;
    }

    private function _weatherCurrentPayload(): string
    {
        return json_encode([
            'current' => [
                'time'                  => '2026-07-12T05:30',
                'temperature_2m'        => 24.6,
                'relative_humidity_2m'  => 77,
                'apparent_temperature'  => 26.7,
                'dew_point_2m'          => 20.3,
                'pressure_msl'          => 1006.6,
                'precipitation'         => 0.0,
                'cloud_cover'           => 82,
                'visibility'            => 31920.0,
                'wind_speed_10m'        => 3.77,
                'wind_direction_10m'    => 68,
                'wind_gusts_10m'        => 9.4,
                'uv_index'              => 4.75,
                'shortwave_radiation'   => 437.0,
                'weather_code'          => 2,
            ],
        ]);
    }

    private function _airQualityCurrentPayload(): string
    {
        return json_encode([
            'current' => [
                'time'             => '2026-07-12T05:00',
                'pm10'             => 20.9,
                'pm2_5'            => 9.4,
                'carbon_monoxide'  => 119.0,
                'nitrogen_dioxide' => 2.1,
                'sulphur_dioxide'  => 1.2,
                'ozone'            => 81.0,
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // getWeatherData
    // -------------------------------------------------------------------------

    public function testGetWeatherDataReturnsMergedMappedArray(): void
    {
        $library = $this->_buildLibraryWithMockClient($this->_weatherCurrentPayload(), $this->_airQualityCurrentPayload());
        $result  = $library->getWeatherData();

        $this->assertIsArray($result);
        $this->assertEqualsWithDelta(24.6, (float) $result['temperature'], 0.001);
        $this->assertEqualsWithDelta(26.7, (float) $result['feels_like'], 0.001);
        $this->assertSame(1006, $result['pressure']);
        $this->assertEqualsWithDelta(77, (float) $result['humidity'], 0.001);
        $this->assertEqualsWithDelta(20.3, (float) $result['dew_point'], 0.001);
        $this->assertEqualsWithDelta(3.77, (float) $result['wind_speed'], 0.001);
        $this->assertSame(68, $result['wind_deg']);
        $this->assertEqualsWithDelta(9.4, (float) $result['wind_gust'], 0.001);
        $this->assertSame(82, $result['clouds']);
        $this->assertSame(31920, $result['visibility']);
        $this->assertEqualsWithDelta(4.75, (float) $result['uv_index'], 0.001);
        $this->assertEqualsWithDelta(437.0, (float) $result['sol_radiation'], 0.001);
        $this->assertNull($result['sol_energy']);
        $this->assertSame(802, $result['weather_id']); // WMO 2 → 802 Partly cloudy

        // Air quality side
        $this->assertEqualsWithDelta(9.4, (float) $result['pm2_5'], 0.001);
        $this->assertEqualsWithDelta(20.9, (float) $result['pm10'], 0.001);
        $this->assertEqualsWithDelta(119.0, (float) $result['co'], 0.001);
        $this->assertEqualsWithDelta(2.1, (float) $result['no2'], 0.001);
        $this->assertEqualsWithDelta(1.2, (float) $result['so2'], 0.001);
        $this->assertEqualsWithDelta(81.0, (float) $result['o3'], 0.001);

        $this->assertSame(RawWeatherDataModel::SOURCE_OPENMETEO, $result['source']);
        $this->assertInstanceOf(Time::class, $result['date']);
        // Weather's own 'time' takes precedence over air quality's 'time'
        $this->assertSame('2026-07-12 05:30:00', $result['date']->format('Y-m-d H:i:s'));
    }

    public function testGetWeatherDataDegradesGracefullyWhenAirQualityFails(): void
    {
        $library = $this->_buildLibraryWithMockClient(
            $this->_weatherCurrentPayload(),
            null,
            null,
            new Exception('air quality host unreachable')
        );

        $result = $library->getWeatherData();

        $this->assertIsArray($result);
        $this->assertEqualsWithDelta(24.6, (float) $result['temperature'], 0.001);
        $this->assertNull($result['pm2_5']);
        $this->assertNull($result['pm10']);
        $this->assertNull($result['co']);
        $this->assertNull($result['no2']);
        $this->assertNull($result['so2']);
        $this->assertNull($result['o3']);
        $this->assertSame(RawWeatherDataModel::SOURCE_OPENMETEO, $result['source']);
        $this->assertInstanceOf(Time::class, $result['date']);
    }

    public function testGetWeatherDataDegradesGracefullyWhenWeatherFails(): void
    {
        $library = $this->_buildLibraryWithMockClient(
            null,
            $this->_airQualityCurrentPayload(),
            new Exception('weather host unreachable'),
            null
        );

        $result = $library->getWeatherData();

        $this->assertIsArray($result);
        $this->assertNull($result['temperature']);
        $this->assertNull($result['wind_speed']);
        $this->assertNull($result['weather_id']);
        $this->assertEqualsWithDelta(9.4, (float) $result['pm2_5'], 0.001);
        $this->assertEqualsWithDelta(20.9, (float) $result['pm10'], 0.001);
        $this->assertSame(RawWeatherDataModel::SOURCE_OPENMETEO, $result['source']);
        // Falls back to air quality's own time since weather's is unavailable
        $this->assertInstanceOf(Time::class, $result['date']);
        $this->assertSame('2026-07-12 05:00:00', $result['date']->format('Y-m-d H:i:s'));
    }

    public function testGetWeatherDataReturnsFalseWhenBothHostsFail(): void
    {
        $library = $this->_buildLibraryWithMockClient(
            null,
            null,
            new Exception('weather host unreachable'),
            new Exception('air quality host unreachable')
        );

        $this->assertFalse($library->getWeatherData());
    }

    // -------------------------------------------------------------------------
    // getForecastWeatherData
    // -------------------------------------------------------------------------

    private function _weatherHourlyPayload(): string
    {
        return json_encode([
            'hourly' => [
                'time'                 => ['2026-07-12T00:00', '2026-07-12T01:00', '2026-07-12T02:00', '2026-07-12T03:00'],
                'temperature_2m'       => [20.0, 19.5, 19.0, 18.5],
                'relative_humidity_2m' => [80, 81, 82, 83],
                'apparent_temperature' => [21.0, 20.5, 20.0, 19.5],
                'dew_point_2m'         => [16.0, 16.1, 16.2, 16.3],
                'pressure_msl'         => [1008.0, 1008.1, 1008.2, 1008.3],
                'precipitation'        => [0.0, 0.0, 0.1, 0.2],
                'cloud_cover'          => [10, 20, 30, 40],
                'visibility'           => [20000.0, 20000.0, 15000.0, 15000.0],
                'wind_speed_10m'       => [2.0, 2.1, 2.2, 2.3],
                'wind_direction_10m'   => [90, 91, 92, 93],
                'wind_gusts_10m'       => [3.0, 3.1, 3.2, 3.3],
                'uv_index'             => [0.0, 0.0, 0.0, 0.0],
                'shortwave_radiation'  => [0.0, 0.0, 0.0, 0.0],
                'weather_code'         => [0, 1, 2, 3],
            ],
        ]);
    }

    /**
     * Deliberately covers only the first 2 of the 4 weather-hourly
     * timestamps, simulating Open-Meteo's shorter air-quality forecast
     * horizon.
     */
    private function _airQualityHourlyPayload(): string
    {
        return json_encode([
            'hourly' => [
                'time'             => ['2026-07-12T00:00', '2026-07-12T01:00'],
                'pm10'             => [15.0, 16.0],
                'pm2_5'            => [8.0, 8.5],
                'carbon_monoxide'  => [100.0, 101.0],
                'nitrogen_dioxide' => [2.0, 2.1],
                'sulphur_dioxide'  => [1.0, 1.1],
                'ozone'            => [70.0, 71.0],
            ],
        ]);
    }

    public function testGetForecastWeatherDataReturnsMergedMappedArray(): void
    {
        $library = $this->_buildLibraryWithMockClient($this->_weatherHourlyPayload(), $this->_airQualityHourlyPayload());
        $result  = $library->getForecastWeatherData();

        $this->assertIsArray($result);
        $this->assertCount(4, $result);

        // Row 0 — fully covered by both weather and air quality
        $this->assertEqualsWithDelta(20.0, (float) $result[0]['temperature'], 0.001);
        $this->assertInstanceOf(Time::class, $result[0]['forecast_time']);
        $this->assertSame('2026-07-12 00:00:00', $result[0]['forecast_time']->format('Y-m-d H:i:s'));
        $this->assertSame(800, $result[0]['weather_id']); // WMO 0 → 800
        $this->assertEqualsWithDelta(8.0, (float) $result[0]['pm2_5'], 0.001);
        $this->assertEqualsWithDelta(15.0, (float) $result[0]['pm10'], 0.001);

        // Row 1 — also covered
        $this->assertSame(801, $result[1]['weather_id']); // WMO 1 → 801
        $this->assertEqualsWithDelta(8.5, (float) $result[1]['pm2_5'], 0.001);

        // Row 2 — beyond air quality forecast horizon: weather present, air quality null
        $this->assertEqualsWithDelta(19.0, (float) $result[2]['temperature'], 0.001);
        $this->assertSame(802, $result[2]['weather_id']); // WMO 2 → 802
        $this->assertNull($result[2]['pm2_5']);
        $this->assertNull($result[2]['pm10']);
        $this->assertNull($result[2]['co']);
        $this->assertNull($result[2]['no2']);
        $this->assertNull($result[2]['so2']);
        $this->assertNull($result[2]['o3']);

        // Row 3 — also beyond horizon
        $this->assertEqualsWithDelta(18.5, (float) $result[3]['temperature'], 0.001);
        $this->assertSame(804, $result[3]['weather_id']); // WMO 3 → 804
        $this->assertNull($result[3]['pm2_5']);
    }

    public function testGetForecastWeatherDataDegradesGracefullyWhenAirQualityFails(): void
    {
        $library = $this->_buildLibraryWithMockClient(
            $this->_weatherHourlyPayload(),
            null,
            null,
            new Exception('air quality host unreachable')
        );

        $result = $library->getForecastWeatherData();

        $this->assertIsArray($result);
        $this->assertCount(4, $result);

        foreach ($result as $row) {
            $this->assertNull($row['pm2_5']);
            $this->assertNull($row['pm10']);
        }

        $this->assertEqualsWithDelta(20.0, (float) $result[0]['temperature'], 0.001);
    }

    public function testGetForecastWeatherDataReturnsFalseWhenWeatherFails(): void
    {
        $library = $this->_buildLibraryWithMockClient(
            null,
            $this->_airQualityHourlyPayload(),
            new Exception('weather host unreachable'),
            null
        );

        $this->assertFalse($library->getForecastWeatherData());
    }
}
