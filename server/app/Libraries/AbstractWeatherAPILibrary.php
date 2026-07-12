<?php

namespace App\Libraries;

use CodeIgniter\HTTP\CURLRequest;
use Config\Services;
use Exception;

/**
 * Shared base class for external weather data provider libraries.
 *
 * Centralises the CURLRequest HTTP client construction and the
 * try/catch + logging boilerplate around HTTP calls that was previously
 * duplicated across OpenWeatherAPILibrary, WeatherAPILibrary, and
 * VisualCrossingAPILibrary.
 */
abstract class AbstractWeatherAPILibrary implements WeatherProviderInterface
{
    /**
     * @var CURLRequest The HTTP client used for making requests.
     */
    protected CURLRequest $httpClient;

    /**
     * AbstractWeatherAPILibrary constructor.
     */
    public function __construct()
    {
        $this->httpClient = Services::curlrequest();
    }

    /**
     * Returns the short, human-readable API source name for CLI output
     * and logging. Strips the 'APILibrary' suffix from the class short name.
     *
     * @return string
     */
    public function getSourceName(): string
    {
        return str_replace('APILibrary', '', (new \ReflectionClass($this))->getShortName());
    }

    /**
     * Performs an HTTP GET request and decodes the JSON response body.
     * Any exception raised by the HTTP client is logged and results in
     * a `false` return value instead of propagating.
     *
     * @param string $url     Fully-qualified request URL
     * @param array  $params  Query parameters
     * @param int    $timeout Request timeout in seconds
     * @return array|false
     */
    protected function httpGet(string $url, array $params, int $timeout = 30): false|array
    {
        try {
            $response = $this->httpClient->request('GET', $url, [
                'query'   => $params,
                'timeout' => $timeout,
            ]);

            return json_decode($response->getBody(), true);
        } catch (Exception $e) {
            log_message('error', $this->getSourceName() . ' API request error: {e}', ['e' => $e->getMessage()]);
            return false;
        }
    }
}
