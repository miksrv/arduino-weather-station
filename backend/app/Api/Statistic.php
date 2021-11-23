<?php

namespace App\Api;

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
    protected $data_sensors;
    protected $data_current;

    function __construct()
    {

    }

    function get_data(object $period, array $sensors)
    {
        $this->period = (object) [
            'start' => date('Y-m-d H:i:s', strtotime($period->start)), //  . ' UTC'
            'end'   => date('Y-m-d H:i:s', strtotime($period->end . ' +1 day')) // Включительно дату, на не ДО этой даты  . ' UTC'
        ];

        $this->sensors = $sensors;

        $this->_get_period_days();
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
        $update = strtotime($this->data_sensors[0]->item_utc_date . ' UTC');

        $this->data_sensors = array_reverse($this->data_sensors);

        foreach ($period as $dt)
        {
            $tmp_date = $dt->format('Y-m-d H:i:s');
            $next_date = date('Y-m-d H:i:s', $dt->format('U') + $this->average_time * 60);

            // Накидываем значения сенсоров в один массив с текущим временным интервалом, усредняем
            foreach ($this->data_sensors as $sensor_key => $item) {
                $_item_date = date('Y-m-d H:i:s', strtotime($item->item_utc_date . ' +5 hours'));

                // Перебираем весь массив значений датчиков, если текущие показания не в промежутке дат, то пропускаем
                if ($_item_date < $tmp_date || $_item_date > $next_date)
                    continue;

                // Создаем пустой объект показателей для текущего фрагмента даты
                if (!isset($result[$tmp_date]))
                    $result[$tmp_date] = (object) ['counter' => 0];

                // Удаляем служебные поля
                unset($item->item_utc_date);

                // Перебираем объект текущих датчиков
                foreach ($item as $key => $value)
                {
                    // Массив датчиков для графиков
                    if (!isset($chart->$key))
                        $chart->$key = [];

                    // Если такого датчика нет в массиве текущей даты - то создаем его, иначе плюсуем
                    if (!isset($result[$tmp_date]->$key))
                    {
                        $result[$tmp_date]->$key = $value;
                    } else {
                        $result[$tmp_date]->$key += $value;
                    }
                }

                // Удаляем текущие показания из массива датчиков, т.к. мы их уже занесли
                unset($this->data_sensors[$sensor_key]);

                $result[$tmp_date]->counter++;
            }

            // Вычисляем среднее арифметическое
            if (isset($result[$tmp_date]) && ! empty($result[$tmp_date]))
            {
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
        }

        return (object) ['update' => $update, 'payload' => $chart];
    }

    protected function _fetch()
    {
        // Если время обобщения данных 60 минут и более, то будем брать \ заполнять значения из сводной таблицы
//        if ($this->average_time >= 60)
//        {
//            $this->Hourly = new Hourly();
//            $data = $this->Hourly->get_period($this->period, $this->sensors);
//        }

        $this->Sensors = new Sensors();
        $this->Current = new Current();

        $this->data_sensors = $this->Sensors->get_period($this->period, $this->sensors);
        // $this->data_current = $this->Current->get_period($this->period);
    }

    /**
     * Вычисляем количество дней между датами
     */
    protected function _get_period_days()
    {
        $datetime1 = date_create($this->period->start);
        $datetime2 = date_create($this->period->end);

        $interval = date_diff($datetime1, $datetime2);

        $this->period_days  = (int) $interval->format('%a');
        $this->average_time = $this->_get_average_time();
    }

    /**
     * В зависимости от количества дней между датами, устанавливаем интервал в минутах для обобщения данных
     * @return int
     */
    private function _get_average_time(): int {
        if ($this->period_days === 0) return 5; // 5 min
        if ($this->period_days >= 1 && $this->period_days <=2) return 15; // 15 min
        if ($this->period_days >= 3 && $this->period_days <=5) return 30; // 30 min
        if ($this->period_days >= 6 && $this->period_days <= 7) return 60; // 1 hour
        if ($this->period_days >= 8 && $this->period_days <= 14) return 1*60; // 5 hour
        return 24*60; // 24 hour
    }
}