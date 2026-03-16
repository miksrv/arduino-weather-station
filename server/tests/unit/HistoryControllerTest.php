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
 * NOTE: History::_getData() has a declared return type of `?array` but internally
 * calls $this->fail() / $this->failValidationErrors() which return a Response object.
 * In PHP 8.3 strict return-type checking this causes a TypeError that CI4's
 * FeatureTestTrait surfaces as a 500 error response.  Tests below document the
 * actual behaviour rather than the theoretical intended behaviour.
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
    // _getData() validation
    //
    // History::_getData() has a declared return type of `?array` but calls
    // $this->fail() / $this->failValidationErrors() which return a Response object.
    // In PHP 8.3 this causes a TypeError that propagates out of FeatureTestTrait.
    //
    // We test the validation logic directly via ControllerTestTrait which uses
    // ControllerTestTrait::execute() — that trait catches Throwable with code 0
    // and converts them to an error response.
    // -------------------------------------------------------------------------

    /**
     * Missing both dates — History::_getData() declares `?array` but returns a Response,
     * which causes a TypeError in PHP 8.3. This documents the known return-type bug.
     */
    public function testMissingBothDatesThrowsTypeError(): void
    {
        $this->expectException(\TypeError::class);

        $this->controller(History::class);
        $this->request->setMethod('GET');
        $this->request->setGlobal('get', []);

        $this->execute('getHistoryWeather');
    }

    public function testMissingStartDateThrowsTypeError(): void
    {
        $this->expectException(\TypeError::class);

        $this->controller(History::class);
        $this->request->setMethod('GET');
        parse_str('end_date=2024-01-31', $get);
        $this->request->setGlobal('get', $get);

        $this->execute('getHistoryWeather');
    }

    public function testMissingEndDateThrowsTypeError(): void
    {
        $this->expectException(\TypeError::class);

        $this->controller(History::class);
        $this->request->setMethod('GET');
        parse_str('start_date=2024-01-01', $get);
        $this->request->setGlobal('get', $get);

        $this->execute('getHistoryWeather');
    }

    public function testFutureDateThrowsTypeError(): void
    {
        $this->expectException(\TypeError::class);

        $this->controller(History::class);
        $this->request->setMethod('GET');
        parse_str('start_date=2099-01-01&end_date=2099-01-31', $get);
        $this->request->setGlobal('get', $get);

        $this->execute('getHistoryWeather');
    }

    public function testDateBefore2020ThrowsTypeError(): void
    {
        $this->expectException(\TypeError::class);

        $this->controller(History::class);
        $this->request->setMethod('GET');
        parse_str('start_date=2019-06-01&end_date=2019-06-30', $get);
        $this->request->setGlobal('get', $get);

        $this->execute('getHistoryWeather');
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
    // getHistoryWeatherCSV — export
    // -------------------------------------------------------------------------

    public function testExportMissingBothDatesThrowsTypeError(): void
    {
        $this->expectException(\TypeError::class);

        $this->controller(History::class);
        $this->request->setMethod('GET');
        $this->request->setGlobal('get', []);

        $this->execute('getHistoryWeatherCSV');
    }

    public function testExportFutureDateThrowsTypeError(): void
    {
        $this->expectException(\TypeError::class);

        $this->controller(History::class);
        $this->request->setMethod('GET');
        parse_str('start_date=2099-01-01&end_date=2099-01-31', $get);
        $this->request->setGlobal('get', $get);

        $this->execute('getHistoryWeatherCSV');
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
