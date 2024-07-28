<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class WeatherForecastEntity extends Entity
{
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
        'weather_main'   => null,
        'weather_icon'   => null,
        'interval_hours' => null,
    ];

    protected $dates = ['forecast_time'];
    protected $casts = [
        'id'             => 'integer',
        'source'         => 'string',
        'forecast_time'  => 'datetime',
        'temperature'    => 'float',
        'feels_like'     => 'float',
        'pressure'       => 'integer',
        'humidity'       => 'integer',
        'dew_point'      => 'float',
        'uv_index'       => 'float',
        'sol_energy'     => 'float',
        'sol_radiation'  => 'float',
        'clouds'         => 'integer',
        'precipitation'  => 'float',
        'visibility'     => 'integer',
        'wind_speed'     => 'float',
        'wind_deg'       => 'integer',
        'wind_gust'      => 'float',
        'weather_id'     => 'integer',
        'weather_main'   => 'string',
        'weather_icon'   => 'string',
        'interval_hours' => 'integer',
    ];
}
