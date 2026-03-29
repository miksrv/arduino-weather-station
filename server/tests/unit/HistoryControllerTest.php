<?php

use App\Controllers\History;
use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\ControllerTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests for App\Controllers\History.
 *
 * Uses ControllerTestTrait for happy-path tests with mocked models.
 *
 * @internal
 */
final class HistoryControllerTest extends CIUnitTestCase
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
    // _getData() validation - returns 400 error responses
    // -------------------------------------------------------------------------

    /**
     * Missing both dates returns 400 error.
     */
    public function testMissingBothDatesReturns400(): void
    {
        $this->controller(History::class);
        $this->request->setMethod('GET');
        $this->request->setGlobal('get', []);

        $result = $this->execute('getHistoryWeather');
        $this->assertSame(400, $result->response()->getStatusCode());
    }

    public function testMissingStartDateReturns400(): void
    {
        $this->controller(History::class);
        $this->request->setMethod('GET');
        parse_str('end_date=2024-01-31', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHistoryWeather');
        $this->assertSame(400, $result->response()->getStatusCode());
    }

    public function testMissingEndDateReturns400(): void
    {
        $this->controller(History::class);
        $this->request->setMethod('GET');
        parse_str('start_date=2024-01-01', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHistoryWeather');
        $this->assertSame(400, $result->response()->getStatusCode());
    }

    public function testFutureDateReturns400(): void
    {
        $this->controller(History::class);
        $this->request->setMethod('GET');
        parse_str('start_date=2099-01-01&end_date=2099-01-31', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHistoryWeather');
        $this->assertSame(400, $result->response()->getStatusCode());
    }

    /**
     * SEC-07: End-date in the future must also be rejected with 400.
     */
    public function testFutureEndDateReturns400(): void
    {
        $this->controller(History::class);
        $this->request->setMethod('GET');
        // start_date is in the past, end_date is far in the future
        parse_str('start_date=2023-01-01&end_date=2099-12-31', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHistoryWeather');
        $this->assertSame(400, $result->response()->getStatusCode());
    }

    /**
     * SEC-14: Date range exceeding 366 days must be rejected with 400.
     */
    public function testDateRangeExceeding366DaysReturns400(): void
    {
        $this->controller(History::class);
        $this->request->setMethod('GET');
        // 400-day range
        parse_str('start_date=2022-01-01&end_date=2023-02-05', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHistoryWeather');
        $this->assertSame(400, $result->response()->getStatusCode());
    }

    public function testDateBefore2020Returns400(): void
    {
        $this->controller(History::class);
        $this->request->setMethod('GET');
        parse_str('start_date=2019-06-01&end_date=2019-06-30', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHistoryWeather');
        $this->assertSame(400, $result->response()->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // getHistoryWeather — happy path with mocked model (ControllerTestTrait)
    // -------------------------------------------------------------------------

    /**
     * ≤1-day range: uses RawWeatherDataModel. Returns 200 with JSON array.
     */
    public function testGetHistoryWeatherReturns200WithData(): void
    {
        $fakeRow = ['date' => '2023-01-01 10:00:00', 'temperature' => 3.5, 'pressure' => 1008];

        $mockRaw = $this->createMock(RawWeatherDataModel::class);
        $mockRaw->method('getWeatherHistoryGrouped')->willReturn([$fakeRow]);

        $this->controller(History::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockRaw);

        $this->request->setMethod('GET');
        parse_str('start_date=2023-01-01&end_date=2023-01-02', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHistoryWeather');
        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertIsArray($body);
        $this->assertCount(1, $body);
    }

    /**
     * When model returns empty array, response is still 200 with [].
     */
    public function testGetHistoryWeatherReturns200WithEmptyData(): void
    {
        $mockRaw = $this->createMock(RawWeatherDataModel::class);
        $mockRaw->method('getWeatherHistoryGrouped')->willReturn([]);

        $this->controller(History::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockRaw);

        $this->request->setMethod('GET');
        parse_str('start_date=2023-01-01&end_date=2023-01-02', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHistoryWeather');
        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertIsArray($body);
        $this->assertCount(0, $body);
    }

    /**
     * >7-day range uses DailyAveragesModel.
     */
    public function testGetHistoryWeatherUsesHourlyModelForMediumRange(): void
    {
        $fakeRow = ['date' => '2023-01-01 10:00:00', 'temperature' => 3.5];

        $mockHourly = $this->createMock(HourlyAveragesModel::class);
        $mockHourly->method('getWeatherHistoryGrouped')->willReturn([$fakeRow]);

        $this->controller(History::class);
        $this->setPrivateProperty($this->controller, 'hourlyAveragesModel', $mockHourly);

        $this->request->setMethod('GET');
        // 3-day range → hourly model
        parse_str('start_date=2023-01-01&end_date=2023-01-04', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHistoryWeather');
        $this->assertSame(200, $result->response()->getStatusCode());
    }

    /**
     * >7-day range uses DailyAveragesModel.
     */
    public function testGetHistoryWeatherUsesDailyModelForLongRange(): void
    {
        $fakeRow = ['date' => '2023-01-01 00:00:00', 'temperature' => 3.5];

        $mockDaily = $this->createMock(DailyAveragesModel::class);
        $mockDaily->method('getWeatherHistoryGrouped')->willReturn([$fakeRow]);

        $this->controller(History::class);
        $this->setPrivateProperty($this->controller, 'dailyAveragesModel', $mockDaily);

        $this->request->setMethod('GET');
        // 10-day range → daily model
        parse_str('start_date=2023-01-01&end_date=2023-01-11', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHistoryWeather');
        $this->assertSame(200, $result->response()->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // getHistoryWeather — caching behaviour
    // -------------------------------------------------------------------------

    /**
     * When a cache entry already exists, getHistoryWeather() must use it without
     * hitting the model and still return a 200 JSON array.
     */
    public function testGetHistoryWeatherReturnsCachedDataWithout200(): void
    {
        $fakeRow  = ['date' => '2023-01-01 10:00:00', 'temperature' => 7.0];
        $cacheKey = 'history_' . md5('2023-01-01_2023-01-02');

        // Pre-seed the cache with the raw row array.
        cache()->save($cacheKey, [$fakeRow], 0);

        // Model must NOT be called when cache is warm.
        $mockRaw = $this->createMock(RawWeatherDataModel::class);
        $mockRaw->expects($this->never())->method('getWeatherHistoryGrouped');

        $this->controller(History::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockRaw);

        $this->request->setMethod('GET');
        parse_str('start_date=2023-01-01&end_date=2023-01-02', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHistoryWeather');
        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertIsArray($body);
        $this->assertCount(1, $body);

        // Clean up.
        cache()->delete($cacheKey);
    }

    /**
     * CACHE_TTL_SHORT and CACHE_TTL_LONG constants are defined with expected values.
     */
    public function testCacheTtlConstants(): void
    {
        $this->assertSame(15 * 60, History::CACHE_TTL_SHORT);
        $this->assertSame(0, History::CACHE_TTL_LONG);
    }

    // -------------------------------------------------------------------------
    // getHistoryWeatherCSV — export
    // -------------------------------------------------------------------------

    public function testExportMissingBothDatesReturns400(): void
    {
        $this->controller(History::class);
        $this->request->setMethod('GET');
        $this->request->setGlobal('get', []);

        $result = $this->execute('getHistoryWeatherCSV');
        $this->assertSame(400, $result->response()->getStatusCode());
    }

    public function testExportFutureDateReturns400(): void
    {
        $this->controller(History::class);
        $this->request->setMethod('GET');
        parse_str('start_date=2099-01-01&end_date=2099-01-31', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHistoryWeatherCSV');
        $this->assertSame(400, $result->response()->getStatusCode());
    }

    /**
     * Valid range with mocked model → 200 CSV with correct headers.
     */
    public function testExportReturns200CsvWithCorrectHeaders(): void
    {
        $fakeRow = [
            'date'          => '2023-01-01 10:00:00',
            'temperature'   => 3.5,
            'feels_like'    => 2.0,
            'pressure'      => 1008,
            'humidity'      => 70,
            'dew_point'     => null,
            'uv_index'      => null,
            'sol_energy'    => null,
            'sol_radiation' => null,
            'precipitation' => 0.0,
            'clouds'        => 20,
            'visibility'    => 8000,
            'wind_speed'    => 3.0,
            'wind_gust'     => null,
            'wind_deg'      => 270,
        ];

        $mockRaw = $this->createMock(RawWeatherDataModel::class);
        $mockRaw->method('getWeatherHistoryGrouped')->willReturn([$fakeRow]);

        $this->controller(History::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockRaw);

        $this->request->setMethod('GET');
        parse_str('start_date=2023-01-01&end_date=2023-01-02', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHistoryWeatherCSV');
        $this->assertSame(200, $result->response()->getStatusCode());

        $contentType = $result->response()->getHeaderLine('Content-Type');
        $this->assertStringContainsString('text/csv', $contentType);

        $body = (string) $result->response()->getBody();
        $this->assertStringContainsString('UTC Date', $body);
        $this->assertStringContainsString('Temperature', $body);
    }
}
