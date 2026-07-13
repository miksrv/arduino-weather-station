<?php

namespace App\Libraries;

/**
 * Contract implemented by every external weather data provider library
 * (OpenWeatherMap, WeatherAPI.com, VisualCrossing, etc.) so that
 * `system:getCurrentWeather` and `system:getForecastWeather` can poll
 * them interchangeably without duck-typing.
 */
interface WeatherProviderInterface
{
    /**
     * Receive current weather data mapped to the internal schema.
     *
     * @return array|false
     */
    public function getWeatherData(): array|false;

    /**
     * Receive forecast weather data mapped to the internal schema.
     *
     * @return array|false
     */
    public function getForecastWeatherData(): array|false;

    /**
     * Returns the short, human-readable name of this provider (used for
     * CLI output and logging), e.g. "OpenWeather" for OpenWeatherAPILibrary.
     *
     * @return string
     */
    public function getSourceName(): string;
}
