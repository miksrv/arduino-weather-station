<?php

use App\Controllers\Current;
use App\Models\ForecastWeatherDataModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\ControllerTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests for App\Controllers\Current.
 *
 * Uses ControllerTestTrait for direct controller invocation with proper CI4
 * service initialisation. FeatureTestTrait is used for route-level smoke tests.
 *
 * @internal
 */
final class CurrentControllerTest extends CIUnitTestCase
{
    use ControllerTestTrait, FeatureTestTrait {
        ControllerTestTrait::withBody insteadof FeatureTestTrait;
        FeatureTestTrait::withBody as featureWithBody;
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpControllerTestTrait();
    }

    // -------------------------------------------------------------------------
    // getCurrentWeather
    // -------------------------------------------------------------------------

    /**
     * When the model returns a full row, getCurrentWeather must respond 200 with JSON.
     */
    public function testGetCurrentWeatherReturns200WithData(): void
    {
        $fakeData = [
            'date'        => '2024-06-20 12:00:00',
            'temperature' => 25.0,
            'pressure'    => 1013,
            'humidity'    => 55,
        ];

        $mockModel = $this->createMock(RawWeatherDataModel::class);
        $mockModel->method('getCurrentActualWeatherData')->willReturn($fakeData);

        $this->controller(Current::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockModel);

        $result = $this->execute('getCurrentWeather');

        $this->assertSame(200, $result->response()->getStatusCode());
        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertIsArray($body);
        $this->assertArrayHasKey('temperature', $body);
        $this->assertEqualsWithDelta(25.0, (float) $body['temperature'], 0.001);
    }

    /**
     * When the model returns an empty array, getCurrentWeather responds 200
     * because WeatherData handles empty arrays gracefully.
     */
    public function testGetCurrentWeatherHandlesEmptyDataRow(): void
    {
        $mockModel = $this->createMock(RawWeatherDataModel::class);
        $mockModel->method('getCurrentActualWeatherData')->willReturn([]);

        $this->controller(Current::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockModel);

        $result = $this->execute('getCurrentWeather');
        $this->assertSame(200, $result->response()->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // Data-freshness fields (lastUpdated / isStale)
    // -------------------------------------------------------------------------

    /**
     * A reading older than EventFeedBuilder::SYSTEM_FRESHNESS_MINUTES must be
     * flagged as stale, and lastUpdated must be a populated ISO 8601 string.
     */
    public function testGetCurrentWeatherFlagsStaleDataAsTrue(): void
    {
        $oldDate  = (new \DateTime('-1 hour'))->format('Y-m-d H:i:s');
        $fakeData = [
            'date'        => $oldDate,
            'temperature' => 12.3,
        ];

        $mockModel = $this->createMock(RawWeatherDataModel::class);
        $mockModel->method('getCurrentActualWeatherData')->willReturn($fakeData);

        $this->controller(Current::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockModel);

        $result = $this->execute('getCurrentWeather');

        $this->assertSame(200, $result->response()->getStatusCode());
        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertTrue($body['isStale']);
        $this->assertIsString($body['lastUpdated']);
    }

    /**
     * A reading within the freshness window must be flagged as not stale.
     */
    public function testGetCurrentWeatherFlagsFreshDataAsNotStale(): void
    {
        $freshDate = (new \DateTime('-1 minute'))->format('Y-m-d H:i:s');
        $fakeData  = [
            'date'        => $freshDate,
            'temperature' => 12.3,
        ];

        $mockModel = $this->createMock(RawWeatherDataModel::class);
        $mockModel->method('getCurrentActualWeatherData')->willReturn($fakeData);

        $this->controller(Current::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockModel);

        $result = $this->execute('getCurrentWeather');

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertFalse($body['isStale']);
    }

    /**
     * When there is no data at all (empty array from the model), the response
     * must still be a valid 200 JSON body with isStale = true and no lastUpdated key.
     */
    public function testGetCurrentWeatherFlagsMissingDataAsStale(): void
    {
        $mockModel = $this->createMock(RawWeatherDataModel::class);
        $mockModel->method('getCurrentActualWeatherData')->willReturn([]);

        $this->controller(Current::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockModel);

        $result = $this->execute('getCurrentWeather');

        $this->assertSame(200, $result->response()->getStatusCode());
        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertIsArray($body);
        $this->assertTrue($body['isStale']);
        $this->assertArrayNotHasKey('lastUpdated', $body);
    }

    /**
     * A Throwable that is not an Exception (e.g. TypeError, as previously thrown
     * by array_merge() receiving a null argument when the sensor had not
     * reported for ~30 minutes) must be caught and turned into a valid JSON
     * error response instead of an unhandled 500.
     */
    public function testGetCurrentWeatherHandlesTypeErrorFromModelGracefully(): void
    {
        $mockModel = $this->createMock(RawWeatherDataModel::class);
        $mockModel->method('getCurrentActualWeatherData')->willThrowException(
            new \TypeError('array_merge(): Argument #2 must be of type array, null given')
        );

        $this->controller(Current::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockModel);

        $result = $this->execute('getCurrentWeather');

        $this->assertSame(500, $result->response()->getStatusCode());
        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertIsArray($body);
    }

    // -------------------------------------------------------------------------
    // _formatWeatherDataToText (via ReflectionMethod)
    // -------------------------------------------------------------------------

    /**
     * _formatWeatherDataToText must produce "dataGMTTime=" on line 1
     * and include all non-date key=value pairs.
     */
    public function testFormatWeatherDataToTextContainsExpectedLines(): void
    {
        $fakeData = [
            'date'        => '2024-01-15 10:30:00',
            'temperature' => 5.0,
            'pressure'    => 1020,
        ];

        $this->controller(Current::class);

        $method = new \ReflectionMethod($this->controller, '_formatWeatherDataToText');
        $method->setAccessible(true);
        $text = $method->invoke($this->controller, $fakeData, '1');

        $this->assertStringContainsString('dataGMTTime=',  $text);
        $this->assertStringContainsString('temperature=',  $text);
        $this->assertStringContainsString('pressure=',     $text);
        $this->assertStringContainsString('forecast=1',    $text);
    }

    /**
     * The 'date' key must NOT appear as a bare key=value line; only as 'dataGMTTime='.
     */
    public function testFormatWeatherDataToTextOmitsDateKey(): void
    {
        $fakeData = [
            'date'        => '2024-01-15 10:30:00',
            'temperature' => 10.0,
        ];

        $this->controller(Current::class);

        $method = new \ReflectionMethod($this->controller, '_formatWeatherDataToText');
        $method->setAccessible(true);
        $text = $method->invoke($this->controller, $fakeData, null);

        $this->assertStringNotContainsString("\ndate=",  $text);
        $this->assertStringContainsString('dataGMTTime=', $text);
    }

    /**
     * When forecast parameter is null, "forecast=" must not appear in the output.
     */
    public function testFormatWeatherDataToTextOmitsForecastLineWhenNull(): void
    {
        $fakeData = [
            'date'        => '2024-01-15 10:30:00',
            'temperature' => 10.0,
        ];

        $this->controller(Current::class);

        $method = new \ReflectionMethod($this->controller, '_formatWeatherDataToText');
        $method->setAccessible(true);
        $text = $method->invoke($this->controller, $fakeData, null);

        $this->assertStringNotContainsString('forecast=', $text);
    }

    /**
     * Precipitation and wind must also be emitted under the INDI Weather
     * Watcher default key names, otherwise the observatory never sees rain or wind.
     */
    public function testFormatWeatherDataToTextAddsWatcherKeyAliases(): void
    {
        $fakeData = [
            'date'          => '2024-01-15 10:30:00',
            'precipitation' => 0.4,
            'wind_speed'    => 3.2,
            'wind_gust'     => 7.5,
        ];

        $this->controller(Current::class);

        $method = new \ReflectionMethod($this->controller, '_formatWeatherDataToText');
        $method->setAccessible(true);
        $text = $method->invoke($this->controller, $fakeData, 1);

        $this->assertStringContainsString("precipitation=0.4\n", $text);
        $this->assertStringContainsString("precip=0.4\n", $text);
        $this->assertStringContainsString("wind_speed=3.2\n", $text);
        $this->assertStringContainsString("wind=3.2\n", $text);
        $this->assertStringContainsString("wind_gust=7.5\n", $text);
        $this->assertStringContainsString("gust=7.5\n", $text);
    }

    /**
     * Aliases are only added for fields that are present.
     */
    public function testFormatWeatherDataToTextSkipsAliasesForMissingFields(): void
    {
        $fakeData = [
            'date'        => '2024-01-15 10:30:00',
            'temperature' => 5.0,
        ];

        $this->controller(Current::class);

        $method = new \ReflectionMethod($this->controller, '_formatWeatherDataToText');
        $method->setAccessible(true);
        $text = $method->invoke($this->controller, $fakeData, 1);

        $this->assertStringNotContainsString('precip=', $text);
        $this->assertStringNotContainsString("\nwind=", $text);
        $this->assertStringNotContainsString("\ngust=", $text);
    }

    /**
     * Empty values must be left out: the Weather Watcher parser would read the
     * next line as their value and lose that key.
     */
    public function testFormatWeatherDataToTextSkipsEmptyValues(): void
    {
        $fakeData = [
            'date'          => '2024-01-15 10:30:00',
            'precipitation' => null,
            'clouds'        => 80,
            'pm2_5'         => '',
            'humidity'      => 60,
        ];

        $this->controller(Current::class);

        $method = new \ReflectionMethod($this->controller, '_formatWeatherDataToText');
        $method->setAccessible(true);
        $text = $method->invoke($this->controller, $fakeData, 1);

        $this->assertStringNotContainsString('precipitation=', $text);
        $this->assertStringNotContainsString('precip=', $text);
        $this->assertStringNotContainsString('pm2_5=', $text);
        $this->assertStringContainsString("clouds=80\n", $text);
        $this->assertStringContainsString("humidity=60\n", $text);
        $this->assertDoesNotMatchRegularExpression('/=\R/', $text);
    }

    // -------------------------------------------------------------------------
    // getCurrentTextWeather
    // -------------------------------------------------------------------------

    /**
     * Runs getCurrentTextWeather against mocked models.
     *
     * @param array<int, array<string, mixed>> $rawRows      Rows returned by getRowsSince().
     * @param array<int, array<string, mixed>> $forecastRows Rows returned by getSourceRowsAhead().
     */
    private function _textWeather(array $rawRows, array $forecastRows): \CodeIgniter\HTTP\ResponseInterface
    {
        $mockWeatherModel = $this->createMock(RawWeatherDataModel::class);
        $mockWeatherModel->method('getCurrentActualWeatherData')->willReturn([
            'date'          => gmdate('Y-m-d H:i:s', time() - 60),
            'temperature'   => 8.0,
            'precipitation' => 3.0,
            'clouds'        => 20,
            'wind_speed'    => 15.0,
            'wind_gust'     => 25.0,
            'pm2_5'         => null,
        ]);
        $mockWeatherModel->method('getRowsSince')->willReturn($rawRows);

        $mockForecastModel = $this->createMock(ForecastWeatherDataModel::class);
        $mockForecastModel->method('getSourceRowsAhead')->willReturn($forecastRows);

        $this->controller(Current::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockWeatherModel);
        $this->setPrivateProperty($this->controller, 'forecastModel', $mockForecastModel);

        return $this->execute('getCurrentTextWeather')->response();
    }

    /**
     * Precipitation, wind and gust are replaced by the confirmed values: a single
     * API source reporting rain or storm wind does not reach the observatory.
     */
    public function testGetCurrentTextWeatherReportsConfirmedValuesOnly(): void
    {
        $recent = gmdate('Y-m-d H:i:s', time() - 600);

        $response = $this->_textWeather([
            ['date' => $recent, 'source' => 'OpenWeatherMap', 'precipitation' => 3.0, 'wind_speed' => 15.0, 'wind_gust' => 25.0],
            ['date' => $recent, 'source' => 'WeatherAPI', 'precipitation' => 0.0, 'wind_speed' => 3.0, 'wind_gust' => 5.0],
            ['date' => $recent, 'source' => 'CustomStation', 'wind_speed' => 2.0],
        ], []);

        $text = (string) $response->getBody();

        $this->assertSame(200, $response->getStatusCode());
        $this->assertStringContainsString("precipitation=0\n", $text);
        $this->assertStringContainsString("clouds=0\n", $text);
        $this->assertStringContainsString("wind_speed=3\n", $text);
        $this->assertStringContainsString("wind_gust=5\n", $text);
        $this->assertStringContainsString("forecast=1\n", $text);
        $this->assertStringContainsString("temperature=8\n", $text);
        $this->assertStringNotContainsString('pm2_5=', $text);
    }

    /**
     * The keys the driver reads must always be present, also without any data:
     * the driver only creates the parameters whose keys it sees when it connects.
     */
    public function testGetCurrentTextWeatherAlwaysEmitsSafetyKeys(): void
    {
        $text = (string) $this->_textWeather([], [])->getBody();

        foreach (['precipitation', 'clouds', 'wind_speed', 'wind_gust', 'forecast'] as $key) {
            $this->assertMatchesRegularExpression('/^' . $key . '=-?\d/m', $text, $key);
        }
    }

    /**
     * Rows arrive from the model as WeatherDataEntity objects; their raw UTC
     * dates must be read as such.
     */
    public function testGetCurrentTextWeatherReadsEntityRows(): void
    {
        $recent = gmdate('Y-m-d H:i:s', time() - 600);
        $rows   = [];

        foreach (['OpenWeatherMap', 'WeatherAPI'] as $source) {
            $entity = new \App\Entities\WeatherDataEntity();
            $entity->injectRawData(['date' => $recent, 'source' => $source, 'precipitation' => '0.5', 'clouds' => '90']);
            $rows[] = $entity;
        }

        $text = (string) $this->_textWeather($rows, [])->getBody();

        $this->assertStringContainsString("precipitation=0.5\n", $text);
        $this->assertStringContainsString("clouds=90\n", $text);
    }

    /**
     * Precipitation forecast by two sources turns the forecast flag unsafe.
     */
    public function testGetCurrentTextWeatherFlagsConfirmedForecast(): void
    {
        $nextHour = gmdate('Y-m-d H:00:00', time() + 3600);

        $response = $this->_textWeather([], [
            ['forecast_time' => $nextHour, 'source' => 'WeatherAPI', 'precipitation' => 0.4],
            ['forecast_time' => $nextHour, 'source' => 'OpenMeteo', 'precipitation' => 0.2],
        ]);

        $this->assertStringContainsString("forecast=-1\n", (string) $response->getBody());
    }

    /**
     * The feed drives the observatory: it must be plain text and never cached.
     */
    public function testGetCurrentTextWeatherIsPlainTextAndNotCached(): void
    {
        $response = $this->_textWeather([], []);

        $this->assertStringContainsString('text/plain', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('no-store', $response->getHeaderLine('Cache-Control'));
        $this->assertSame('Thu, 01 Jan 1970 00:00:00 GMT', $response->getHeaderLine('Expires'));
    }

    /**
     * A failure while reading the confirmation data is an error response, not
     * a feed with made-up values.
     */
    public function testGetCurrentTextWeatherFailsWhenSafetyDataFails(): void
    {
        $mockWeatherModel = $this->createMock(RawWeatherDataModel::class);
        $mockWeatherModel->method('getCurrentActualWeatherData')->willReturn(['date' => '2024-01-15 10:30:00']);
        $mockWeatherModel->method('getRowsSince')->willThrowException(new \RuntimeException('db down'));

        $this->controller(Current::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockWeatherModel);

        $this->assertSame(500, $this->execute('getCurrentTextWeather')->response()->getStatusCode());
    }

    /**
     * When next-forecast precipitation > 0, forecast value should be -1 (rain coming).
     * We test this by invoking _formatWeatherDataToText with '-1'.
     */
    public function testFormatWeatherDataToTextWithNegativeForecast(): void
    {
        $fakeData = [
            'date'        => '2024-01-15 10:30:00',
            'temperature' => 5.0,
        ];

        $this->controller(Current::class);

        $method = new \ReflectionMethod($this->controller, '_formatWeatherDataToText');
        $method->setAccessible(true);
        $text = $method->invoke($this->controller, $fakeData, '-1');

        $this->assertStringContainsString('forecast=-1', $text);
    }

    // -------------------------------------------------------------------------
    // Route-level smoke test (FeatureTestTrait)
    // -------------------------------------------------------------------------

    public function testCurrentRouteIsRegistered(): void
    {
        // Route must exist — any status other than 404 is acceptable
        try {
            $result = $this->get('current');
            $this->assertNotSame(404, $result->response()->getStatusCode());
        } catch (\Throwable $e) {
            $this->assertNotInstanceOf(\CodeIgniter\Exceptions\PageNotFoundException::class, $e);
        }
    }

    public function testCurrentTextRouteIsRegistered(): void
    {
        try {
            $result = $this->get('current/text');
            $this->assertNotSame(404, $result->response()->getStatusCode());
        } catch (\Throwable $e) {
            $this->assertNotInstanceOf(\CodeIgniter\Exceptions\PageNotFoundException::class, $e);
        }
    }
}
