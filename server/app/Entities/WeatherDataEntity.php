<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

/**
 * Class WeatherDataEntity
 *
 * This class is used for setting weather data before saving the current weather values from any source into the database.
 *
 * @package App\Entities
 *
 * Properties:
 * - int|null $id: The unique identifier of the weather data record.
 * - string|null $source: The source of the weather data.
 * - \DateTime|null $date: The date and time of the weather data.
 * - float|null $temperature: The temperature value.
 * - float|null $feelsLike: The feels-like temperature value.
 * - int|null $pressure: The atmospheric pressure value.
 * - int|null $humidity: The humidity percentage.
 * - float|null $dewPoint: The dew point temperature.
 * - float|null $uvIndex: The UV index value.
 * - float|null $solEnergy: The solar energy value.
 * - float|null $solRadiation: The solar radiation value.
 * - int|null $clouds: The cloudiness percentage.
 * - float|null $precipitation: The precipitation amount.
 * - int|null $visibility: The visibility distance.
 * - float|null $windSpeed: The wind speed value.
 * - int|null $windDeg: The wind direction in degrees.
 * - float|null $windGust: The wind gust speed value.
 * - int|null $weatherId: The weather condition ID.
 *
 * Usage:
 * $weatherDataEntity = new WeatherDataEntity();
 * $weatherDataEntity->fill($dataArray);
 */
class WeatherDataEntity extends Entity
{
    protected $attributes = [
        'id'            => null,
        'source'        => null,
        'date'          => null,
        'temperature'   => null,
        'feels_like'    => null,
        'pressure'      => null,
        'humidity'      => null,
        'dew_point'     => null,
        'uv_index'      => null,
        'sol_energy'    => null,
        'sol_radiation' => null,
        'clouds'        => null,
        'precipitation' => null,
        'visibility'    => null,
        'wind_speed'    => null,
        'wind_deg'      => null,
        'wind_gust'     => null,
        'weather_id'    => null
    ];

    protected $dates = ['date'];
    protected $casts = [
        'id'            => 'integer',
        'source'        => 'string',
        'date'          => 'datetime',
        'temperature'   => 'float',
        'feels_like'    => 'float',
        'pressure'      => 'integer',
        'humidity'      => 'integer',
        'dew_point'     => 'float',
        'uv_index'      => 'float',
        'sol_energy'    => 'float',
        'sol_radiation' => 'float',
        'clouds'        => 'integer',
        'precipitation' => 'float',
        'visibility'    => 'integer',
        'wind_speed'    => 'float',
        'wind_deg'      => 'integer',
        'wind_gust'     => 'float',
        'weather_id'    => 'integer'
    ];

    protected $datamap = [
        'feelsLike'    => 'feels_like',
        'dewPoint'     => 'dew_point',
        'uvIndex'      => 'uv_index',
        'solEnergy'    => 'sol_energy',
        'solRadiation' => 'sol_radiation',
        'windSpeed'    => 'wind_speed',
        'windDeg'      => 'wind_deg',
        'windGust'     => 'wind_gust',
        'weatherId'    => 'weather_id'
    ];
}
