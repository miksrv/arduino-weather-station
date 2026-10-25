<?php

use App\Filters\CacheControlFilter;
use CodeIgniter\HTTP\Response;
use CodeIgniter\Test\CIUnitTestCase;
use Config\App;
use Config\Services;

/**
 * Tests for App\Filters\CacheControlFilter.
 *
 * @internal
 */
final class CacheControlFilterTest extends CIUnitTestCase
{
    private CacheControlFilter $filter;

    protected function setUp(): void
    {
        parent::setUp();
        $this->filter = new CacheControlFilter();
    }

    private function _request(string $method = 'GET', string $ifNoneMatch = ''): \CodeIgniter\HTTP\IncomingRequest
    {
        $request = Services::incomingrequest(new App(), false);
        $request->setMethod($method);

        if ($ifNoneMatch !== '') {
            $request->setHeader('If-None-Match', $ifNoneMatch);
        }

        return $request;
    }

    private function _response(string $body, int $status = 200): Response
    {
        $response = new Response(new App());
        $response->setStatusCode($status)->setBody($body);

        return $response;
    }

    public function testAddsCacheControlAndEtagToSuccessfulGet(): void
    {
        $response = $this->_response('{"a":1}');

        $result = $this->filter->after($this->_request(), $response, ['300']);

        $this->assertNull($result);
        $this->assertSame('public, max-age=300', $response->getHeaderLine('Cache-Control'));
        $this->assertSame('W/"' . md5('{"a":1}') . '"', $response->getHeaderLine('ETag'));
    }

    public function testReturns304WhenEtagMatches(): void
    {
        $etag     = 'W/"' . md5('{"a":1}') . '"';
        $response = $this->_response('{"a":1}');

        $result = $this->filter->after($this->_request('GET', $etag), $response, ['60']);

        $this->assertNotNull($result);
        $this->assertSame(304, $result->getStatusCode());
        $this->assertSame('', (string) $result->getBody());
    }

    public function testSkipsNonGetAndErrorResponses(): void
    {
        $post = $this->_response('{"a":1}');
        $this->filter->after($this->_request('POST'), $post, ['60']);
        $this->assertSame('', $post->getHeaderLine('ETag'));

        $error = $this->_response('{"error":1}', 404);
        $this->filter->after($this->_request(), $error, ['60']);
        $this->assertSame('', $error->getHeaderLine('ETag'));
    }

    public function testFallsBackToDefaultMaxAge(): void
    {
        $response = $this->_response('x');

        $this->filter->after($this->_request(), $response, null);

        $this->assertSame('public, max-age=' . CacheControlFilter::DEFAULT_MAX_AGE, $response->getHeaderLine('Cache-Control'));
    }
}
