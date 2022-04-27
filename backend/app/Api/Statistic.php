<?php namespace App\Api;

use App\Models\Sensors;
use App\Models\Current;
use App\Models\Hourly;
use Config\Pager;

const DATE_FORMAT = 'Y-m-d H:i:s';

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

    protected array $dataMean;
    protected array $dataBasic;
    protected array $dataSpare;

    function __construct()
    {
        helper(['calculate']);
    }

    function get_chart_data(object $period, array $sensors): object
    {
        $this->_init($period, $sensors);
        return $this->_make_chart_data();
    }

    function get_sensors_data(object $period, array $sensors): object
    {
        $this->_init($period, $sensors);

        $data = $this->isMean() ? $this->dataMean : array_merge($this->dataBasic, $this->dataSpare);

        foreach ($data as $item)
        {
            $item->date = strtotime($item->item_utc_date);
            unset($item->item_utc_date);
        }

        return (object) ['update' => $data[0]->date, 'payload' => $data];
    }

    protected function _init(object $period, array $sensors)
    {
        $this->period = (object) [
            'start' => date(DATE_FORMAT, strtotime($period->start)),
            'end'   => date(DATE_FORMAT, strtotime($period->end . ' +1 day')) // Включительно дату, а не ДО этой даты
        ];

        $this->sensors = $sensors;

        $this->period_days = calc_days_in_period($this->period->start, $this->period->end);
        $this->average_time = get_means_minutes($this->period_days);

        $this->_fetch();
    }

    protected function _make_chart_data(): object
    {
        $begin = new \DateTime($this->period->start);
        $end   = new \DateTime($this->period->end);

        $interval  = \DateInterval::createFromDateString($this->average_time . ' minutes');
        $result = [];
        $chart  = (object) [];

        if ($this->isMean()) {
            $update = strtotime($this->dataMean[0]->item_utc_date . ' UTC');
        } else {
            $basicDate = $this->dataBasic ? strtotime($this->dataBasic[0]->item_utc_date . ' UTC') : 0;
            $spareDate = $this->dataSpare ? strtotime($this->dataSpare[0]->item_utc_date . ' UTC') : 0;
            $update = max($basicDate, $spareDate);
        }

        foreach (new \DatePeriod($begin, $interval, $end) as $dt)
        {
            $tmp_date = $dt->format(DATE_FORMAT);
            $next_date = date(DATE_FORMAT, $dt->format('U') + $this->average_time * 60);

            if ($this->isMean()) {
                $tmp_array = $this->_make_time_array('dataMean', $tmp_date, $next_date);
            } else {
                $basic = $this->_make_time_array('dataBasic', $tmp_date, $next_date);
                $spare = $this->_make_time_array('dataSpare', $tmp_date, $next_date);

                if (!empty($basic) || !empty($spare))
                {
                    foreach ($this->sensors as $sensor)
                    {
                        $tmp_array[$sensor] = isset($basic[$sensor]) && !empty($basic[$sensor])
                            ? $basic[$sensor]
                            : ($spare[$sensor] ?? null);

                        if ($tmp_array[$sensor] === null)
                        {
                            unset($tmp_array[$sensor]);
                        }
                    }
                } else {
                    $tmp_array = null;
                }
            }

            if (empty($tmp_array))
            {
                continue;
            }

            $result[$tmp_date] = $tmp_array;

            foreach ($result[$tmp_date] as $item => $value)
            {
                if ($item === 'counter')
                {
                    continue;
                }

                // Заполняем значения для графиков
                $chart->$item[] = [
                    date('U', strtotime($tmp_date . ' UTC')) * 1000,
                    $value
                ];
            }

            // Удаляем текущий элемент массива
            unset($result[$tmp_date]);
        }

        return (object) ['update' => $update, 'payload' => $chart];
    }

    // Создаем массив по временным промежутком с суммой показаний всех запрошенных датчиков
    protected function _make_time_array($source, $tmp_date, $next_date): array
    {
        $return = (object) [];
        $result = (object) [];
        $counts = (object) [];

        foreach ($this->$source as $sensor_key => $item)
        {
            $_item_date = date(DATE_FORMAT, strtotime($item->item_utc_date . ' +5 hours'));

            // Перебираем весь массив значений датчиков, если текущие показания не в промежутке дат, то пропускаем
            if ($_item_date < $tmp_date || $_item_date > $next_date)
            {
                continue;
            }

            // Удаляем служебные поля
            unset($item->item_utc_date);

            // Перебираем объект текущих датчиков
            foreach ($item as $key => $value)
            {
                // Если такого датчика нет в массиве текущей даты - то создаем его, иначе плюсуем
                if (!isset($result->$key))
                {
                    $result->$key = $value;
                    $counts->$key = 1;
                } else {
                    $result->$key += $value;
                    $counts->$key += 1;
                }
            }

            // Удаляем текущие показания из массива датчиков, т.к. мы их уже занесли
            unset($this->$source[$sensor_key]);
        }

        foreach ($result as $item => $value)
        {
            $return->$item = round($value / $counts->$item, 1);
        }

        return (array) $return;
    }

    protected function _fetch()
    {
        $sensors_available = ['temperature', 'humidity', 'pressure', 'illumination', 'uvindex', 'wind_speed', 'wind_deg'];
        $current_available = ['temperature', 'humidity', 'pressure', 'wind_speed', 'wind_deg', 'wind_gust', 'clouds', 'precipitation'];

        // Если время обобщения данных 60 минут и более, то будем брать \ заполнять значения из сводной таблицы
        if ($this->isMean())
        {
            $keys = $this->_get_available_keys(array_unique(array_merge($sensors_available, $current_available)));

            $this->Hourly = new Hourly();
            $this->Hourly->set_key_items($keys);
            $this->dataMean = $this->Hourly->get_period($this->period->start, $this->period->end);
        }

        $this->Sensors = new Sensors();
        $this->Current = new Current();

        $this->Sensors->set_key_items($this->_get_available_keys($sensors_available));
        $this->Current->set_key_items($this->_get_available_keys($current_available));

        $this->dataBasic = $this->Sensors->get_period($this->period->start, $this->period->end);
        $this->dataSpare = $this->Current->get_period($this->period->start, $this->period->end);
    }

    protected function isMean(): bool
    {
        return $this->average_time >= 60;
    }

    // Получаем список доступных ключей сенсоров
    protected function _get_available_keys($list): array
    {
        $result = [];

        foreach ($this->sensors as $item)
        {
            if (in_array($item, $list))
            {
                $result[] = $item;
            }
        }

        return $result;
    }
}