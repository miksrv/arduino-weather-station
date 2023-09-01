<?php namespace App\Entities;

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
        $_count = 0;
        $_trend = 0;

        foreach ($data as $item) {
            if (! property_exists($item, $this->type)) {
                continue;
            }

            $time_diff = round(abs(strtotime($item->item_utc_date . ' UTC') - gmdate('U')) / 60,0);

            if ($_count === 0) {
                $this->min = $this->max = $item->{$this->type};
                $this->value = $item->{$this->type};
            }

            if ($item->{$this->type} < $this->min) {
                $this->min = $item->{$this->type};
            }

            if ($item->{$this->type} > $this->max) {
                $this->max = $item->{$this->type};
            }

            if ($time_diff < 60) {
                $this->trend += $item->{$this->type};
                $_trend++;
            }

            $_count++;
        }

        if ($_count !== 0) {
            $this->trend = round($this->value - ($this->trend / $_trend), 1);
        }
    }
}
