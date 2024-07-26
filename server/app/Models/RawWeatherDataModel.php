<?php

namespace App\Models;

use App\Entities\WeatherDataEntity;
use CodeIgniter\Model;

class RawWeatherDataModel extends Model
{
    const SOURCE_OPENWEATHERMAP = 'OpenWeatherMap';
    const SOURCE_CUSTOMSTATION = 'CustomStation';
    const SOURCE_OTHERSOURCE = 'OtherSource';

    protected $table         = 'raw_weather_data';
    protected $primaryKey    = 'id';
    protected $useTimestamps = false;
    protected $returnType    = WeatherDataEntity::class;
    protected $allowedFields = [
        'date',
        'source',
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
        'temperature'  => 'permit_empty|decimal',
        'feels_like'   => 'permit_empty|decimal',
        'pressure'     => 'permit_empty|integer',
        'humidity'     => 'permit_empty|decimal',
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

    protected array $casts = [
        'date'         => 'datetime',
        'temperature'  => '?float',
        'feels_like'   => '?float',
        'pressure'     => '?int',
        'humidity'     => '?float',
        'dew_point'    => '?float',
        'uvi'          => '?float',
        'clouds'       => '?int',
        'visibility'   => '?int',
        'wind_speed'   => '?float',
        'wind_deg'     => '?int',
        'wind_gust'    => '?float',
        'weather_id'   => '?int',
    ];
}
