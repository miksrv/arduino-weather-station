<?php

use App\Controllers\Climate;
use App\Models\ClimateModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\ControllerTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests for App\Controllers\Climate.
 *
 * Uses ControllerTestTrait for direct controller invocation and FeatureTestTrait
 * for the route-level smoke test. The ClimateModel is replaced with a mock so
 * no database connection is required.
 *
 * @internal
 */
final class ClimateControllerTest extends CIUnitTestCase
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
     * Returns a valid climate stats fixture matching the controller response shape.
     *
     * @return array
     */
    private function _fakeStats(): array
    {
        return [
            'years'           => [],
            'monthlyNormals'  => [],
            'baselineAvgTemp' => 0.0,
            'availableYears'  => [],
        ];
    }

    // -------------------------------------------------------------------------
    // index() — happy path
    // -------------------------------------------------------------------------

    /**
     * When the model returns valid data, index() must respond 200 with the
     * expected JSON keys.
     */
    public function testIndexReturns200WithData(): void
    {
        $mockModel = $this->getMockBuilder(ClimateModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getClimateStats'])
            ->getMock();

        $mockModel->method('getClimateStats')->willReturn($this->_fakeStats());

        $this->controller(Climate::class);
        $this->setPrivateProperty($this->controller, 'climateModel', $mockModel);

        $result = $this->execute('index');

        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertIsArray($body);
        $this->assertArrayHasKey('years', $body);
        $this->assertArrayHasKey('monthlyNormals', $body);
        $this->assertArrayHasKey('baselineAvgTemp', $body);
        $this->assertArrayHasKey('availableYears', $body);
    }

    // -------------------------------------------------------------------------
    // index() — exception path
    // -------------------------------------------------------------------------

    /**
     * When the model throws an exception, index() must respond 500.
     */
    public function testIndexReturns500OnModelException(): void
    {
        $mockModel = $this->getMockBuilder(ClimateModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getClimateStats'])
            ->getMock();

        $mockModel->method('getClimateStats')->willThrowException(new \Exception('DB error'));

        $this->controller(Climate::class);
        $this->setPrivateProperty($this->controller, 'climateModel', $mockModel);

        $result = $this->execute('index');

        $this->assertSame(500, $result->response()->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // index() — cache hit
    // -------------------------------------------------------------------------

    /**
     * When a cache entry exists, index() must serve it without calling the model.
     */
    public function testIndexReturnsCachedData(): void
    {
        $fakeResponse = $this->_fakeStats();
        cache()->save('climate_index', $fakeResponse, 0);

        $mockModel = $this->getMockBuilder(ClimateModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getClimateStats'])
            ->getMock();

        $mockModel->expects($this->never())->method('getClimateStats');

        $this->controller(Climate::class);
        $this->setPrivateProperty($this->controller, 'climateModel', $mockModel);

        $result = $this->execute('index');

        $this->assertSame(200, $result->response()->getStatusCode());

        $body = json_decode((string) $result->response()->getBody(), true);
        $this->assertArrayHasKey('years', $body);

        cache()->delete('climate_index');
    }

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    /**
     * CACHE_TTL must equal 24 hours in seconds.
     */
    public function testCacheTtlConstant(): void
    {
        $this->assertSame(24 * 60 * 60, Climate::CACHE_TTL);
    }

    // -------------------------------------------------------------------------
    // Route smoke test (FeatureTestTrait)
    // -------------------------------------------------------------------------

    /**
     * The climate route must be registered and must not return 404.
     */
    public function testClimateRouteIsRegistered(): void
    {
        try {
            $result = $this->get('climate');
            $this->assertNotSame(404, $result->response()->getStatusCode());
        } catch (\Throwable $e) {
            $this->assertNotInstanceOf(\CodeIgniter\Exceptions\PageNotFoundException::class, $e);
        }
    }
}
