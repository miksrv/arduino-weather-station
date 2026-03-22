<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Class ThrottleFilter
 *
 * Rate-limiting filter for the POST /sensors endpoint.
 * Allows at most 1 request per 30 seconds per IP address using the CI4 Throttler service.
 *
 * @package App\Filters
 */
class ThrottleFilter implements FilterInterface
{
    /** @var int Maximum requests allowed within the rate window */
    private const MAX_REQUESTS = 1;

    /** @var int Rate window in seconds (30 seconds between requests) */
    private const RATE_SECONDS = 30;

    /**
     * Check request rate for the calling IP address.
     *
     * @param RequestInterface $request
     * @param array|null       $arguments
     * @return ResponseInterface|null
     */
    public function before(RequestInterface $request, $arguments = null): ?ResponseInterface
    {
        $throttler = \Config\Services::throttler();
        $ipAddress = $request->getIPAddress();

        if (!$throttler->check('sensors_' . $ipAddress, self::MAX_REQUESTS, self::RATE_SECONDS)) {
            return \Config\Services::response()
                ->setStatusCode(429)
                ->setJSON(['status' => 429, 'error' => 429, 'messages' => ['error' => 'Too Many Requests']]);
        }

        return null;
    }

    /**
     * @param RequestInterface  $request
     * @param ResponseInterface $response
     * @param array|null        $arguments
     * @return ResponseInterface|null
     */
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null): ?ResponseInterface
    {
        return null;
    }
}
