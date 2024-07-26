<?php namespace App\Libraries;

use App\Entities\WeatherData;
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
     * @return WeatherData|false
     */
    public function getWeatherData(int $timestamp = null): false|WeatherData
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

        $data = $this->request($endpoint, $params);
        return $data ? new WeatherData($this->mapWeatherData($data)) : false;
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

    /**
     * Маппинг данных погоды в нужный формат
     * @param array $data
     * @return array
     */
    protected function mapWeatherData(array $data): array
    {
        return [
            'temperature'  => $data['main']['temp'] ?? null,
            'feels_like'   => $data['main']['feels_like'] ?? null,
            'pressure'     => $data['main']['pressure'] ?? null,
            'humidity'     => $data['main']['humidity'] ?? null,
            'visibility'   => $data['visibility'] ?? null,
            'wind_speed'   => $data['wind']['speed'] ?? null,
            'wind_deg'     => $data['wind']['deg'] ?? null,
            'clouds'       => $data['clouds']['all'] ?? null,
            'weather_id'   => $data['weather'][0]['id'] ?? null,
            'weather_main' => $data['weather'][0]['main'] ?? null,
            'weather_icon' => $data['weather'][0]['icon'] ?? null,
            'sunrise'      => $data['sys']['sunrise'] ?? null,
            'sunset'       => $data['sys']['sunset'] ?? null,
            'date'         => $data['dt'] ?? null,
        ];
    }
}
