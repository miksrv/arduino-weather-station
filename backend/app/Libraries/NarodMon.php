<?php namespace App\Libraries;

use App\Api\Weather;

/**
 * Library for sending data to the public monitoring service (narodmon.ru)
 */
class NarodMon {
    /**
     * Data sending period (at least 5 minutes)
     */
    const SEND_PERIOD = 5*60;

    /**
     * Cache variable to prevent data from being resubmitted
     */
    const CACHE_NAME = 'narodmon';

    /**
     * Service API
     */
    const API_URL = 'https://narodmon.ru/post';

    protected Weather $Weather;
    protected $Client;

    function __construct()
    {
        $this->Weather = new Weather();
        $this->Client  = \Config\Services::curlrequest();
    }

    /**
     * We get data about the current weather and call the method of sending data to the monitoring service
     * @return bool
     */
    function report(): bool
    {
        if (cache(self::CACHE_NAME)) {
            return true;
        }

        $weatherData = $this->Weather->get_last();

        if (!$weatherData->payload) {
            $log_data = ['m' => __METHOD__, 'e' => 'Last weather error'];
            log_message('error', '[{m}] {e}', $log_data);

            return false;
        }

        $sendData = [
            'ID'    => getenv('app.narodmon.mac'),
            'LAT'   => getenv('app.narodmon.lat'),
            'LON'   => getenv('app.narodmon.lon'),
            'ALT'   => getenv('app.narodmon.alt'),
            'T'     => $weatherData->payload['temperature'],
            'H'     => $weatherData->payload['humidity'],
            'P'     => $weatherData->payload['pressure'],
            'L'     => $weatherData->payload['illumination'],
            'UV'    => max($weatherData->payload['uvindex'], 0),
            'WS'    => $weatherData->payload['wind_speed'],
            'WD'    => $weatherData->payload['wind_degree'],
            'PR'    => $weatherData->payload['precipitation']
        ];

        cache()->save(self::CACHE_NAME, time(), self::SEND_PERIOD);

        return $this->_endpoint($sendData);
    }

    /**
     * Sending data to the service
     * @param array $report
     * @return bool
     */
    private function _endpoint(array $report): bool
    {
        try {
            $response = $this->Client->request('POST', self::API_URL, ['form_params' => $report]);

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