<?php

use App\Controllers\Anomaly;
use App\Models\AnomalyModel;
use App\Models\DailyAveragesModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\ControllerTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests for App\Controllers\Anomaly.
 *
 * Covers:
 *   - history() parameter validation
 *   - history() happy path and exception path
 *   - _buildAnomalyList() private helper via ReflectionMethod
 *   - _formatHistory() private helper via ReflectionMethod
 *   - Cache behaviour and CACHE_TTL constant
 *
 * @internal
 */
final class AnomalyControllerTest extends CIUnitTestCase
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
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Builds a DailyAveragesModel mock with fluent __call chain support and a
     * configurable findAll() return value.
     *
     * @param array|\Exception $findAllReturn
     * @return DailyAveragesModel
     */
    private function _stubDailyModel(array|\Exception $findAllReturn = []): DailyAveragesModel
    {
        $stub = $this->getMockBuilder(DailyAveragesModel::class)
            ->disableOriginalConstructor()
            ->getMock();

        $stub->method('__call')->willReturnCallback(static fn() => $stub);

        if ($findAllReturn instanceof \Exception) {
            $stub->method('findAll')->willThrowException($findAllReturn);
        } else {
            $stub->method('findAll')->willReturn($findAllReturn);
        }

        return $stub;
    }

    // -------------------------------------------------------------------------
    // history() — validation
    // -------------------------------------------------------------------------

    /**
     * Missing season parameter must return 400.
     */
    public function testHistoryMissingSeasonReturns400(): void
    {
        $this->controller(Anomaly::class);
        $this->request->setMethod('GET');
        $this->request->setGlobal('get', []);

        $result = $this->execute('history');

        $this->assertSame(400, $result->response()->getStatusCode());
    }

    /**
     * Invalid season format (underscore separator) must return 400.
     */
    public function testHistoryInvalidSeasonFormatReturns400(): void
    {
        $this->controller(Anomaly::class);
        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['season' => '2022_2023']);

        $result = $this->execute('history');

        $this->assertSame(400, $result->response()->getStatusCode());
    }

    /**
     * Season start year before 2022 must return 400.
     */
    public function testHistoryStartYearTooEarlyReturns400(): void
    {
        $this->controller(Anomaly::class);
        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['season' => '2020-2021']);

        $result = $this->execute('history');

        $this->assertSame(400, $result->response()->getStatusCode());
    }

    /**
     * Season end year not equal to start + 1 must return 400.
     */
    public function testHistoryEndYearNotStartPlusOneReturns400(): void
    {
        $this->controller(Anomaly::class);
        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['season' => '2022-2024']);

        $result = $this->execute('history');

        $this->assertSame(400, $result->response()->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // history() — happy path
    // -------------------------------------------------------------------------

    /**
     * Valid season parameter must return 200 with keys 'season' and 'series'.
     */
    public function testHistoryValidSeasonReturns200(): void
    {
        $stub = $this->_stubDailyModel([]);

        $this->controller(Anomaly::class);
        $this->setPrivateProperty($this->controller, 'dailyAveragesModel', $stub);

        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['season' => '2022-2023']);

        $result = $this->execute('history');

        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertIsArray($body);
        $this->assertArrayHasKey('season', $body);
        $this->assertArrayHasKey('series', $body);
    }

    // -------------------------------------------------------------------------
    // history() — exception path
    // -------------------------------------------------------------------------

    /**
     * When the model throws an exception, history() must respond 500.
     */
    public function testHistoryReturns500OnException(): void
    {
        $stub = $this->_stubDailyModel(new \Exception('DB error'));

        $this->controller(Anomaly::class);
        $this->setPrivateProperty($this->controller, 'dailyAveragesModel', $stub);

        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['season' => '2022-2023']);

        $result = $this->execute('history');

        $this->assertSame(500, $result->response()->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // _buildAnomalyList() — via ReflectionMethod
    // -------------------------------------------------------------------------

    /**
     * An active detector state combined with a matching log row must produce an
     * entry with active=true and triggeredAt set from the log row's start_date.
     */
    public function testBuildAnomalyListMergesStatesAndLogRows(): void
    {
        $this->controller(Anomaly::class);

        $states = [
            'heat_wave' => [
                'active'      => true,
                'zScore'      => 2.5,
                'extraMetric' => null,
            ],
        ];

        $logRows = [
            ['type' => 'heat_wave', 'start_date' => '2026-03-10 00:00:00', 'end_date' => null],
        ];

        $method = new \ReflectionMethod($this->controller, '_buildAnomalyList');
        $method->setAccessible(true);
        $result = $method->invoke($this->controller, $states, $logRows);

        $this->assertCount(1, $result);
        $this->assertTrue($result[0]['active']);
        $this->assertSame('2026-03-10', $result[0]['triggeredAt']);
    }

    /**
     * An inactive state with no matching log row must produce an entry with
     * active=false and triggeredAt=null.
     */
    public function testBuildAnomalyListMarksInactiveWhenNeitherDetectorNorLog(): void
    {
        $this->controller(Anomaly::class);

        $states = [
            'heat_wave' => [
                'active'      => false,
                'zScore'      => null,
                'extraMetric' => null,
            ],
        ];

        $method = new \ReflectionMethod($this->controller, '_buildAnomalyList');
        $method->setAccessible(true);
        $result = $method->invoke($this->controller, $states, []);

        $this->assertCount(1, $result);
        $this->assertFalse($result[0]['active']);
        $this->assertNull($result[0]['triggeredAt']);
    }

    /**
     * triggeredAt must be only the first 10 chars of start_date (the date portion).
     */
    public function testBuildAnomalyListSetsTriggeredAtFromLogRow(): void
    {
        $this->controller(Anomaly::class);

        $states = [
            'fog_risk' => [
                'active'      => false,
                'zScore'      => null,
                'extraMetric' => null,
            ],
        ];

        $logRows = [
            ['type' => 'fog_risk', 'start_date' => '2026-03-10 00:00:00', 'end_date' => null],
        ];

        $method = new \ReflectionMethod($this->controller, '_buildAnomalyList');
        $method->setAccessible(true);
        $result = $method->invoke($this->controller, $states, $logRows);

        $this->assertSame('2026-03-10', $result[0]['triggeredAt']);
    }

    // -------------------------------------------------------------------------
    // _formatHistory() — via ReflectionMethod
    // -------------------------------------------------------------------------

    /**
     * A well-formed row must be mapped to the expected API shape with correct types.
     */
    public function testFormatHistoryFormatsRowsCorrectly(): void
    {
        $this->controller(Anomaly::class);

        $rows = [
            [
                'id'          => '5',
                'type'        => 'heat_wave',
                'start_date'  => '2026-03-01 00:00:00',
                'end_date'    => '2026-03-10 00:00:00',
                'peak_value'  => '2.75',
                'description' => 'Test',
            ],
        ];

        $method = new \ReflectionMethod($this->controller, '_formatHistory');
        $method->setAccessible(true);
        $result = $method->invoke($this->controller, $rows);

        $this->assertCount(1, $result);
        $entry = $result[0];
        $this->assertSame(5, $entry['id']);
        $this->assertSame('heat_wave', $entry['type']);
        $this->assertSame('2026-03-01', $entry['startDate']);
        $this->assertSame('2026-03-10', $entry['endDate']);
        $this->assertSame(2.75, $entry['peakValue']);
    }

    /**
     * A row with end_date=null must produce endDate=null in the output.
     */
    public function testFormatHistoryHandlesNullEndDate(): void
    {
        $this->controller(Anomaly::class);

        $rows = [
            [
                'id'          => '1',
                'type'        => 'heat_wave',
                'start_date'  => '2026-03-01 00:00:00',
                'end_date'    => null,
                'peak_value'  => '1.0',
                'description' => null,
            ],
        ];

        $method = new \ReflectionMethod($this->controller, '_formatHistory');
        $method->setAccessible(true);
        $result = $method->invoke($this->controller, $rows);

        $this->assertNull($result[0]['endDate']);
    }

    /**
     * A row with peak_value=null must produce peakValue=null in the output.
     */
    public function testFormatHistoryHandlesNullPeakValue(): void
    {
        $this->controller(Anomaly::class);

        $rows = [
            [
                'id'          => '2',
                'type'        => 'fog_risk',
                'start_date'  => '2026-03-01 00:00:00',
                'end_date'    => null,
                'peak_value'  => null,
                'description' => null,
            ],
        ];

        $method = new \ReflectionMethod($this->controller, '_formatHistory');
        $method->setAccessible(true);
        $result = $method->invoke($this->controller, $rows);

        $this->assertNull($result[0]['peakValue']);
    }

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    /**
     * CACHE_TTL must equal 15 minutes in seconds.
     */
    public function testCacheTtlConstant(): void
    {
        $this->assertSame(15 * 60, Anomaly::CACHE_TTL);
    }

    // -------------------------------------------------------------------------
    // index() — cache hit
    // -------------------------------------------------------------------------

    /**
     * When a cache entry exists, index() must serve it without calling the anomaly model.
     */
    public function testIndexReturnsCachedData(): void
    {
        $fakeResponse = [
            'floodRisk'        => [],
            'snowpack'         => [],
            'parameterZScores' => [],
            'anomalies'        => [],
            'anomalyHistory'   => [],
            'anomalyCalendar'  => [],
        ];
        cache()->save('anomaly_index', $fakeResponse, 0);

        $mockAnomalyModel = $this->getMockBuilder(AnomalyModel::class)
            ->disableOriginalConstructor()
            ->getMock();

        $mockAnomalyModel->expects($this->never())->method('getCurrentFloodRisk');

        $this->controller(Anomaly::class);
        $this->setPrivateProperty($this->controller, 'anomalyModel', $mockAnomalyModel);

        $result = $this->execute('index');

        $this->assertSame(200, $result->response()->getStatusCode());

        cache()->delete('anomaly_index');
    }
}
