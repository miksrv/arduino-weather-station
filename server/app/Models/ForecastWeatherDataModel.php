<?php

namespace App\Models;

use App\Entities\WeatherForecastEntity;
use CodeIgniter\Model;

class ForecastWeatherDataModel extends Model
{
    protected $table         = 'forecast_weather_data';
    protected $primaryKey    = 'id';
    protected $useTimestamps = false;
    protected $returnType    = WeatherForecastEntity::class;
    protected $allowedFields = [
        'forecast_time',
        'source',
        'temperature',
        'feels_like',
        'pressure',
        'humidity',
        'dew_point',
        'uv_index',
        'sol_energy',
        'sol_radiation',
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
        'forecast_time'  => 'required|valid_date',
        'source'         => 'required|in_list[OpenWeatherMap,WeatherAPI,VisualCrossing,CustomStation,OtherSource]',
        'temperature'    => 'permit_empty|decimal',
        'feels_like'     => 'permit_empty|decimal',
        'pressure'       => 'permit_empty|integer',
        'humidity'       => 'permit_empty|decimal',
        'dew_point'      => 'permit_empty|decimal',
        'uv_index'       => 'permit_empty|decimal',
        'sol_energy'     => 'permit_empty|decimal',
        'sol_radiation'  => 'permit_empty|decimal',
        'precipitation'  => 'permit_empty|decimal',
        'clouds'         => 'permit_empty|integer',
        'visibility'     => 'permit_empty|integer',
        'wind_speed'     => 'permit_empty|decimal',
        'wind_deg'       => 'permit_empty|integer',
        'wind_gust'      => 'permit_empty|decimal',
        'weather_id'     => 'permit_empty|integer',
        'weather_main'   => 'permit_empty|max_length[50]',
        'weather_icon'   => 'permit_empty|max_length[50]'
    ];

    protected $validationMessages = [
        'source' => [
            'in_list' => 'The source must be one of: OpenWeatherMap, WeatherAPI, VisualCrossing, CustomStation, OtherSource.',
        ],
    ];

    protected array $casts = [
        'forecast_time'  => 'datetime',
        'temperature'    => '?float',
        'feels_like'     => '?float',
        'pressure'       => '?int',
        'humidity'       => '?float',
        'dew_point'      => '?float',
        'uv_index'       => '?float',
        'sol_energy'     => '?float',
        'sol_radiation'  => '?float',
        'clouds'         => '?int',
        'visibility'     => '?int',
        'wind_speed'     => '?float',
        'wind_deg'       => '?int',
        'wind_gust'      => '?float',
        'weather_id'     => '?int'
    ];

    public function getHourlyAverages($allTime = false): array
    {
        $result = $this->select($this->_getAverageSelect('hour'));

        if (!$allTime) {
            $result
                ->where('forecast_time >= DATE_FORMAT(NOW(), \'%Y-%m-%d %H:00:00\')')
                ->where('forecast_time < DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 HOUR), \'%Y-%m-%d %H:00:00\')');
        }

        return $result
            ->groupBy('hour')
            ->get()
            ->getResultArray();
    }

    public function getDailyAverages($allTime = false): array
    {
        $result = $this->select($this->_getAverageSelect('day'));

        if (!$allTime) {
            $result
                ->where('forecast_time >= DATE_FORMAT(NOW(), \'%Y-%m-%d 00:00:00\')')
                ->where('forecast_time < DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 DAY), \'%Y-%m-%d 00:00:00\')');
        }

        return $result
            ->groupBy('day')
            ->get()
            ->getResultArray();
    }

    private function _getAverageSelect(string $groupBy): string
    {
        $formatHours = $groupBy === 'hour' ? '%H:00:00' : '00:00:00';

        return 'DATE_FORMAT(forecast_time, "%Y-%m-%d ' . $formatHours . '") as ' . $groupBy . ',
                DATE_FORMAT(forecast_time, "%Y-%m-%d ' . $formatHours . '") AS forecast_time,
                AVG(temperature) as temperature,
                AVG(feels_like) as feels_like,
                AVG(pressure) as pressure,
                AVG(humidity) as humidity,
                AVG(dew_point) as dew_point,
                AVG(uv_index) as uv_index,
                AVG(sol_energy) as sol_energy,
                AVG(sol_radiation) as sol_radiation,
                AVG(precipitation) as precipitation,
                AVG(clouds) as clouds,
                AVG(visibility) as visibility,
                AVG(wind_speed) as wind_speed,
                AVG(wind_deg) as wind_deg,
                AVG(wind_gust) as wind_gust,
                MAX(weather_id) as weather_id,
                MAX(weather_main) as weather_main,
                MAX(weather_icon) as weather_icon';
    }
}