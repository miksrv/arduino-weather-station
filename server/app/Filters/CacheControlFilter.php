<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Class CacheControlFilter
 *
 * After-filter for read-only GET endpoints. Adds a `Cache-Control: public, max-age=N`
 * header and a weak ETag derived from the body, and answers conditional requests
 * (`If-None-Match`) with an empty 304 response.
 *
 * Usage in Config\Filters::$filters: `'cachecontrol:300' => ['after' => ['history']]`
 * where the argument is max-age in seconds. In the development environment the header is
 * `no-cache` instead, so browsers revalidate every request against the ETag.
 *
 * @package App\Filters
 */
class CacheControlFilter implements FilterInterface
{
    /** @var int Fallback max-age (seconds) when no argument is configured */
    public const DEFAULT_MAX_AGE = 60;

    /**
     * Not used.
     *
     * @param RequestInterface $request
     * @param array|null       $arguments
     * @return null
     */
    public function before(RequestInterface $request, $arguments = null)
    {
        return null;
    }

    /**
     * Adds caching headers to successful GET responses and short-circuits to 304 when the ETag matches.
     *
     * @param RequestInterface  $request
     * @param ResponseInterface $response
     * @param array|null        $arguments First element is max-age in seconds.
     * @return ResponseInterface|null
     */
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null): ?ResponseInterface
    {
        if (strtoupper($request->getMethod()) !== 'GET' || $response->getStatusCode() !== 200) {
            return null;
        }

        $body = (string) $response->getBody();

        if ($body === '') {
            return null;
        }

        $maxAge = isset($arguments[0]) && ctype_digit((string) $arguments[0])
            ? (int) $arguments[0]
            : self::DEFAULT_MAX_AGE;

        $etag = 'W/"' . md5($body) . '"';

        // In development always revalidate via the ETag, so freshly seeded data shows up without waiting out max-age
        $cacheControl = ENVIRONMENT === 'development' ? 'no-cache' : 'public, max-age=' . $maxAge;

        // Drop CI's default "no-store, max-age=0, no-cache" Cache-Control header before setting ours
        $response->removeHeader('Cache-Control');
        $response->setHeader('Cache-Control', $cacheControl);
        $response->setHeader('ETag', $etag);

        $ifNoneMatch = $request->getHeaderLine('If-None-Match');

        if ($ifNoneMatch !== '' && in_array($etag, array_map('trim', explode(',', $ifNoneMatch)), true)) {
            return $response->setStatusCode(304)->setBody('');
        }

        return null;
    }
}
