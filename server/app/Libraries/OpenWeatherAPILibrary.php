<?php namespace App\Libraries;

use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\CURLRequest;
use CodeIgniter\I18n\Time;
use Config\Services;
use Exception;

/**
 * CODES: https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
 */
class OpenWeatherAPILibrary
{
    const API_VERSION = 2.5;
    const API_URL     = 'https://api.openweathermap.org/data/' . self::API_VERSION . '/';

    protected CURLRequest $httpClient;

    public function __construct()
    {
        $this->httpClient = Services::curlrequest();
    }

    /**
     * Receive current weather data
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
     * @throws Exception
     */
    public function getForecastWeatherData(): false|array
    {
        $data = $this->request('forecast');

        if (!$data) {
            return false;
        }

        $return = [];
        foreach ($data['list'] as $item) {
            $return[] = $this->mapForecastData($item);
        }

        return $return;
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
            'appid' => getenv('app.openweather.key'),
            'lat'   => getenv('app.lat'),
            'lon'   => getenv('app.lon'),
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
            'temperature'   => $data['main']['temp'] ?? null,
            'feels_like'    => $data['main']['feels_like'] ?? null,
            'pressure'      => $data['main']['pressure'] ?? null,
            'humidity'      => $data['main']['humidity'] ?? null,
            'visibility'    => $data['visibility'] ?? null,
            'wind_speed'    => $data['wind']['speed'] ?? null,
            'wind_gust'     => $data['wind']['gust'] ?? null,
            'wind_deg'      => $data['wind']['deg'] ?? null,
            'clouds'        => $data['clouds']['all'] ?? null,
            'precipitation' => $data['rain']['1h'] ?? ($data['snow']['1h'] ?? null),
            'weather_id'    => !empty($data['weather'][0]['id']) ? self::convertWeatherCondition($data['weather'][0]['id']) : null,
            'date'          => !empty($data['dt']) ? Time::createFromTimestamp($data['dt']) : null,
            'source'        => RawWeatherDataModel::SOURCE_OPENWEATHERMAP
        ];
    }

    /**
     * Mapping forecast weather data to the desired format
     * @param array $data
     * @return array
     * @throws Exception
     */
    protected function mapForecastData(array $data): array
    {
        return [
            'temperature'   => $data['main']['temp'] ?? null,
            'feels_like'    => $data['main']['feels_like'] ?? null,
            'pressure'      => $data['main']['pressure'] ?? null,
            'humidity'      => $data['main']['humidity'] ?? null,
            'visibility'    => $data['visibility'] ?? null,
            'wind_speed'    => $data['wind']['speed'] ?? null,
            'wind_gust'     => $data['wind']['gust'] ?? null,
            'wind_deg'      => $data['wind']['deg'] ?? null,
            'clouds'        => $data['clouds']['all'] ?? null,
            'precipitation' => $data['rain']['1h'] ?? ($data['snow']['1h'] ?? null),
            'weather_id'    => !empty($data['weather'][0]['id']) ? self::convertWeatherCondition($data['weather'][0]['id']) : null,
            'forecast_time' => !empty($data['dt']) ? Time::createFromTimestamp($data['dt']) : null,
            'source'        => RawWeatherDataModel::SOURCE_OPENWEATHERMAP
        ];
    }

    /**
     * @param int $weatherId
     * @return int
     * @link https://openweathermap.org/weather-conditions
     */
    public static function convertWeatherCondition(int $weatherId): int {
        return (int) $weatherId;
    }
}
