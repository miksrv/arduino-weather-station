<?php

namespace App\Models;

use App\Entities\WeatherDataEntity;
use CodeIgniter\Model;

class RawWeatherDataModel extends Model
{
    const SOURCE_OPENWEATHERMAP = 'OpenWeatherMap';
    const SOURCE_WEATHERAPI = 'WeatherAPI';
    const SOURCE_VISUALCROSSING = 'VisualCrossing';
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
        'uv_index',
        'sol_energy',
        'sol_radiation',
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
        'weather_id'    => 'permit_empty|integer',
        'weather_main'  => 'permit_empty|max_length[50]',
        'weather_icon'  => 'permit_empty|max_length[50]',
    ];

    protected $validationMessages = [
        'source' => [
            'in_list' => 'The source must be one of: OpenWeatherMap, WeatherAPI, VisualCrossing, CustomStation, OtherSource.',
        ],
    ];

    protected array $casts = [
        'date'          => 'datetime',
        'temperature'   => '?float',
        'feels_like'    => '?float',
        'pressure'      => '?int',
        'humidity'      => '?float',
        'dew_point'     => '?float',
        'uv_index'      => '?float',
        'sol_energy'    => '?float',
        'sol_radiation' => '?float',
        'precipitation' => '?float',
        'clouds'        => '?int',
        'visibility'    => '?int',
        'wind_speed'    => '?float',
        'wind_deg'      => '?int',
        'wind_gust'     => '?float',
        'weather_id'    => '?int',
    ];

    /**
     * @param $allTime
     * @return array
     */
    public function getHourlyAverages($allTime = false): array
    {
        $result = $this->select($this->_getAverageSelect('hour'));

        if (!$allTime) {
            $result
                ->where('date >= DATE_FORMAT(NOW(), \'%Y-%m-%d %H:00:00\')')
                ->where('date < DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 HOUR), \'%Y-%m-%d %H:00:00\')');
        }

        return $result
            ->groupBy('hour')
            ->get()
            ->getResultArray();
    }

    /**
     * @param false $allTime
     * @return array
     */
    public function getDailyAverages(bool $allTime = false): array
    {
        $result = $this->select($this->_getAverageSelect('day'));

        if (!$allTime) {
            $result
                ->where('date >= DATE_FORMAT(NOW(), \'%Y-%m-%d 00:00:00\')')
                ->where('date < DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 DAY), \'%Y-%m-%d 00:00:00\')');
        }

        return $result
            ->groupBy('day')
            ->get()
            ->getResultArray();
    }

    /**
     * A method that gets data for the last 20 minutes.
     *
     * @return array
     */
    public function getRecentAverages(): array
    {
        $builder = $this->db->table($this->table);
        $builder->select($this->_getSelectAverageSQL());
        $builder->limit(3);

        $query = $builder->get();
        return $query->getRowArray();
    }

    /**
     * A method that gets the latest data for fields that are updated less frequently.
     * @param $fields
     * @return array
     */
    public function getLatestWeatherData($fields): array
    {
        $result = [];
        foreach ($fields as $field) {
            $data = $this->select($field)
                ->orderBy('date', 'DESC')
                ->limit(1)
                ->first();

            $result[$field] = $data?->{$field};
        }

        return $result;
    }

    /**
     * A method that gets the time of the last update of data in the database.
     * @return mixed|null
     */
    public function getLastUpdateTime(): mixed
    {
        $data = $this->select('date')
            ->orderBy('date', 'DESC')
            ->limit(1)
            ->first();

        return $data?->date;
    }

    /**
     * @param string $groupBy
     * @return string
     */
    private function _getAverageSelect(string $groupBy): string
    {
        $formatHours = $groupBy === 'hour' ? '%H:00:00' : '00:00:00';

        return 'DATE_FORMAT(date, "%Y-%m-%d ' . $formatHours . '") as ' . $groupBy . ',
                DATE_FORMAT(date, "%Y-%m-%d ' . $formatHours . '") AS date, ' . $this->_getSelectAverageSQL();
    }

    /**
     * @return string
     */
    private function _getSelectAverageSQL(): string
    {
        return 'ROUND(AVG(temperature), 2) as temperature,' .
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
            'MAX(weather_id) as weather_id,' .
            'MAX(weather_main) as weather_main,' .
            'MAX(weather_icon) as weather_icon';
    }
}