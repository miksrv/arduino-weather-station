<?php

namespace App\Entities;

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
        $trend = 0;

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
            if ($time_diff < 60) 
            {
                $this->trend += $item->$type;
                $trend++;
            }

            $count++;
        }

        if ($count !== 0) $this->trend = round($this->value - ($this->trend / $trend), 1);
    }
}
