<?php

use App\Controllers\Events;
use App\Libraries\EventFeedBuilder;
use App\Models\AnomalyLogModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\ControllerTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests for App\Controllers\Events.
 *
 * Uses ControllerTestTrait for direct controller invocation and FeatureTestTrait
 * for the route-level smoke test. RawWeatherDataModel, AnomalyLogModel, and
 * EventFeedBuilder are all replaced with mocks so no database connection or
 * real event-derivation logic is required.
 *
 * @internal
 */
final class EventsControllerTest extends CIUnitTestCase
{
    use ControllerTestTrait, FeatureTestTrait {
        ControllerTestTrait::withBody insteadof FeatureTestTrait;
        FeatureTestTrait::withBody as featureWithBody;
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpControllerTestTrait();

        // Ensure a clean cache slate for every test — several tests below reuse
        // the same default (hours=24, limit=50) cache key, and index() now caches
        // its response for CACHE_TTL seconds.
        cache()->deleteMatching('events_index_*');
    }

    protected function tearDown(): void
    {
        cache()->deleteMatching('events_index_*');
        parent::tearDown();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Builds a RawWeatherDataModel mock with getRowsSince() and
     * getLastUpdateTime() stubbed.
     *
     * @param array|\Exception $rowsReturn
     */
    private function _mockWeatherModel(array|\Exception $rowsReturn = [], mixed $lastUpdate = null): RawWeatherDataModel
    {
        $mock = $this->getMockBuilder(RawWeatherDataModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getRowsSince', 'getLastUpdateTime'])
            ->getMock();

        if ($rowsReturn instanceof \Exception) {
            $mock->method('getRowsSince')->willThrowException($rowsReturn);
        } else {
            $mock->method('getRowsSince')->willReturn($rowsReturn);
        }

        $mock->method('getLastUpdateTime')->willReturn($lastUpdate);

        return $mock;
    }

    /**
     * Builds an AnomalyLogModel mock with getAnomaliesTouchingWindow() stubbed.
     */
    private function _mockAnomalyLogModel(array $rowsReturn = []): AnomalyLogModel
    {
        $mock = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getAnomaliesTouchingWindow'])
            ->getMock();

        $mock->method('getAnomaliesTouchingWindow')->willReturn($rowsReturn);

        return $mock;
    }

    /**
     * Builds an EventFeedBuilder mock with build() stubbed.
     */
    private function _mockEventFeedBuilder(array $events = []): EventFeedBuilder
    {
        $mock = $this->getMockBuilder(EventFeedBuilder::class)
            ->onlyMethods(['build'])
            ->getMock();

        $mock->method('build')->willReturn($events);

        return $mock;
    }

    // -------------------------------------------------------------------------
    // Validation — hours parameter
    // -------------------------------------------------------------------------

    /**
     * hours=0 must return 400.
     */
    public function testHoursZeroReturns400(): void
    {
        $this->controller(Events::class);
        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['hours' => '0']);

        $result = $this->execute('index');

        $this->assertSame(400, $result->response()->getStatusCode());
    }

    /**
     * hours beyond MAX_HOURS (168) must return 400.
     */
    public function testHoursAboveMaxReturns400(): void
    {
        $this->controller(Events::class);
        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['hours' => '200']);

        $result = $this->execute('index');

        $this->assertSame(400, $result->response()->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // Validation — limit parameter
    // -------------------------------------------------------------------------

    /**
     * limit=0 must return 400.
     */
    public function testLimitZeroReturns400(): void
    {
        $this->controller(Events::class);
        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['limit' => '0']);

        $result = $this->execute('index');

        $this->assertSame(400, $result->response()->getStatusCode());
    }

    /**
     * limit beyond MAX_LIMIT (200) must return 400.
     */
    public function testLimitAboveMaxReturns400(): void
    {
        $this->controller(Events::class);
        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['limit' => '500']);

        $result = $this->execute('index');

        $this->assertSame(400, $result->response()->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    /**
     * A valid request must return 200 with an "events" key containing the
     * array produced by EventFeedBuilder::build().
     */
    public function testIndexReturns200WithEventsKey(): void
    {
        $fakeEvents = [
            ['date' => '2026-07-13T15:39:00+00:00', 'type' => 'wind_gust', 'value' => 8.5, 'windDeg' => 315],
        ];

        $this->controller(Events::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $this->_mockWeatherModel([]));
        $this->setPrivateProperty($this->controller, 'anomalyLogModel', $this->_mockAnomalyLogModel([]));
        $this->setPrivateProperty($this->controller, 'eventFeedBuilder', $this->_mockEventFeedBuilder($fakeEvents));

        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['hours' => '24', 'limit' => '50']);

        $result = $this->execute('index');

        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertArrayHasKey('events', $body);
        $this->assertSame($fakeEvents, $body['events']);
    }

    /**
     * With no query params supplied, defaults (hours=24, limit=50) must be used
     * and must not trigger validation failure.
     */
    public function testDefaultsAreUsedWhenParamsOmitted(): void
    {
        $this->controller(Events::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $this->_mockWeatherModel([]));
        $this->setPrivateProperty($this->controller, 'anomalyLogModel', $this->_mockAnomalyLogModel([]));
        $this->setPrivateProperty($this->controller, 'eventFeedBuilder', $this->_mockEventFeedBuilder([]));

        $this->request->setMethod('GET');
        $this->request->setGlobal('get', []);

        $result = $this->execute('index');

        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertSame([], $body['events']);
    }

    // -------------------------------------------------------------------------
    // Exception path
    // -------------------------------------------------------------------------

    /**
     * When the weather model throws, index() must respond 500.
     */
    public function testIndexReturns500OnModelException(): void
    {
        $this->controller(Events::class);
        $this->setPrivateProperty(
            $this->controller,
            'weatherDataModel',
            $this->_mockWeatherModel(new \Exception('DB error'))
        );
        $this->setPrivateProperty($this->controller, 'anomalyLogModel', $this->_mockAnomalyLogModel([]));
        $this->setPrivateProperty($this->controller, 'eventFeedBuilder', $this->_mockEventFeedBuilder([]));

        $this->request->setMethod('GET');
        $this->request->setGlobal('get', []);

        $result = $this->execute('index');

        $this->assertSame(500, $result->response()->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    /**
     * Default and max constants must have the expected values.
     */
    public function testConstants(): void
    {
        $this->assertSame(24, Events::DEFAULT_HOURS);
        $this->assertSame(24 * 7, Events::MAX_HOURS);
        $this->assertSame(50, Events::DEFAULT_LIMIT);
        $this->assertSame(200, Events::MAX_LIMIT);
    }

    /**
     * CACHE_TTL must equal 2 minutes in seconds.
     */
    public function testCacheTtlConstant(): void
    {
        $this->assertSame(120, Events::CACHE_TTL);
    }

    // -------------------------------------------------------------------------
    // index() — cache hit
    // -------------------------------------------------------------------------

    /**
     * When a cache entry exists for the requested (hours, limit) combination,
     * index() must serve it directly without touching the weather model,
     * anomaly log model, or event feed builder.
     */
    public function testIndexReturnsCachedData(): void
    {
        $fakeResponse = [
            'events' => [
                ['date' => '2026-07-13T15:39:00+00:00', 'type' => 'wind_gust', 'value' => 8.5, 'windDeg' => 315],
            ],
        ];
        cache()->save('events_index_24_50', $fakeResponse, 0);

        $mockWeatherModel = $this->getMockBuilder(RawWeatherDataModel::class)
            ->disableOriginalConstructor()
            ->getMock();

        $mockWeatherModel->expects($this->never())->method('getRowsSince');

        $this->controller(Events::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $mockWeatherModel);

        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['hours' => '24', 'limit' => '50']);

        $result = $this->execute('index');

        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertSame($fakeResponse['events'], $body['events']);
    }

    /**
     * A successful, uncached index() call must populate the cache under the
     * (hours, limit)-derived key so a subsequent request is served from cache.
     */
    public function testIndexPopulatesCacheOnMiss(): void
    {
        $fakeEvents = [
            ['date' => '2026-07-13T15:39:00+00:00', 'type' => 'wind_gust', 'value' => 8.5, 'windDeg' => 315],
        ];

        $this->controller(Events::class);
        $this->setPrivateProperty($this->controller, 'weatherDataModel', $this->_mockWeatherModel([]));
        $this->setPrivateProperty($this->controller, 'anomalyLogModel', $this->_mockAnomalyLogModel([]));
        $this->setPrivateProperty($this->controller, 'eventFeedBuilder', $this->_mockEventFeedBuilder($fakeEvents));

        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['hours' => '24', 'limit' => '50']);

        $result = $this->execute('index');

        $this->assertSame(200, $result->response()->getStatusCode());
        $this->assertSame(['events' => $fakeEvents], cache()->get('events_index_24_50'));
    }

    // -------------------------------------------------------------------------
    // Route smoke test (FeatureTestTrait)
    // -------------------------------------------------------------------------

    /**
     * The events route must be registered and must not return 404.
     */
    public function testEventsRouteIsRegistered(): void
    {
        try {
            $result = $this->get('events');
            $this->assertNotSame(404, $result->response()->getStatusCode());
        } catch (\Throwable $e) {
            $this->assertNotInstanceOf(\CodeIgniter\Exceptions\PageNotFoundException::class, $e);
        }
    }
}
