<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class HourlyWeatherDataEntity extends Entity
{
    protected $attributes = [
        'id'             => null,
        'source'         => null,
        'timestamp'      => null,
        'avg_temp'       => null,
        'avg_feels_like' => null,
        'avg_pressure'   => null,
        'avg_humidity'   => null,
        'avg_dew_point'  => null,
        'avg_uvi'        => null,
        'avg_clouds'     => null,
        'avg_visibility' => null,
        'avg_wind_speed' => null,
        'avg_wind_deg'   => null,
        'avg_wind_gust'  => null,
        'weather_id'     => null,
        'weather_main'   => null,
        'weather_icon'   => null,
        'created_at'     => null,
        'updated_at'     => null,
    ];

    protected $dates = ['created_at', 'updated_at'];
    protected $casts = [
        'id'             => 'string',
        'source'         => 'string',
        'timestamp'      => 'datetime',
        'avg_temp'       => 'float',
        'avg_feels_like' => 'float',
        'avg_pressure'   => 'integer',
        'avg_humidity'   => 'integer',
        'avg_dew_point'  => 'float',
        'avg_uvi'        => 'float',
        'avg_clouds'     => 'integer',
        'avg_visibility' => 'integer',
        'avg_wind_speed' => 'float',
        'avg_wind_deg'   => 'integer',
        'avg_wind_gust'  => 'float',
        'weather_id'     => 'integer',
        'weather_main'   => 'string',
        'weather_icon'   => 'string',
    ];
}