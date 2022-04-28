<?php namespace App\Api;

use App\Models\Sensors;

class Uptime {
    protected Sensors $Sensors;

    function __construct()
    {
        $this->Sensors = new Sensors();
    }

    function get_uptime(): object
    {
        $should = 1440;
        $count  = (int) $this->Sensors->get_week_count()->item_id;
        $last   = $this->Sensors->get_last_row()->item_utc_date;
        $uptime = round(($count / $should) * 100, 1);

        return (object) [
            'update' => strtotime($last . ' UTC'),
            'payload' => min($uptime, 99.9)
        ];
    }
}