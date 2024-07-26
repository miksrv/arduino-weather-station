<?php namespace App\Libraries;

use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\CURLRequest;
use CodeIgniter\I18n\Time;
use Config\Services;
use Exception;

class OpenWeatherLibrary
{
    const API_VERSION = 2.5;
    const API_URL     = 'https://api.openweathermap.org/data/' . self::API_VERSION . '/';

    protected CURLRequest $httpClient;

    public function __construct()
    {
        $this->httpClient = Services::curlrequest();
    }

    /**
     * We receive current weather data
     * @return array|false
     * @throws Exception
     */
    public function getWeatherData(): false|array
    {
        $data = $this->request('weather');
        return $data ? $this->mapWeatherData($data) : false;
    }

    /**
     * We receive the weather forecast
     * @return array|false
     */
    public function getForecastData(): false|array
    {
        return $this->request('onecall');
    }

    /**
     * Makes a request to the OpenWeatherMap API
     * @param string $endpoint
     * @param array $additionalParams
     * @return array|false
     */
    protected function request(string $endpoint, array $additionalParams = []): false|array
    {
        $params = [
            'lat'   => getenv('app.openweather.lat'),
            'lon'   => getenv('app.openweather.lon'),
            'appid' => getenv('app.openweather.key'),
            'units' => 'metric',
            'lang'  => 'ru'
        ];

        try {
            $response = $this->httpClient->request('GET', self::API_URL . $endpoint, ['query' => array_merge($params, $additionalParams)]);
            return json_decode($response->getBody(), true);
        } catch (Exception $e) {
            log_message('error', 'OpenWeather API request error: {e}', ['e' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Mapping weather data to the desired format
     * @param array $data
     * @return array
     * @throws Exception
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
            'date'         => !empty($data['dt']) ? Time::createFromTimestamp($data['dt']) : null,
            'source'       => RawWeatherDataModel::SOURCE_OPENWEATHERMAP
        ];
    }
}
