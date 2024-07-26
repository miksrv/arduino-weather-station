<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class RawWeatherDataEntity extends Entity
{
    protected $attributes = [
        'id'             => null,
        'source'         => null,
        'date'           => null,
        'temperature'    => null,
        'feels_like'     => null,
        'pressure'       => null,
        'humidity'       => null,
        'dew_point'      => null,
        'uvi'            => null,
        'clouds'         => null,
        'visibility'     => null,
        'wind_speed'     => null,
        'wind_deg'       => null,
        'wind_gust'      => null,
        'weather_id'     => null,
        'weather_main'   => null,
        'weather_icon'   => null,
    ];

    protected $dates = ['date'];
    protected $casts = [
        'id'             => 'integer',
        'source'         => 'string',
        'date'           => 'datetime',
        'temperature'    => 'float',
        'feels_like'     => 'float',
        'pressure'       => 'integer',
        'humidity'       => 'integer',
        'dew_point'      => 'float',
        'uvi'            => 'float',
        'clouds'         => 'integer',
        'visibility'     => 'integer',
        'wind_speed'     => 'float',
        'wind_deg'       => 'integer',
        'wind_gust'      => 'float',
        'weather_id'     => 'integer',
        'weather_main'   => 'string',
        'weather_icon'   => 'string',
    ];
}
