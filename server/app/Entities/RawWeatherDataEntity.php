<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class RawWeatherDataEntity extends Entity
{
    protected $attributes = [
        'id'             => null,
        'source'         => null,
        'timestamp'      => null,
        'sunrise'        => null,
        'sunset'         => null,
        'temp'           => null,
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
        'weather_desc'   => null,
        'weather_icon'   => null,
        'created_at'     => null,
        'updated_at'     => null,
    ];

    protected $dates = ['created_at', 'updated_at'];
    protected $casts = [
        'id'             => 'string',
        'source'         => 'string',
        'timestamp'      => 'datetime',
        'sunrise'        => 'datetime',
        'sunset'         => 'datetime',
        'temp'           => 'float',
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
        'weather_desc'   => 'string',
        'weather_icon'   => 'string',
    ];
}
