<?php

use App\Controllers\Precipitation;
use App\Models\PrecipitationModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\ControllerTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests for App\Controllers\Precipitation.
 *
 * Uses ControllerTestTrait for direct controller invocation and FeatureTestTrait
 * for the route-level smoke test. PrecipitationModel is replaced with a mock so
 * no database connection is required.
 *
 * @internal
 */
final class PrecipitationControllerTest extends CIUnitTestCase
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
     * Returns a valid stats fixture for the given year.
     *
     * @param int $year
     * @return array
     */
    private function _fakeStats(int $year = 2024): array
    {
        return [
            'totalYear'        => 100.0,
            'rainyDays'        => 20,
            'dryDays'          => 345,
            'maxDailyTotal'    => ['value' => 15.0, 'date' => $year . '-06-01'],
            'longestWetStreak' => ['days' => 5, 'start' => $year . '-06-01', 'end' => $year . '-06-05'],
            'longestDryStreak' => ['days' => 30, 'start' => $year . '-07-01', 'end' => $year . '-07-30'],
            'monthlyTotals'    => array_map(
                static fn(int $m): array => ['month' => $m, 'total' => 0.0],
                range(1, 12)
            ),
        ];
    }

    /**
     * Builds a mock PrecipitationModel with all three data methods stubbed.
     *
     * @param array $dailyTotals  Return value of getDailyTotals()
     * @param array $years        Return value of getAvailableYears()
     * @param array $stats        Return value of getStats()
     * @return PrecipitationModel
     */
    private function _mockModel(
        array $dailyTotals = [],
        array $years = [2024],
        array $stats = []
    ): PrecipitationModel {
        $mock = $this->getMockBuilder(PrecipitationModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getDailyTotals', 'getAvailableYears', 'getStats'])
            ->getMock();

        $mock->method('getDailyTotals')->willReturn($dailyTotals);
        $mock->method('getAvailableYears')->willReturn($years);
        $mock->method('getStats')->willReturn($stats ?: $this->_fakeStats());

        return $mock;
    }

    // -------------------------------------------------------------------------
    // Validation — year parameter
    // -------------------------------------------------------------------------

    /**
     * A year before 2020 must return 400.
     */
    public function testYearBefore2020Returns400(): void
    {
        $result = $this->get('precipitation', ['year' => '2019']);
        $result->assertStatus(400);
    }

    /**
     * A year after the current year must return 400.
     */
    public function testYearAfterCurrentYearReturns400(): void
    {
        $futureYear = (string) ((int) date('Y') + 1);
        $result     = $this->get('precipitation', ['year' => $futureYear]);
        $result->assertStatus(400);
    }

    // -------------------------------------------------------------------------
    // Default year behaviour
    // -------------------------------------------------------------------------

    /**
     * When no year param is given, the controller must use the current year.
     */
    public function testDefaultYearIsCurrentYear(): void
    {
        $currentYear = (int) date('Y');

        $mock = $this->_mockModel([], [$currentYear], $this->_fakeStats($currentYear));

        $this->controller(Precipitation::class);
        $this->setPrivateProperty($this->controller, 'precipitationModel', $mock);

        $this->request->setMethod('GET');
        $this->request->setGlobal('get', []);

        $result = $this->execute('index');

        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertSame($currentYear, $body['year']);
    }

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    /**
     * Valid year returns 200 with expected JSON keys: year, days, stats, availableYears.
     */
    public function testIndexReturns200WithValidData(): void
    {
        $mock = $this->_mockModel([], [2024], $this->_fakeStats());

        $this->controller(Precipitation::class);
        $this->setPrivateProperty($this->controller, 'precipitationModel', $mock);

        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['year' => '2024']);

        $result = $this->execute('index');

        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertIsArray($body);
        $this->assertArrayHasKey('year', $body);
        $this->assertArrayHasKey('days', $body);
        $this->assertArrayHasKey('stats', $body);
        $this->assertArrayHasKey('availableYears', $body);
    }

    // -------------------------------------------------------------------------
    // Exception path
    // -------------------------------------------------------------------------

    /**
     * When getDailyTotals() throws, index() must respond 500.
     */
    public function testIndexReturns500OnModelException(): void
    {
        $mock = $this->getMockBuilder(PrecipitationModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getDailyTotals', 'getAvailableYears', 'getStats'])
            ->getMock();

        $mock->method('getDailyTotals')->willThrowException(new \Exception('DB error'));

        $this->controller(Precipitation::class);
        $this->setPrivateProperty($this->controller, 'precipitationModel', $mock);

        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['year' => '2024']);

        $result = $this->execute('index');

        $this->assertSame(500, $result->response()->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // Cache hit
    // -------------------------------------------------------------------------

    /**
     * When a cache entry exists for the requested year, the model must never be called.
     */
    public function testIndexReturnsCachedData(): void
    {
        $fakeResponse = [
            'year'           => 2024,
            'days'           => [],
            'stats'          => $this->_fakeStats(),
            'availableYears' => [2024],
        ];
        cache()->save('precipitation_index_2024', $fakeResponse, 0);

        $mock = $this->getMockBuilder(PrecipitationModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getDailyTotals', 'getAvailableYears', 'getStats'])
            ->getMock();

        $mock->expects($this->never())->method('getDailyTotals');
        $mock->expects($this->never())->method('getAvailableYears');
        $mock->expects($this->never())->method('getStats');

        $this->controller(Precipitation::class);
        $this->setPrivateProperty($this->controller, 'precipitationModel', $mock);

        $this->request->setMethod('GET');
        $this->request->setGlobal('get', ['year' => '2024']);

        $result = $this->execute('index');

        $this->assertSame(200, $result->response()->getStatusCode());

        cache()->delete('precipitation_index_2024');
    }

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    /**
     * Cache TTL constants must have the expected values.
     */
    public function testCacheTtlConstants(): void
    {
        $this->assertSame(60 * 60, Precipitation::CACHE_TTL_RECENT);
        $this->assertSame(0, Precipitation::CACHE_TTL_HISTORICAL);
        $this->assertSame(7, Precipitation::CACHE_RECENT_DAYS_THRESHOLD);
    }

    // -------------------------------------------------------------------------
    // Route smoke test (FeatureTestTrait)
    // -------------------------------------------------------------------------

    /**
     * The precipitation route must be registered and must not return 404.
     */
    public function testPrecipitationRouteIsRegistered(): void
    {
        try {
            $result = $this->get('precipitation', ['year' => date('Y')]);
            $this->assertNotSame(404, $result->response()->getStatusCode());
        } catch (\Throwable $e) {
            $this->assertNotInstanceOf(\CodeIgniter\Exceptions\PageNotFoundException::class, $e);
        }
    }
}
