<?php namespace App\Libraries;

use CodeIgniter\HTTP\CURLRequest;
use Config\Services;

class OpenWeatherLibrary
{
    const API_VERSION = 2.5;
    const API_URL     = 'https://api.openweathermap.org/data/' . self::API_VERSION . '/';

    protected string|array|false $apiKey;
    protected CURLRequest $httpClient;

    public function __construct()
    {
        $this->apiKey = getenv('app.openweather.key');
        $this->httpClient = Services::curlrequest();
    }

    /**
     * Получаем данные текущей и исторической погоды
     * @param int|null $timestamp Unix timestamp для исторических данных
     * @return array|false
     */
    public function getWeatherData(int $timestamp = null): false|array
    {
        $endpoint = 'weather';
        $params = [
            'lat'   => getenv('app.openweather.lat'),
            'lon'   => getenv('app.openweather.lon'),
            'appid' => $this->apiKey,
            'units' => 'metric',
            'lang'  => 'ru'
        ];

        if ($timestamp) {
            $params['dt'] = $timestamp;
        }

        return $this->request($endpoint, $params);
    }

    /**
     * Получаем прогноз погоды
     * @return array|false
     */
    public function getForecastData(): false|array
    {
        $endpoint = 'onecall';
        $params = [
            'lat'   => getenv('app.openweather.lat'),
            'lon'   => getenv('app.openweather.lon'),
            'appid' => $this->apiKey,
            'units' => 'metric',
            'lang'  => 'ru'
        ];

        return $this->request($endpoint, $params);
    }

    /**
     * Выполняет запрос к API OpenWeatherMap
     * @param string $endpoint
     * @param array $params
     * @return array|false
     */
    protected function request(string $endpoint, array $params): false|array
    {
        try {
            $response = $this->httpClient->request('GET', self::API_URL . $endpoint, ['query' => $params]);
            return json_decode($response->getBody(), true);
        } catch (\Exception $e) {
            log_message('error', 'OpenWeather API request error: {e}', ['e' => $e->getMessage()]);
            return false;
        }
    }
}
