<?php

namespace App\Models;

use App\Entities\WeatherDataEntity;
use CodeIgniter\Model;

class MigrateWeatherSensorsModel extends Model
{
    protected $table         = 'weather_sensors';
    protected $primaryKey    = 'id';
    protected $useTimestamps = false;
    protected $returnType    = 'object';
    protected $allowedFields = [];

    protected array $casts = [
        'item_utc_date' => 'datetime',
        'temperature'   => '?float',
        'humidity'      => '?float',
        'pressure'      => '?float',
    ];
}
