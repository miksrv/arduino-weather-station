<?php

use App\Controllers\Forecast;
use App\Models\ForecastWeatherDataModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\ControllerTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests for App\Controllers\Forecast.
 *
 * Uses ControllerTestTrait to properly initialise CI4 request/response services
 * and mocks the model to avoid any real database access.
 *
 * @internal
 */
final class ForecastControllerTest extends CIUnitTestCase
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
    // Helper — initialise controller with injected mock model
    // -------------------------------------------------------------------------

    private function _withMockForecastModel(ForecastWeatherDataModel $mock): void
    {
        $this->controller(Forecast::class);
        $this->setPrivateProperty($this->controller, 'weatherForecastModel', $mock);
    }

    // -------------------------------------------------------------------------
    // getForecastDaily
    // -------------------------------------------------------------------------

    public function testForecastDailyReturns404WhenNoData(): void
    {
        $mockModel = $this->createMock(ForecastWeatherDataModel::class);
        $mockModel->method('getDailyAverages')->willReturn([]);

        $this->_withMockForecastModel($mockModel);

        $result = $this->execute('getForecastDaily');
        $this->assertSame(404, $result->response()->getStatusCode());
    }

    public function testForecastDailyReturns200WithData(): void
    {
        $fakeRow = [
            'date'        => '2024-06-20 00:00:00',
            'temperature' => 22.0,
            'pressure'    => 1010,
            'humidity'    => 65,
        ];

        $mockModel = $this->createMock(ForecastWeatherDataModel::class);
        $mockModel->method('getDailyAverages')->willReturn([$fakeRow]);

        $this->_withMockForecastModel($mockModel);

        $result = $this->execute('getForecastDaily');
        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertIsArray($body);
        $this->assertCount(1, $body);
        $this->assertEqualsWithDelta(22.0, (float) $body[0]['temperature'], 0.001);
    }

    public function testForecastDailyReturns500OnModelException(): void
    {
        $mockModel = $this->createMock(ForecastWeatherDataModel::class);
        $mockModel->method('getDailyAverages')
            ->willThrowException(new \Exception('DB error'));

        $this->_withMockForecastModel($mockModel);

        $result = $this->execute('getForecastDaily');
        $this->assertSame(500, $result->response()->getStatusCode());
    }

    public function testForecastDailyReturnsAllRowsFromModel(): void
    {
        $rows = [
            ['date' => '2024-06-20 00:00:00', 'temperature' => 22.0],
            ['date' => '2024-06-21 00:00:00', 'temperature' => 19.5],
            ['date' => '2024-06-22 00:00:00', 'temperature' => 24.1],
        ];

        $mockModel = $this->createMock(ForecastWeatherDataModel::class);
        $mockModel->method('getDailyAverages')->willReturn($rows);

        $this->_withMockForecastModel($mockModel);

        $result = $this->execute('getForecastDaily');
        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertCount(3, $body);
    }

    // -------------------------------------------------------------------------
    // getForecastHourly
    // -------------------------------------------------------------------------

    public function testForecastHourlyReturns404WhenNoData(): void
    {
        $mockModel = $this->createMock(ForecastWeatherDataModel::class);
        $mockModel->method('getHourlyAverages')->willReturn([]);

        $this->_withMockForecastModel($mockModel);

        $result = $this->execute('getForecastHourly');
        $this->assertSame(404, $result->response()->getStatusCode());
    }

    public function testForecastHourlyReturns200WithData(): void
    {
        $fakeRow = [
            'date'        => '2024-06-20 10:00:00',
            'temperature' => 20.0,
            'pressure'    => 1012,
            'humidity'    => 70,
        ];

        $mockModel = $this->createMock(ForecastWeatherDataModel::class);
        $mockModel->method('getHourlyAverages')->willReturn([$fakeRow]);

        $this->_withMockForecastModel($mockModel);

        $result = $this->execute('getForecastHourly');
        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertIsArray($body);
        $this->assertCount(1, $body);
        $this->assertEqualsWithDelta(20.0, (float) $body[0]['temperature'], 0.001);
    }

    public function testForecastHourlyReturns500OnModelException(): void
    {
        $mockModel = $this->createMock(ForecastWeatherDataModel::class);
        $mockModel->method('getHourlyAverages')
            ->willThrowException(new \Exception('DB error'));

        $this->_withMockForecastModel($mockModel);

        $result = $this->execute('getForecastHourly');
        $this->assertSame(500, $result->response()->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // Route-level smoke tests (FeatureTestTrait)
    // -------------------------------------------------------------------------

    public function testForecastDailyRouteIsRegistered(): void
    {
        $result = $this->get('forecast/daily');
        $this->assertNotSame(404, $result->response()->getStatusCode());
    }

    public function testForecastHourlyRouteIsRegistered(): void
    {
        $result = $this->get('forecast/hourly');
        $this->assertNotSame(404, $result->response()->getStatusCode());
    }
}
