<?php namespace App\Api;

use App\Models\Hourly;

class Heatmap {
    protected Hourly $Hourly;

    protected object $period;
    protected array $sensors;
    protected array $data;

    function __construct()
    {
        helper(['calculate']);
    }

    function get_data(object $period, array $sensors)
    {
        $this->period = (object) [
            'start' => date('Y-m-d 00:00:00', strtotime($period->start)),
            'end'   => date('Y-m-d 23:59:59', strtotime($period->end))
        ];

        // Для построения тепловой карты всегда только один датчик используется, берем первый, остальные - удаляем
        $this->sensors = [array_shift($sensors)];
        $this->_fetch();

        return $this->_make_chart_data();
    }

    protected function _make_chart_data()
    {
        if (empty($this->data))
            return false;

        $result = [];
        $sensor = array_shift($this->sensors);
        $update = strtotime($this->data[0]->item_utc_date . ' UTC');

        foreach ($this->data as $key => $item) {
            $timestamp = strtotime($item->item_utc_date . ' +5 hours');
            $result[]  = [
                date('U', $timestamp) * 1000,
                (int) date('H', $timestamp),
                (float) $item->$sensor
            ];
        }

        return (object) ['update' => $update, 'payload' => $result];
    }

    protected function _fetch()
    {
        $this->Hourly = new Hourly();

        $this->Hourly->set_key_items($this->sensors);
        $this->data = $this->Hourly->get_period($this->period->start, $this->period->end);
    }
}