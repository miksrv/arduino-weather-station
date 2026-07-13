<?php

use App\Libraries\AbstractWeatherAPILibrary;
use CodeIgniter\HTTP\CURLRequest;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Minimal concrete subclass of AbstractWeatherAPILibrary used only to
 * exercise the shared getSourceName()/httpGet() behaviour in isolation
 * from any real provider's request-building or mapping logic.
 *
 * @internal
 */
final class ConcreteTestAPILibrary extends AbstractWeatherAPILibrary
{
    public function getWeatherData(): array|false
    {
        return false;
    }

    public function getForecastWeatherData(): array|false
    {
        return false;
    }

    /**
     * Public wrapper so tests can exercise the protected httpGet() directly.
     */
    public function callHttpGet(string $url, array $params, int $timeout = 30): false|array
    {
        return $this->httpGet($url, $params, $timeout);
    }
}

/**
 * Unit tests for App\Libraries\AbstractWeatherAPILibrary.
 *
 * All HTTP calls are intercepted by injecting a mock CURLRequest so no real
 * network traffic is made.
 *
 * @internal
 */
final class AbstractWeatherAPILibraryTest extends CIUnitTestCase
{
    // -------------------------------------------------------------------------
    // getSourceName
    // -------------------------------------------------------------------------

    public function testGetSourceNameStripsApiLibrarySuffix(): void
    {
        $library = new ConcreteTestAPILibrary();

        $this->assertSame('ConcreteTest', $library->getSourceName());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function _buildLibraryWithMockClient(string $responseBody): ConcreteTestAPILibrary
    {
        $mockResponse = $this->createMock(ResponseInterface::class);
        $mockResponse->method('getBody')->willReturn($responseBody);

        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willReturn($mockResponse);

        $library = new ConcreteTestAPILibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        return $library;
    }

    // -------------------------------------------------------------------------
    // httpGet — mock HTTP response
    // -------------------------------------------------------------------------

    public function testHttpGetReturnsDecodedArrayOnSuccess(): void
    {
        $library = $this->_buildLibraryWithMockClient(json_encode(['foo' => 'bar']));
        $result  = $library->callHttpGet('https://example.test', ['a' => 1]);

        $this->assertIsArray($result);
        $this->assertSame('bar', $result['foo']);
    }

    public function testHttpGetReturnsFalseOnException(): void
    {
        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willThrowException(new \Exception('network error'));

        $library = new ConcreteTestAPILibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        $this->assertFalse($library->callHttpGet('https://example.test', []));
    }

    public function testHttpGetReturnsDecodedEmptyArrayAsIs(): void
    {
        // httpGet() only decodes JSON — it does not treat a falsy decoded
        // value (e.g. an empty array) as failure. That "no data" decision
        // is made by the caller (e.g. getWeatherData()), not httpGet() itself.
        $library = $this->_buildLibraryWithMockClient('[]');

        $this->assertSame([], $library->callHttpGet('https://example.test', []));
    }
}
