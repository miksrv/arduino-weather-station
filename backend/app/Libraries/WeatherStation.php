<?php

namespace App\Libraries;

use App\Models\Sensors;

/**
 * Weather station methods
 */
class WeatherStation {

    protected Sensors $Sensors;

    function __construct()
    {
        $this->Sensors = new Sensors();
    }

    function add_data(object $data)
    {
        $insert_data = [
            'temperature'  => $data->t ?? null,
            'humidity'     => $data->h ?? null,
            'pressure'     => $data->p ?? null,
            'illumination' => $data->i ?? null,
            'uvindex'      => $data->uv ?? null,
            'wind_speed'   => $data->ws ?? null,
            'wind_deg'     => isset($data->wd) ? $this->_mapping_degree($data->wd) : null
        ];

        return $this->Sensors->add($insert_data);
    }

    function _mapping_degree(string $key)
    {
        $mapping = [
            '0'  => 0,
            '01' => 22.5,
            '1'  => 45,
            '12' => 67.5,
            '2'  => 90,
            '23' => 112.5,
            '3'  => 135,
            '34' => 157.5,
            '4'  => 180,
            '45' => 202.5,
            '5'  => 225,
            '56' => 247.5,
            '6'  => 270,
            '67' => 292.5,
            '7'  => 315,
            '70' => 337.5,
        ];

        return key_exists($key, $mapping) ? $mapping[$key] : 0;
    }
}