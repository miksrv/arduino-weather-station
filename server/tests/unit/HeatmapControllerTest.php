<?php

use App\Controllers\Heatmap;
use App\Models\RawWeatherDataModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\ControllerTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests for App\Controllers\Heatmap.
 *
 * Validation failures are tested via FeatureTestTrait.
 * The happy path uses ControllerTestTrait with a mocked model.
 *
 * @internal
 */
final class HeatmapControllerTest extends CIUnitTestCase
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
    // Validation — tested via FeatureTestTrait HTTP calls
    // -------------------------------------------------------------------------

    public function testMissingTypeReturns400(): void
    {
        $result = $this->get('heatmap', [
            'start_date' => '2024-01-01',
            'end_date'   => '2024-01-31',
        ]);
        $result->assertStatus(400);
    }

    public function testInvalidTypeReturns400(): void
    {
        $result = $this->get('heatmap', [
            'type'       => 'invalid_type',
            'start_date' => '2024-01-01',
            'end_date'   => '2024-01-31',
        ]);
        $result->assertStatus(400);
    }

    public function testMissingStartDateReturns400(): void
    {
        $result = $this->get('heatmap', [
            'type'     => 'temperature',
            'end_date' => '2024-01-31',
        ]);
        $result->assertStatus(400);
    }

    public function testMissingEndDateReturns400(): void
    {
        $result = $this->get('heatmap', [
            'type'       => 'temperature',
            'start_date' => '2024-01-01',
        ]);
        $result->assertStatus(400);
    }

    public function testFutureDateReturns400(): void
    {
        $result = $this->get('heatmap', [
            'type'       => 'temperature',
            'start_date' => '2099-01-01',
            'end_date'   => '2099-01-31',
        ]);
        $result->assertStatus(400);
    }

    public function testDateBefore2020Returns400(): void
    {
        $result = $this->get('heatmap', [
            'type'       => 'temperature',
            'start_date' => '2019-12-31',
            'end_date'   => '2020-01-01',
        ]);
        $result->assertStatus(400);
    }

    // -------------------------------------------------------------------------
    // Happy path — ControllerTestTrait with mocked model
    // -------------------------------------------------------------------------

    /**
     * Valid parameters with no data in the model → 404.
     */
    public function testValidParamsButNoDataReturns404(): void
    {
        $mockModel = $this->createMock(RawWeatherDataModel::class);
        $mockModel->method('getWeatherHistoryGrouped')->willReturn([]);

        $this->controller(Heatmap::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockModel);

        $this->request->setMethod('GET');
        parse_str('type=temperature&start_date=2023-01-01&end_date=2023-01-31', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHeatmapData');
        $this->assertSame(404, $result->response()->getStatusCode());
    }

    /**
     * Valid parameters with data → 200 JSON array.
     */
    public function testValidParamsWithDataReturns200(): void
    {
        $fakeRow = ['date' => '2023-01-01 10:00:00', 'temperature' => 5.0];

        $mockModel = $this->createMock(RawWeatherDataModel::class);
        $mockModel->method('getWeatherHistoryGrouped')->willReturn([$fakeRow]);

        $this->controller(Heatmap::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockModel);

        $this->request->setMethod('GET');
        parse_str('type=temperature&start_date=2023-01-01&end_date=2023-01-31', $get);
        $this->request->setGlobal('get', $get);

        $result = $this->execute('getHeatmapData');
        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertIsArray($body);
        $this->assertCount(1, $body);
    }

    /**
     * All valid weather types are accepted (do not produce a type-error 400).
     */
    public function testAllValidTypesAreAccepted(): void
    {
        $validTypes = ['temperature', 'pressure', 'humidity', 'precipitation', 'clouds', 'wind_speed'];

        $mockModel = $this->createMock(RawWeatherDataModel::class);
        $mockModel->method('getWeatherHistoryGrouped')->willReturn([]);

        foreach ($validTypes as $type) {
            $this->controller(Heatmap::class);
            $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockModel);

            $this->request->setMethod('GET');
            parse_str("type={$type}&start_date=2023-01-01&end_date=2023-01-31", $get);
            $this->request->setGlobal('get', $get);

            $result = $this->execute('getHeatmapData');

            // A type-error returns 400 with an "Invalid or missing type" message.
            // Any other status (e.g. 404 for no data) is acceptable.
            $body = json_decode((string) $result->response()->getBody(), true);
            $isTypeError = isset($body['messages']['error']) &&
                str_contains((string) $body['messages']['error'], 'Invalid or missing type');

            $this->assertFalse($isTypeError, "Type '{$type}' must not produce a type-validation error");
        }
    }
}
