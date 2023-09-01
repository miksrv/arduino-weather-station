<?php namespace App\Api;

use App\Models\Sensors;
use App\Models\Current;
use App\Models\Hourly;

/**
 * Class for generating data that can be exported in CSV format
 */
class Export {
    protected object $period;
    protected int $period_days;
    protected int $average_time;
    protected array $data;
    protected array $sensors = [
        'temperature', 'humidity', 'pressure',
        'wind_speed', 'wind_deg', 'wind_gust',
        'clouds', 'precipitation', 'illumination', 'uvindex'
    ];

    function __construct()
    {
        helper(['calculate']);
    }

    /**
     * Returns an array with the values of all sensors for a period of dates
     * @param object $period
     * @return \string[][]
     */
    function get_data(object $period): array
    {
        $this->period = (object) [
            'start' => date('Y-m-d H:i:s', strtotime($period->start)),
            'end'   => date('Y-m-d H:i:s', strtotime($period->end . ' +1 day'))
        ];

        $this->period_days = calc_days_in_period($this->period->start, $this->period->end);
        $this->average_time = get_means_minutes($this->period_days);

        $this->_fetch();

        return $this->_make_data();
    }

    /**
     * Returns the generated data array, the first element is the names of the sensors
     * @return \string[][]
     */
    protected function _make_data(): array
    {
        $result  = [['UTC Datetime']];

        foreach ($this->data as $key => $item) {
            $_tmp_result = [$item->item_utc_date];

            unset($item->item_utc_date, $item->item_id);

            foreach ($item as $sensor => $value) {
                if ($key === 0) {
                    $result[$key][] = $sensor;
                }

                $_tmp_result[] = (float) $value;
            }

            $result[] = $_tmp_result;
        }

        return $result;
    }

    /**
     * Selects from the database
     * @return array|mixed|void
     */
    protected function _fetch()
    {
        $sensors_available = ['temperature', 'humidity', 'pressure', 'illumination', 'uvindex', 'wind_speed', 'wind_deg'];
        $current_available = ['temperature', 'humidity', 'pressure', 'wind_speed', 'wind_deg', 'wind_gust', 'clouds', 'precipitation'];

        // Если время обобщения данных 60 минут и более, то будем брать \ заполнять значения из сводной таблицы
        if ($this->average_time >= 60) {
            $keys = array_unique(array_merge($sensors_available, $current_available));

            $Hourly = new Hourly();
            $Hourly->set_key_items($keys);

            return $this->data = $Hourly->get_period($this->period->start, $this->period->end);
        }

        $Sensors = new Sensors();
        $Current = new Current();

        $Sensors->set_key_items($sensors_available);
        $Current->set_key_items($current_available);

        $data_sensors = $Sensors->get_period($this->period->start, $this->period->end);
        $data_current = $Current->get_period($this->period->start, $this->period->end);

        $this->data = array_merge($data_sensors, $data_current);
    }
}