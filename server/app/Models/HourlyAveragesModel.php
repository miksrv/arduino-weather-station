<?php

namespace App\Models;

use App\Entities\WeatherDataEntity;
use CodeIgniter\Model;

class HourlyAveragesModel extends Model
{
    protected $table         = 'hourly_averages';
    protected $primaryKey    = 'id';
    protected $useTimestamps = false;
    protected $returnType    = WeatherDataEntity::class;
    protected $allowedFields = [
        'date',
        'temperature',
        'feels_like',
        'pressure',
        'humidity',
        'dew_point',
        'uvi',
        'precipitation',
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
        'date'          => 'required|valid_date',
        'temperature'   => 'permit_empty|decimal',
        'feels_like'    => 'permit_empty|decimal',
        'pressure'      => 'permit_empty|decimal',
        'humidity'      => 'permit_empty|decimal',
        'dew_point'     => 'permit_empty|decimal',
        'uvi'           => 'permit_empty|decimal',
        'precipitation' => 'permit_empty|decimal',
        'clouds'        => 'permit_empty|decimal',
        'visibility'    => 'permit_empty|decimal',
        'wind_speed'    => 'permit_empty|decimal',
        'wind_deg'      => 'permit_empty|decimal',
        'wind_gust'     => 'permit_empty|decimal',
        'weather_id'    => 'permit_empty|integer',
        'weather_main'  => 'permit_empty|max_length[50]',
        'weather_icon'  => 'permit_empty|max_length[10]',
    ];

    protected $validationMessages = [

    ];

    protected array $casts = [
        'date'          => 'datetime',
        'temperature'   => '?float',
        'feels_like'    => '?float',
        'pressure'      => '?float',
        'humidity'      => '?float',
        'dew_point'     => '?float',
        'uvi'           => '?float',
        'precipitation' => '?float',
        'clouds'        => '?float',
        'visibility'    => '?float',
        'wind_speed'    => '?float',
        'wind_deg'      => '?float',
        'wind_gust'     => '?float',
        'weather_id'    => '?int',
    ];
}
