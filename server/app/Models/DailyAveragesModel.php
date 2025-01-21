<?php

namespace App\Models;

use App\Entities\WeatherDataEntity;
use CodeIgniter\Model;

/**
 * Class DailyAveragesModel
 *
 * This class represents the model for daily weather averages, providing methods to interact with the database.
 *
 * @package App\Models
 *
 * Public Methods:
 * - getWeatherHistoryGrouped($startDate, $endDate, $groupInterval): Retrieves and returns weather history data grouped by a specified interval.
 *
 * Usage:
 * $dailyAveragesModel = new DailyAveragesModel();
 * $data = $dailyAveragesModel->getWeatherHistoryGrouped('2023-01-01', '2023-01-31', '1 day');
 */
class DailyAveragesModel extends Model
{
    protected $table         = 'daily_averages';
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
        'date'          => 'required|valid_date',
        'temperature'   => 'permit_empty|decimal',
        'feels_like'    => 'permit_empty|decimal',
        'pressure'      => 'permit_empty|decimal',
        'humidity'      => 'permit_empty|decimal',
        'dew_point'     => 'permit_empty|decimal',
        'uv_index'      => 'permit_empty|decimal',
        'sol_energy'    => 'permit_empty|decimal',
        'sol_radiation' => 'permit_empty|decimal',
        'precipitation' => 'permit_empty|decimal',
        'clouds'        => 'permit_empty|decimal',
        'visibility'    => 'permit_empty|decimal',
        'wind_speed'    => 'permit_empty|decimal',
        'wind_deg'      => 'permit_empty|decimal',
        'wind_gust'     => 'permit_empty|decimal',
        'weather_id'    => 'permit_empty|integer'
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
        'uv_index'      => '?float',
        'sol_energy'    => '?float',
        'sol_radiation' => '?float',
        'precipitation' => '?float',
        'clouds'        => '?float',
        'visibility'    => '?float',
        'wind_speed'    => '?float',
        'wind_deg'      => '?float',
        'wind_gust'     => '?float',
        'weather_id'    => '?int'
    ];

    /**
     * @param $startDate
     * @param $endDate
     * @param $groupInterval
     * @return array
     */
    public function getWeatherHistoryGrouped($startDate, $endDate, $groupInterval): array
    {
        return $this
            ->select('DATE_FORMAT(date, "%Y-%m-%d %H:%i:00") as date,' . RawWeatherDataModel::getSelectAverageSQL())
            ->where('date >=', $startDate)
            ->where('date <=', $endDate)
            ->groupBy("FLOOR(UNIX_TIMESTAMP(date)/" . (strtotime('+' . $groupInterval) - strtotime('now')) . ")")
            ->orderBy('date', 'ASC')
            ->get()
            ->getResultArray();
    }
}
