<?php

use App\Libraries\NarodMonLibrary;
use CodeIgniter\HTTP\CURLRequest;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Libraries\NarodMonLibrary.
 *
 * @internal
 */
final class NarodMonLibraryTest extends CIUnitTestCase
{
    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    public function testApiUrlConstant(): void
    {
        $this->assertStringContainsString('narodmon.ru', NarodMonLibrary::API_URL);
    }

    // -------------------------------------------------------------------------
    // send() with empty data
    // -------------------------------------------------------------------------

    public function testSendReturnsFalseWhenWeatherDataIsEmpty(): void
    {
        $library = new NarodMonLibrary();
        $result  = $library->send([]);
        $this->assertFalse($result);
    }

    // -------------------------------------------------------------------------
    // send() — mocked HTTP client
    // -------------------------------------------------------------------------

    private function _buildLibraryWithMockClient(string $responseBody): NarodMonLibrary
    {
        $mockResponse = $this->createMock(ResponseInterface::class);
        $mockResponse->method('getBody')->willReturn($responseBody);

        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willReturn($mockResponse);

        $library = new NarodMonLibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        return $library;
    }

    public function testSendReturnsTrueWhenResponseIsOK(): void
    {
        $library = $this->_buildLibraryWithMockClient('OK');

        $result = $library->send([
            'temperature' => 20.5,
            'humidity'    => 60,
        ]);

        $this->assertTrue($result);
    }

    public function testSendReturnsFalseWhenResponseIsNotOK(): void
    {
        $library = $this->_buildLibraryWithMockClient('ERROR');

        $result = $library->send([
            'temperature' => 20.5,
        ]);

        $this->assertFalse($result);
    }

    public function testSendReturnsFalseOnHttpException(): void
    {
        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')->willThrowException(new \Exception('connection refused'));

        $library = new NarodMonLibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        $result = $library->send(['temperature' => 20.5]);

        $this->assertFalse($result);
    }

    /**
     * 'date' and 'weather_id' are stripped before sending so they don't reach the API.
     */
    public function testSendStripsDateAndWeatherIdFromPayload(): void
    {
        $capturedParams = null;

        $mockResponse = $this->createMock(ResponseInterface::class);
        $mockResponse->method('getBody')->willReturn('OK');

        $mockClient = $this->createMock(CURLRequest::class);
        $mockClient->method('request')
            ->willReturnCallback(function (string $method, string $url, array $options) use (&$capturedParams, $mockResponse) {
                $capturedParams = $options['form_params'] ?? [];
                return $mockResponse;
            });

        $library = new NarodMonLibrary();
        $this->setPrivateProperty($library, 'httpClient', $mockClient);

        $library->send([
            'temperature' => 18.0,
            'date'        => '2024-01-01 12:00:00',
            'weather_id'  => 800,
        ]);

        $this->assertIsArray($capturedParams);
        $this->assertArrayNotHasKey('date',       $capturedParams);
        $this->assertArrayNotHasKey('weather_id', $capturedParams);
        $this->assertArrayHasKey('temperature',   $capturedParams);
    }
}
