<?php

namespace App\Libraries;

use App\Models\Sensors;
use App\Models\Current;
use App\Models\Forecast;

interface ISensorItem
{
    function __construct(array $data, string $type);
}

class SensorItem implements ISensorItem
{
    public float $value;
    public float $trend = 0;
    public float $min;
    public float $max;
    public string $type;

    function __construct(array $data, string $type)
    {
        $this->type = $type;
        $this->_mapping($data);
    }

    private function _mapping(array $data) {
        $type  = $this->type;
        $count = 0;

        foreach ($data as $item)
        {
            if (! property_exists($item, $type))
                continue;

            $time_diff = round(abs(strtotime($item->item_utc_date . ' UTC') - gmdate('U')) / 60,0);

            if ($count === 0)
            {
                $this->min = $this->max = $item->$type;
                $this->value = $item->$type;
            }

            if ($item->$type < $this->min) $this->min = $item->$type;
            if ($item->$type > $this->max) $this->max = $item->$type;
            if ($time_diff < 60) $this->trend += $item->$type;

            $count++;
        }

        if ($count !== 0) $this->trend = round($this->value - ($this->trend / $count), 1);
    }
}

/**
 * Weather station methods
 */
class ApiWeather {
    const TIME_ACTUAL = 15;
    const TIME_OUTDATED = 30;

    protected $Sensors;
    protected $Current;
    protected $Forecast;

    function __construct()
    {
        $this->Sensors = new Sensors();
        $this->Current = new Current();
        $this->Forecast = new Forecast();
    }

    function get_sensors(): object
    {
        $result  = [];
        $weather = $this->Current->get_last_day();
        $sensors = $this->Sensors->get_last_day();

        $time_diff   = round(abs(strtotime($sensors[0]->item_utc_date) - strtotime($weather[0]->item_utc_date)) / 60,0);
        $data_actual = $time_diff < self::TIME_ACTUAL;
        $time_update = strtotime($data_actual ? $sensors[0]->item_utc_date : $weather[0]->item_utc_date . ' UTC');

        $result[] = new SensorItem(($data_actual ? $sensors : $weather), 'temperature');
        $result[] = new SensorItem(($data_actual ? $sensors : $weather), 'humidity');
        $result[] = new SensorItem(($data_actual ? $sensors : $weather), 'pressure');
        $result[] = new SensorItem(($data_actual ? $sensors : $weather), 'wind_speed');
        $result[] = new SensorItem($weather, 'wind_gust');
        $result[] = new SensorItem(($data_actual ? $sensors : $weather), 'wind_deg');
        $result[] = new SensorItem($weather, 'clouds');
        $result[] = new SensorItem($weather, 'precipitation');

        if ($data_actual)
        {
            $result[] = new SensorItem($sensors, 'illumination');
            $result[] = new SensorItem($sensors, 'uvindex');
        }

        return (object) ['update' => $time_update, 'payload' => $result];
    }

    function get_forecast(): object
    {
        $weather  = [];
        $forecast = $this->Forecast->get_last();

        foreach ($forecast as $item) {
            $weather[] = (object) [
                'time'          => strtotime($item->item_utc_date . ' UTC'),
                'condition_id'  => (int) $item->conditions,
                'temperature'   => (float) $item->temperature,
                'clouds'        => (int) $item->clouds,
                'precipitation' => (float) $item->precipitation,
            ];
        }

        return (object) ['update' => cache('forecast'), 'payload' => $weather];
    }

    function get_last(): object
    {
        $sensors = $this->Sensors->get_last();
        $current = $this->Current->get_last();

        $time_diff = round(abs(strtotime($sensors->item_utc_date) - strtotime($current->item_utc_date)) / 60,0);

        $actual   = $time_diff < self::TIME_ACTUAL;
        $outdated = $time_diff > self::TIME_OUTDATED;

        $update  = strtotime($actual ? $sensors->item_utc_date : $current->item_utc_date . ' UTC');
        $weather = [
            'condition_id'      => (int) $current->conditions,
            'temperature'       => (float) ($actual ? $sensors->temperature : $current->temperature),
            'temperature_feels' => (float) $current->feels_like,
            'humidity'          => (float) ($actual ? $sensors->humidity : $current->humidity),
            'pressure'          => (float) ($actual ? $sensors->pressure : $current->pressure),
            'wind_speed'        => (float) ($actual ? $sensors->wind_speed : $current->wind_speed),
            'wind_gust'         => (float) $current->wind_gust,
            'wind_degree'       => (int) ($actual ? $sensors->wind_deg : $current->wind_deg),
            'clouds'            => (int) $current->clouds,
            'precipitation'     => (float) $current->precipitation,
            'illumination'      => ! $outdated ? (int) $sensors->illumination : null,
            'uvindex'           => ! $outdated ? (float) $sensors->uvindex : null,
        ];

        
        return (object) ['update' => $update, 'payload' => $weather];
    }
}