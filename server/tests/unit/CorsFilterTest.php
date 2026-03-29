<?php

use App\Filters\CorsFilter;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\Response;
use CodeIgniter\HTTP\SiteURIFactory;
use CodeIgniter\Test\CIUnitTestCase;
use Config\App;

/**
 * Tests for App\Filters\CorsFilter.
 *
 * @internal
 */
final class CorsFilterTest extends CIUnitTestCase
{
    private CorsFilter $filter;

    protected function setUp(): void
    {
        parent::setUp();
        $this->filter = new CorsFilter();
    }

    /**
     * after() must return void (it has no body — just a comment).
     */
    public function testAfterReturnsVoid(): void
    {
        $request  = $this->createMock(\CodeIgniter\HTTP\RequestInterface::class);
        $response = $this->createMock(\CodeIgniter\HTTP\ResponseInterface::class);

        $result = $this->filter->after($request, $response);
        $this->assertNull($result);
    }

    /**
     * before() for a non-OPTIONS request must complete without dying and return void.
     *
     * We use output buffering to prevent headers from interfering with the test runner
     * and set REQUEST_METHOD to GET to avoid the die() branch.
     */
    public function testBeforeNonOptionsRequestReturnsVoid(): void
    {
        $request = $this->createMock(\CodeIgniter\HTTP\RequestInterface::class);

        $_SERVER['REQUEST_METHOD'] = 'GET';

        // before() calls header() which may emit warnings in CLI — suppress with @
        $result = @$this->filter->before($request);

        $this->assertNull($result);
    }

    /**
     * The CorsFilter class implements FilterInterface.
     */
    public function testImplementsFilterInterface(): void
    {
        $this->assertInstanceOf(\CodeIgniter\Filters\FilterInterface::class, $this->filter);
    }
}
