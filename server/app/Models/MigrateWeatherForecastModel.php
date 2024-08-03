<?php

namespace App\Models;

use App\Entities\WeatherDataEntity;
use CodeIgniter\Model;

class MigrateWeatherForecastModel extends Model
{
    protected $table         = 'weather_forecast';
    protected $primaryKey    = 'id';
    protected $useTimestamps = false;
    protected $returnType    = 'object';
    protected $allowedFields = [];

    protected array $casts = [
        'item_utc_date' => 'datetime',
        'conditions'    => '?int',
        'temperature'   => '?float',
        'feels_like'    => '?float',
        'humidity'      => '?float',
        'pressure'      => '?float',
        'clouds'        => '?int',
        'wind_speed'    => '?float',
        'wind_deg'      => '?int',
        'wind_gust'     => '?float',
        'precipitation' => '?float'
    ];
}
