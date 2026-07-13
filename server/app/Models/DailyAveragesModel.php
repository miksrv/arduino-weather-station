<?php

namespace App\Models;

use App\Entities\WeatherDataEntity;
use CodeIgniter\Model;

/**
 * Model for the daily_averages table.
 *
 * Stores pre-computed daily weather aggregates derived from raw_weather_data.
 * Consumed by the History controller (date ranges >7 days), the Climate and
 * Anomaly controllers, the AnomalyModel orchestrator, and several CLI commands.
 *
 * @package App\Models
 */
class DailyAveragesModel extends Model
{
    /** @var string[] Allowed interval strings for GROUP BY calculations */
    private const ALLOWED_INTERVALS = ['10 MINUTE', '1 HOUR', '1 DAY'];

    protected $table            = 'daily_averages';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = WeatherDataEntity::class;
    protected $useSoftDeletes   = false;
    protected $allowedFields    = [
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
        'weather_id',
        'pm2_5',
        'pm10',
        'co',
        'no2',
        'so2',
        'o3',
    ];

    protected $useTimestamps = false;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

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
        'weather_id'    => 'permit_empty|integer',
        'pm2_5'         => 'permit_empty|decimal',
        'pm10'          => 'permit_empty|decimal',
        'co'            => 'permit_empty|decimal',
        'no2'           => 'permit_empty|decimal',
        'so2'           => 'permit_empty|decimal',
        'o3'            => 'permit_empty|decimal',
    ];

    protected $validationMessages = [];

    protected $skipValidation = false;

    /**
     * Returns daily-grouped weather history rows within the given date range.
     *
     * @param string $startDate     Start of the date range (Y-m-d H:i:s).
     * @param string $endDate       End of the date range (Y-m-d H:i:s).
     * @param string $groupInterval Grouping interval — one of '10 MINUTE', '1 HOUR', '1 DAY'.
     * @return array Rows of grouped weather data.
     * @throws \InvalidArgumentException When $groupInterval is not in the allowed list.
     */
    public function getWeatherHistoryGrouped(string $startDate, string $endDate, string $groupInterval): array
    {
        if (!in_array(strtoupper($groupInterval), self::ALLOWED_INTERVALS, true)) {
            throw new \InvalidArgumentException('Invalid groupInterval value: ' . $groupInterval);
        }

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
