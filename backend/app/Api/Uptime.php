<?php namespace App\Api;

use App\Models\Sensors;

/**
 * Weather station methods
 */
class Uptime {
    protected Sensors $Sensors;

    function __construct()
    {
        $this->Sensors = new Sensors();
    }

    function get_uptime()
    {
        $should = 1440;
        $count  = (int) $this->Sensors->get_week_count()->item_id;
        $last   = $this->Sensors->get_last()->item_utc_date;

        return (object) [
            'update' => strtotime($last . ' UTC'),
            'payload' => round(($count / $should) * 100, 1)
        ];
    }
}