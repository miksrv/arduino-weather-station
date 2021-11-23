<?php

namespace App\Libraries;

use App\Models\Sensors;
use App\Models\Current;
use App\Models\Hourly;

/**
 * Вычисляет среднее значение погоды за час
 */
class MeanWeather {
    protected Sensors $Sensors;
    protected Current $Current;
    protected Hourly $Hourly;

    protected $counter = 0;

    function __construct()
    {
        $this->Sensors = new Sensors();
        $this->Current = new Current();
        $this->Hourly  = new Hourly();
    }

    function run()
    {
        $this->counter++;

        // Берем последнее значение, если пусто - начинаем заполнять с первой даты принятых значений с метеостанции
        $lastData = $this->Hourly->get_last();

        if (empty($lastData))
            $lastData = $this->Sensors->get_first();

        // Имея время последнего времени записи, берем данные сенсоров за весь следующий час
        // $nextHor  = $this->_get_next_date_hour($lastData->item_utc_date);
        $nextHor  = $this->_get_next_date_hour('2020-04-10 01:00:00');
        $meanDate = date('Y-m-d H:30:00', $nextHor);

        // Проверяем, не пытаемся ли сделать средние данные за еще не вышедший час
        $this->_check_hours_with_current($meanDate);

        // Получаем данные сенсоров за последний час
        $sensors  = $this->_get_last_sensor_data($nextHor);

        // Получаем среднее значение всего массива сенсоров
        $dataset = $this->_get_average_data($sensors);

        // Сохраняем средние значения в базе
        $this->Hourly->add($dataset, $meanDate);

        exit();

        if ($this->counter >= 100)
        {
            echo 'Max iteration (' . $this->counter . ') complete';
            exit();
        }

        $this->run();
    }

    /**
     * Проверяет сколько часов между последней средней датой и текущем временем.
     * Так как средние значения делаются за час, и если между последней усредненными значениями и текущем временем час еще не прошел -
     * завершаем скрипт
     */
    protected function _check_hours_with_current($date)
    {
        $date1 = new \DateTime($date);
        $date2 = new \DateTime();
        $diff  = $date1->diff($date2);
        $hours = $diff->h;
        $hours = $hours + ($diff->days*24);

        if ($hours <= 1)
        {
            echo 'The difference between dates is less than 1 hour';
            exit();
        }
    }

    /**
     * Получаем данные сенсоров за час по конкретной дате
     */
    protected function _get_last_sensor_data(int $timestamp): array
    {
        $data = $this->Sensors->get_by_hour(
            date('Y', $timestamp),
            date('m', $timestamp),
            date('d', $timestamp),
            date('H', $timestamp)
        );

        // Если данных за это время в этом день нет, берем теже самые значения днём ранее
        if (empty($data) || ! is_array($data)) {
            $data = $this->_get_empty_value($timestamp, 1);
        }

        return $data;
    }

    // Получаем следующий час в UNIX timestamp по полученной string дате
    protected function _get_next_date_hour(string $date): int
    {
        return strtotime($date . ' +1 hours');
    }

    /**
     * Если вдруг не получается выцепить значение следующего часа,
     * то берется час предыдущего дня
     * @param $time
     * @param $days
     * @return mixed
     */
    protected function _get_empty_value($time, $days) {
        // Если не находим данные за час по погоде за последние 5 дней
        if ($days >= 5) {
            echo 'Данные по метеостанции отсутствуют более 5 дней';
            exit();
        }

        $prev_time = strtotime(date('Y-m-d H:i:s', $time) . " -$days days");
        $prev_data = $this->Sensors->get_by_hour(
            date('Y', $prev_time),
            date('m', $prev_time),
            date('d', $prev_time),
            date('H', $prev_time)
        );

        if (empty($prev_data))
            return $this->_get_empty_value($time, $days + 1);

        return $prev_data;
    }

    /**
     * Делаем усредненные значения по всему набору полученных данных (предполагается, что это данные за час)
     */
    protected function _get_average_data($data): array
    {
        $count  = 0;
        $summary = [];

        if (empty($data))
            return $summary;

        foreach ($data as $item)
        {
            $count++;

            unset($item->item_id, $item->item_utc_date);

            foreach ($item as $sensor => $value)
            {
                if ( ! isset($summary[$sensor]))
                {
                    $summary[$sensor] = (float) $value;
                } else {
                    $summary[$sensor] += (float) $value;
                }
            }
        }

        foreach ($summary as $sensor => $value) {
            $summary[$sensor] = round($value / $count, 1);
        }

        return $summary;
    }

    /**
     * @param $dataset
     * @param $time
     * @return mixed
     */
    protected function _set_total($dataset, $time)
    {
        if (empty($dataset->summary) || empty($dataset->extreme))
        {
            echo '<pre>';
            var_dump($dataset);
            exit();
        }

        $summary = json_encode($dataset->summary);
        $extreme = json_encode($dataset->extreme);

        return $this->_dataModel->set_total($summary, $extreme, $time);
    }

    /**
     * @return mixed
     */
    function get_last_hour() {
        return $this->_dataModel->get_day_order();
        //return $this->_dataModel->get_day();
    }

    /**
     * @param $year
     * @param $month
     * @param $day
     * @param $hour
     * @return mixed
     */
    function get_day($year, $month, $day, $hour)
    {
        return $this->_dataModel->get_hour($year, $month, $day, $hour);
    }

    /**
     * @return mixed
     */
    function get_last_total()
    {
        return $this->_dataModel->get_last_total();
    }

    /**
     * @param $data
     * @param $time
     * @return mixed
     */
    function set_total($data, $time)
    {
        return $this->_dataModel->set_total($data, $time);
    }
}