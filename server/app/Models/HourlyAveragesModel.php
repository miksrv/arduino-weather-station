<?php

namespace App\Models;

use CodeIgniter\Model;

class HourlyAveragesModel extends Model
{
    protected $table          = 'hourly_averages';
    protected $primaryKey     = 'id';
    protected $useTimestamps  = false;
    protected $returnType     = 'array';
    protected $allowedFields  = [
        'hour',
        'average_temperature',
        'average_feels_like',
        'average_pressure',
        'average_humidity',
        'average_dew_point',
        'average_uvi',
        'average_clouds',
        'average_visibility',
        'average_wind_speed',
        'average_wind_deg',
        'average_wind_gust',
        'weather_id',
        'weather_main',
        'weather_icon'
    ];

    protected $validationRules = [
        'hour'                => 'required|valid_date',
        'average_temperature' => 'permit_empty|decimal',
        'average_feels_like'  => 'permit_empty|decimal',
        'average_pressure'    => 'permit_empty|decimal',
        'average_humidity'    => 'permit_empty|decimal',
        'average_dew_point'   => 'permit_empty|decimal',
        'average_uvi'         => 'permit_empty|decimal',
        'average_clouds'      => 'permit_empty|decimal',
        'average_visibility'  => 'permit_empty|decimal',
        'average_wind_speed'  => 'permit_empty|decimal',
        'average_wind_deg'    => 'permit_empty|decimal',
        'average_wind_gust'   => 'permit_empty|decimal',
        'weather_id'          => 'permit_empty|integer',
        'weather_main'        => 'permit_empty|max_length[50]',
        'weather_icon'        => 'permit_empty|max_length[10]',
    ];

    protected $validationMessages = [

    ];

    protected $casts = [
        'hour'                => 'datetime',
        'average_temperature' => '?float',
        'average_feels_like'  => '?float',
        'average_pressure'    => '?float',
        'average_humidity'    => '?float',
        'average_dew_point'   => '?float',
        'average_uvi'         => '?float',
        'average_clouds'      => '?float',
        'average_visibility'  => '?float',
        'average_wind_speed'  => '?float',
        'average_wind_deg'    => '?float',
        'average_wind_gust'   => '?float',
        'weather_id'          => '?int',
        'weather_main'        => '?string',
        'weather_icon'        => '?string',
    ];
}
