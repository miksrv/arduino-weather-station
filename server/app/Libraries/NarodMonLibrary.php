<?php

namespace App\Libraries;

use CodeIgniter\HTTP\CURLRequest;
use Config\Services;

/**
 * Class NarodMonLibrary
 *
 * This class is responsible for sending weather data to the narodmon.ru monitoring service.
 *
 * @package App\Libraries
 */
class NarodMonLibrary
{
    const API_URL = 'https://narodmon.ru/post';

    /**
     * @var \CodeIgniter\HTTP\CURLRequest The HTTP client used for making requests.
     */
    protected CURLRequest $httpClient;

    function __construct()
    {
        $this->httpClient = Services::curlrequest();
    }

    /**
     * We get data about the current weather and call the method of sending data to the monitoring service
     *
     * @param array $weatherData Array containing weather data to be sent
     * @return bool|null Returns true if data is sent successfully, false otherwise, or null on error
     */
    public function send(array $weatherData): ?bool
    {
        if (empty($weatherData)) {
            return false;
        }

        if (isset($weatherData['date'])) {
            unset($weatherData['date']);
        }

        if (isset($weatherData['weather_id'])) {
            unset($weatherData['weather_id']);
        }

        $sendParams = [
            'ID'    => getenv('app.narodmon.mac'),
            'LAT'   => getenv('app.narodmon.lat'),
            'LON'   => getenv('app.narodmon.lon'),
            'ALT'   => getenv('app.narodmon.alt')
        ];

        return $this->_endpoint(array_merge($sendParams, $weatherData));
    }

    /**
     * Sending data to the service
     *
     * @param array $params Array containing the data to be sent to the service
     * @return bool|null Returns true if data is sent successfully, false otherwise, or null on error
     */
    private function _endpoint(array $params): ?bool
    {
        try {
            $response = $this->httpClient->request('POST', self::API_URL, ['form_params' => $params]);

            if ($response->getBody() === 'OK') {
                return true;
            }

            return false;

        } catch (\Exception $e) {
            $log_data = ['m' => __METHOD__, 'e' => $e->getMessage()];
            log_message('error', '[{m}] {e}', $log_data);

            return false;
        }
    }
}
