<?php

namespace App\Libraries;

use App\Models\Sensors;
use App\Models\Current;

/**
 * Weather station methods
 */
class Chart {
    protected Sensors $Sensors;
    protected Current $Current;

    function __construct()
    {
        $this->Sensors = new Sensors();
        $this->Current = new Current();
    }
}