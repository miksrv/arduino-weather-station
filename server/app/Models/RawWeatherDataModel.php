<?php

namespace App\Models;

use CodeIgniter\Model;

class RawWeatherDataModel extends Model
{
    protected $table         = 'raw_weather_data';
    protected $primaryKey    = 'id';
    protected $useTimestamps = false;
    protected $returnType    = 'array';
    protected $allowedFields = [
        'timestamp',
        'source',
        'sunrise',
        'sunset',
        'temperature',
        'feels_like',
        'pressure',
        'humidity',
        'dew_point',
        'uvi',
        'clouds',
        'visibility',
        'wind_speed',
        'wind_deg',
        'wind_gust',
        'weather_id',
        'weather_main',
        'weather_icon'
    ];

    protected $validationRules = [
        'date'         => 'required|valid_date',
        'source'       => 'required|in_list[OpenWeatherMap,CustomStation,OtherSource]',
        'sunrise'      => 'permit_empty|valid_date',
        'sunset'       => 'permit_empty|valid_date',
        'temperature'  => 'permit_empty|decimal',
        'feels_like'   => 'permit_empty|decimal',
        'pressure'     => 'permit_empty|integer',
        'humidity'     => 'permit_empty|integer',
        'dew_point'    => 'permit_empty|decimal',
        'uvi'          => 'permit_empty|decimal',
        'clouds'       => 'permit_empty|integer',
        'visibility'   => 'permit_empty|integer',
        'wind_speed'   => 'permit_empty|decimal',
        'wind_deg'     => 'permit_empty|integer',
        'wind_gust'    => 'permit_empty|decimal',
        'weather_id'   => 'permit_empty|integer',
        'weather_main' => 'permit_empty|max_length[50]',
        'weather_icon' => 'permit_empty|max_length[10]',
    ];

    protected $validationMessages = [
        'source' => [
            'in_list' => 'The source must be one of: OpenWeatherMap, CustomStation, OtherSource.',
        ],
    ];

    protected $casts = [
        'date'         => 'datetime',
        'source'       => 'string',
        'sunrise'      => '?datetime',
        'sunset'       => '?datetime',
        'temperature'  => '?float',
        'feels_like'   => '?float',
        'pressure'     => '?int',
        'humidity'     => '?int',
        'dew_point'    => '?float',
        'uvi'          => '?float',
        'clouds'       => '?int',
        'visibility'   => '?int',
        'wind_speed'   => '?float',
        'wind_deg'     => '?int',
        'wind_gust'    => '?float',
        'weather_id'   => '?int',
        'weather_main' => '?string',
        'weather_icon' => '?string',
    ];
}
