<?php

namespace App\Models;

use App\Entities\WeatherForecastEntity;
use CodeIgniter\Model;

/**
 * Model for the forecast_weather_data table.
 *
 * Stores forecast records fetched from external weather APIs. Provides
 * hourly and daily aggregation methods consumed by the Forecast controller
 * and the Current controller (next-hour precipitation look-ahead).
 *
 * @package App\Models
 */
class ForecastWeatherDataModel extends Model
{
    protected $table            = 'forecast_weather_data';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = WeatherForecastEntity::class;
    protected $useSoftDeletes   = false;
    protected $allowedFields    = [
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
    ];

    protected $useTimestamps = false;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $validationRules = [
        'forecast_time' => 'required|valid_date',
        'source'        => 'required|in_list[OpenWeatherMap,WeatherAPI,VisualCrossing,OpenMeteo,CustomStation,OtherSource]',
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
        'weather_id'    => 'permit_empty|integer',
    ];

    protected $validationMessages = [
        'source' => [
            'in_list' => 'The source must be one of: OpenWeatherMap, WeatherAPI, VisualCrossing, OpenMeteo, CustomStation, OtherSource.',
        ],
    ];

    protected $skipValidation = false;

    /**
     * Returns hourly-averaged forecast data starting from the current UTC hour
     * through the end of the next calendar day.
     *
     * @return array Rows of hourly aggregated forecast data.
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
     * Returns daily-averaged forecast data starting from today (UTC).
     *
     * @return array Rows of daily aggregated forecast data.
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

    /**
     * Builds the SELECT expression for hourly or daily aggregate grouping.
     *
     * @param string $groupBy Grouping level: 'hour' or 'day'.
     * @return string SQL SELECT fragment including all aggregated weather fields.
     */
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
