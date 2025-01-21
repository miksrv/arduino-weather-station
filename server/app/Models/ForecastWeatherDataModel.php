<?php

namespace App\Models;

use App\Entities\WeatherForecastEntity;
use CodeIgniter\Model;

/**
 * Class ForecastWeatherDataModel
 *
 * This class represents the model for forecast weather data, providing methods to interact with the database and retrieve weather forecasts.
 *
 * @package App\Models
 *
 * Public Methods:
 * - getHourlyAverages(): Retrieves and returns hourly average forecast weather data.
 * - getDailyAverages(): Retrieves and returns daily average forecast weather data.
 *
 * Usage:
 * $forecastWeatherDataModel = new ForecastWeatherDataModel();
 * $hourlyAverages = $forecastWeatherDataModel->getHourlyAverages();
 * $dailyAverages = $forecastWeatherDataModel->getDailyAverages();
 */
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
        'weather_id'
    ];

    protected $validationRules = [
        'forecast_time' => 'required|valid_date',
        'source'        => 'required|in_list[OpenWeatherMap,WeatherAPI,VisualCrossing,CustomStation,OtherSource]',
        'temperature'   => 'permit_empty|decimal',
        'feels_like'    => 'permit_empty|decimal',
        'pressure'      => 'permit_empty|integer',
        'humidity'      => 'permit_empty|decimal',
        'dew_point'     => 'permit_empty|decimal',
        'uv_index'      => 'permit_empty|decimal',
        'sol_energy'    => 'permit_empty|decimal',
        'sol_radiation' => 'permit_empty|decimal',
        'precipitation' => 'permit_empty|decimal',
        'clouds'        => 'permit_empty|integer',
        'visibility'    => 'permit_empty|integer',
        'wind_speed'    => 'permit_empty|decimal',
        'wind_deg'      => 'permit_empty|integer',
        'wind_gust'     => 'permit_empty|decimal',
        'weather_id'    => 'permit_empty|integer'
    ];

    protected $validationMessages = [
        'source' => [
            'in_list' => 'The source must be one of: OpenWeatherMap, WeatherAPI, VisualCrossing, CustomStation, OtherSource.',
        ],
    ];

    protected array $casts = [
        'forecast_time' => 'datetime',
        'temperature'   => '?float',
        'feels_like'    => '?float',
        'pressure'      => '?int',
        'humidity'      => '?float',
        'dew_point'     => '?float',
        'uv_index'      => '?float',
        'sol_energy'    => '?float',
        'sol_radiation' => '?float',
        'clouds'        => '?int',
        'visibility'    => '?int',
        'wind_speed'    => '?float',
        'wind_deg'      => '?int',
        'wind_gust'     => '?float',
        'weather_id'    => '?int'
    ];

    /**
     * @return array
     */
    public function getHourlyAverages(): array
    {
        return $this
            ->select($this->_getAverageSelect('hour'))
            ->where('forecast_time >= DATE_FORMAT(UTC_TIMESTAMP(), \'%Y-%m-%d %H:00:00\')')
            ->where('forecast_time < DATE_FORMAT(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY), \'%Y-%m-%d %H:00:00\')')
            ->groupBy('hour')
            ->get()
            ->getResultArray();
    }

    /**
     * @return array
     */
    public function getDailyAverages(): array
    {
        return $this
            ->select($this->_getAverageSelect('day'))
            ->where('forecast_time >= DATE_FORMAT(UTC_TIMESTAMP(), \'%Y-%m-%d 00:00:00\')')
            ->groupBy('day')
            ->get()
            ->getResultArray();
    }

    private function _getAverageSelect(string $groupBy): string
    {
        $formatHours = $groupBy === 'hour' ? '%H:00:00' : '00:00:00';

        return 'DATE_FORMAT(forecast_time, "%Y-%m-%d ' . $formatHours . '") as ' . $groupBy . ',' .
            'DATE_FORMAT(forecast_time, "%Y-%m-%d ' . $formatHours . '") AS date,' .
            'ROUND(AVG(temperature), 2) as temperature,' .
            'ROUND(AVG(feels_like), 2) as feels_like,' .
            'ROUND(AVG(pressure), 2) as pressure,' .
            'ROUND(AVG(humidity), 2) as humidity,' .
            'ROUND(AVG(dew_point), 2) as dew_point,' .
            'ROUND(AVG(uv_index), 2) as uv_index,' .
            'ROUND(AVG(sol_energy), 2) as sol_energy,' .
            'ROUND(AVG(sol_radiation), 2) as sol_radiation,' .
            'ROUND(AVG(precipitation), 2) as precipitation,' .
            'ROUND(AVG(clouds), 2) as clouds,' .
            'ROUND(AVG(visibility), 2) as visibility,' .
            'ROUND(AVG(wind_speed), 2) as wind_speed,' .
            'ROUND(AVG(wind_deg), 2) as wind_deg,' .
            'ROUND(AVG(wind_gust), 2) as wind_gust,' .
            'MAX(weather_id) as weather_id,';
    }
}
