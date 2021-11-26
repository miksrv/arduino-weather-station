<?php namespace App\Api;

use App\Models\Sensors;
use App\Models\Current;
use App\Models\Hourly;

/**
 * Weather station methods
 */
class Statistic {
    protected Sensors $Sensors;
    protected Current $Current;
    protected Hourly $Hourly;

    protected object $period;
    protected array $sensors;
    protected int $period_days;
    protected int $average_time;
    protected array $data;

    function __construct()
    {
        helper(['calculate']);
    }

    function get_data(object $period, array $sensors)
    {
        $this->period = (object) [
            'start' => date('Y-m-d H:i:s', strtotime($period->start)),
            'end'   => date('Y-m-d H:i:s', strtotime($period->end . ' +1 day')) // Включительно дату, а не ДО этой даты
        ];

        $this->sensors = $sensors;

        $this->period_days = calc_days_in_period($this->period->start, $this->period->end);
        $this->average_time = get_means_minutes($this->period_days);

        $this->_fetch();

        return $this->_make_chart_data();
    }

    protected function _make_chart_data()
    {
        $begin = new \DateTime($this->period->start);
        $end   = new \DateTime($this->period->end);

        $interval = \DateInterval::createFromDateString($this->average_time . ' minutes');
        $period = new \DatePeriod($begin, $interval, $end);
        $result = [];
        $chart  = (object) [];
        $update = strtotime($this->data[0]->item_utc_date . ' UTC');

        $this->data = array_reverse($this->data);

        foreach ($period as $dt)
        {
            $tmp_date = $dt->format('Y-m-d H:i:s');
            $next_date = date('Y-m-d H:i:s', $dt->format('U') + $this->average_time * 60);

            $result[$tmp_date] = $this->_make_time_array($tmp_date, $next_date);

            if (empty($result[$tmp_date]))
            {
                unset($result[$tmp_date]);
                continue;
            }

            foreach ($result[$tmp_date] as $item => $value)
            {
                if ($item === 'counter') continue;
                // Заполняем значения для графиков
                $chart->$item[] = [
                    date('U', strtotime($tmp_date . ' UTC')) * 1000,
                    round($value / $result[$tmp_date]->counter, 1)
                ];
            }

            // Удаляем текущий элемент массива
            unset($result[$tmp_date]);
        }

        return (object) ['update' => $update, 'payload' => $chart];
    }
    
    // Создаем массив по временным промежутком с суммой показаний всех запрошенных датчиков
    protected function _make_time_array($tmp_date, $next_date)
    {
        $result = [];

        foreach ($this->data as $sensor_key => $item) {
            $_item_date = date('Y-m-d H:i:s', strtotime($item->item_utc_date . ' +5 hours'));

            // Перебираем весь массив значений датчиков, если текущие показания не в промежутке дат, то пропускаем
            if ($_item_date < $tmp_date || $_item_date > $next_date)
                continue;

            // Создаем пустой объект показателей для текущего фрагмента даты
            if (empty($result))
                $result = (object) ['counter' => 0];

            // Удаляем служебные поля
            unset($item->item_utc_date);

            // Перебираем объект текущих датчиков
            foreach ($item as $key => $value)
            {
                // Если такого датчика нет в массиве текущей даты - то создаем его, иначе плюсуем
                if (!isset($result->$key))
                {
                    $result->$key = $value;
                } else {
                    $result->$key += $value;
                }
            }

            // Удаляем текущие показания из массива датчиков, т.к. мы их уже занесли
            unset($this->data[$sensor_key]);

            $result->counter++;
        }

        return $result;
    }

    protected function _fetch()
    {
        $sensors_available = ['temperature', 'humidity', 'pressure', 'illumination', 'uvindex', 'wind_speed', 'wind_deg'];
        $current_available = ['temperature', 'humidity', 'pressure', 'wind_speed', 'wind_deg', 'wind_gust', 'clouds', 'precipitation'];

        // Если время обобщения данных 60 минут и более, то будем брать \ заполнять значения из сводной таблицы
        if ($this->average_time >= 60)
        {
            $keys = $this->_get_available_keys(array_unique(array_merge($sensors_available, $current_available)));

            $this->Hourly = new Hourly();
            $this->Hourly->set_key_items($keys);
            return $this->data = $this->Hourly->get_period($this->period->start, $this->period->end);
        }

        $this->Sensors = new Sensors();
        $this->Current = new Current();

        $this->Sensors->set_key_items($this->_get_available_keys($sensors_available));
        $this->Current->set_key_items($this->_get_available_keys($current_available));

        $data_sensors = $this->Sensors->get_period($this->period->start, $this->period->end);
        $data_current = $this->Current->get_period($this->period->start, $this->period->end);

        $this->data = array_merge($data_sensors, $data_current);
    }

    // Получаем список доступных ключей сенсоров
    protected function _get_available_keys($list)
    {
        $result = [];

        foreach ($this->sensors as $item)
        {
            if (in_array($item, $list))
                $result[] = $item;
        }

        return $result;
    }
}