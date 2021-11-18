<?php

namespace App\Libraries;

use App\Models\Current;
use App\Models\Forecast;

/**
 * A library for interacting with the openweathermap.org service,
 * receives data about the current weather and a forecast for the next 4 days
 */
class OpenWeather {
    const API_VERSION = 2.5;
    const API_URL     = 'https://api.openweathermap.org/data/' . self::API_VERSION . '/';

    const CACHE_FORECAST = 60*60;
    const CACHE_CURRENT = 5*60;

    protected Current $Current;
    protected Forecast $Forecast;
    protected $Service;

    function __construct()
    {
        $this->Current = new Current();
        $this->Forecast = new Forecast();
        $this->Service = \Config\Services::curlrequest();
    }

    /**
     * @return bool
     */
    function forecast(): bool
    {
        if (cache('forecast')) return TRUE;

        $endpoint = 'forecast?lat=' . getenv('app.latitude') . '&lon=' . getenv('app.longitude');
        $response = $this->_endpoint($endpoint);

        foreach ($response->list as $item)
        {
            $time = $item->dt;
            $data = $this->_mapping($item);

            $this->Forecast->refresh($data, $time);
        }

        cache()->save('forecast', time(), self::CACHE_FORECAST);

        return TRUE;
    }

    /**
     * Получаем данные о текущей погоде с OpenWeatherMap
     * @return bool
     */
    function current(): bool
    {
        if (cache('current')) return TRUE;

        $endpoint = 'weather?lat=' . getenv('app.latitude') . '&lon=' . getenv('app.longitude');
        $response = $this->_endpoint($endpoint);

        try {
            $data = $this->_mapping($response, true);
            $this->Current->add($data);

            cache()->save('current', time(), self::CACHE_CURRENT);

            return TRUE;
        } catch (\Exception $e) {
            $log_data = ['m' => __METHOD__, 'e' => $e->getMessage(), 'd' => json_encode($response)];

            log_message('error', '[{m}] {e} {d}', $log_data);

            return FALSE;
        }
    }

    protected function _mapping(object $data, bool $current = false): array
    {
        $key = $current ? '1h' : '3h';

        return [
            'conditions'    => $data->weather[0]->id,
            'temperature'   => round($data->main->temp, 1),
            'feels_like'    => round($data->main->feels_like, 1),
            'humidity'      => $data->main->humidity,
            'pressure'      => round($data->main->grnd_level / 1.333, 1),
            'clouds'        => $data->clouds->all,
            'wind_speed'    => round($data->wind->speed, 1),
            'wind_deg'      => $data->wind->deg,
            'wind_gust'     => round($data->wind->gust, 1),
            'precipitation' => $data->rain->$key ?? ($data->snow->$key ?? 0),
        ];
    }

    private function _endpoint(string $name)
    {
        try {
            $response = $this->Service->get(self::API_URL . $name . '&appid=' . getenv('app.openweather.key') . '&units=metric&lang=ru');
            return json_decode($response->getBody());
        } catch (\Exception $e) {
            $log_data = ['m' => __METHOD__, 'e' => $e->getMessage(), 'd' => "(Endpoint URL: {$name})"];

            log_message('error', '[{m}] {e} {d}', $log_data);
        }
    }
}