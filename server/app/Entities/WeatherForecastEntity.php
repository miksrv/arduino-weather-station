<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

/**
 * CI4 Entity for forecast weather records persisted to forecast_weather_data.
 *
 * Populated by GetForecastWeather (bulk insert/update from external API
 * libraries) and read by ForecastWeatherDataModel for the Forecast controller
 * and the Current controller's one-hour precipitation look-ahead.
 *
 * @package App\Entities
 *
 * @property int|null    $id
 * @property string|null $source
 * @property mixed       $forecastTime Maps to DB column forecast_time; cast to CodeIgniter\I18n\Time on read.
 * @property float|null  $temperature
 * @property float|null  $feelsLike    Maps to DB column feels_like.
 * @property int|null    $pressure
 * @property int|null    $humidity
 * @property float|null  $dewPoint     Maps to DB column dew_point.
 * @property float|null  $uvIndex      Maps to DB column uv_index.
 * @property float|null  $solEnergy    Maps to DB column sol_energy.
 * @property float|null  $solRadiation Maps to DB column sol_radiation.
 * @property int|null    $clouds
 * @property float|null  $precipitation
 * @property int|null    $visibility
 * @property float|null  $windSpeed    Maps to DB column wind_speed.
 * @property int|null    $windDeg      Maps to DB column wind_deg.
 * @property float|null  $windGust     Maps to DB column wind_gust.
 * @property int|null    $weatherId    Maps to DB column weather_id.
 */
class WeatherForecastEntity extends Entity
{
    /**
     * Default values for all mapped database columns.
     * Keys must match the actual column names in forecast_weather_data.
     */
    protected $attributes = [
        'id'             => null,
        'source'         => null,
        'forecast_time'  => null,
        'temperature'    => null,
        'feels_like'     => null,
        'pressure'       => null,
        'humidity'       => null,
        'dew_point'      => null,
        'uv_index'       => null,
        'sol_energy'     => null,
        'sol_radiation'  => null,
        'clouds'         => null,
        'precipitation'  => null,
        'visibility'     => null,
        'wind_speed'     => null,
        'wind_deg'       => null,
        'wind_gust'      => null,
        'weather_id'     => null,
    ];

    /**
     * Type casts applied on get/set for each column.
     * Numeric columns use nullable variants ('?integer', '?float') so that
     * NULL values in the database are preserved rather than coerced to 0.
     */
    protected $casts = [
        'id'             => '?integer',
        'source'         => 'string',
        'temperature'    => '?float',
        'feels_like'     => '?float',
        'pressure'       => '?integer',
        'humidity'       => '?integer',
        'dew_point'      => '?float',
        'uv_index'       => '?float',
        'sol_energy'     => '?float',
        'sol_radiation'  => '?float',
        'clouds'         => '?integer',
        'precipitation'  => '?float',
        'visibility'     => '?integer',
        'wind_speed'     => '?float',
        'wind_deg'       => '?integer',
        'wind_gust'      => '?float',
        'weather_id'     => '?integer',
    ];

    /**
     * Date/datetime columns that CI4 automatically mutates to Time instances.
     * These columns must NOT also appear in $casts with a datetime cast to
     * avoid double-processing; the $dates array takes precedence.
     */
    protected $dates = ['forecast_time'];

    /**
     * Maps camelCase property access to snake_case database column names.
     * Required for columns whose names differ from their PHP property names.
     */
    protected $datamap = [
        'forecastTime' => 'forecast_time',
        'feelsLike'    => 'feels_like',
        'dewPoint'     => 'dew_point',
        'uvIndex'      => 'uv_index',
        'solEnergy'    => 'sol_energy',
        'solRadiation' => 'sol_radiation',
        'windSpeed'    => 'wind_speed',
        'windDeg'      => 'wind_deg',
        'windGust'     => 'wind_gust',
        'weatherId'    => 'weather_id',
    ];
}
