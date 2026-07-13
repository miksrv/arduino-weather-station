<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/**
 * Registry of all external weather provider libraries polled by
 * `system:getCurrentWeather` and `system:getForecastWeather`.
 */
class WeatherProviders extends BaseConfig
{
    /**
     * FQCNs of all WeatherProviderInterface implementations polled by
     * system:getCurrentWeather and system:getForecastWeather.
     * @var class-string<\App\Libraries\WeatherProviderInterface>[]
     */
    public array $providers = [
        \App\Libraries\VisualCrossingAPILibrary::class,
        \App\Libraries\WeatherAPILibrary::class,
        \App\Libraries\OpenWeatherAPILibrary::class,
        \App\Libraries\OpenMeteoAPILibrary::class,
    ];
}
