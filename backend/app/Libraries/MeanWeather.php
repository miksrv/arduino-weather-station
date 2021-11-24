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

    protected int $counter = 0;

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
        $lastData = $this->Hourly->get_last_row();

        if (empty($lastData))
            $lastData = $this->Sensors->get_first_row();

        // Имея время последнего времени записи, берем данные сенсоров за весь следующий час
        $nextHor  = $this->_get_next_date_hour($lastData->item_utc_date);
//         $nextHor  = $this->_get_next_date_hour('2020-08-28 14:00:00');
        $meanDate = date('Y-m-d H:30:00', $nextHor);

        // Проверяем, не пытаемся ли сделать средние данные за еще не вышедший час
        $this->_check_hours_with_current($meanDate);

        // Получаем данные сенсоров и OpenWeatherMap за последний час
        $sensors = $this->_get_last_data($this->Sensors, $nextHor);
        $weather = $this->_get_last_data($this->Current, $nextHor);

        // Если нет данных ни от метеостанции, ни от OWM (например не работал хост, cron и т.п.)
        if (empty((array) $sensors) && empty((array) $weather))
        {
            $sensors = $this->_get_empty_value($nextHor, 1);
        }

        // Получаем среднее значение всего массива сенсоров и OWM
        $dataset = $this->_get_average_data($sensors, $weather);

        // Сохраняем средние значения в базе
        $this->Hourly->add($dataset, $meanDate);

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
        $datetime1 = date_create($date, timezone_open('UTC'));
        $datetime2 = date_create('now', timezone_open('UTC'));
        $interval  = date_diff($datetime1, $datetime2);

        // Еще не прошел 1 час после последнего добавления усредненных данных
        if ((int) $interval->format('%h') <= 1)
        {
            exit();
        }
    }

    /**
     * Получаем данные сенсоров за час по конкретной дате
     */
    protected function _get_last_data($Object, int $timestamp): array
    {
        return $Object->get_array_by_hour(
            date('Y', $timestamp),
            date('m', $timestamp),
            date('d', $timestamp),
            date('H', $timestamp)
        );
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
        if ($days >= 10) {
            echo 'Данные по метеостанции отсутствуют более 10 дней';
            exit();
        }

        $prev_time = strtotime(date('Y-m-d H:i:s', $time) . " -$days days");
        $prev_data = $this->Sensors->get_array_by_hour(
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
    protected function _get_average_data(array $sensors, array $weather): array
    {
        $meanSensors = $this->_calc_mean($sensors);
        $meanWeather = $this->_calc_mean($weather);

        return [
            'temperature'   => $meanSensors->temperature ?? $meanWeather->temperature,
            'humidity'      => $meanSensors->humidity ?? $meanWeather->humidity,
            'pressure'      => $meanSensors->pressure ?? $meanWeather->pressure,
            'illumination'  => $meanSensors->illumination ?? null,
            'uvindex'       => $meanSensors->uvindex ?? null,
            'wind_speed'    => $meanSensors->wind_speed ?? $meanWeather->wind_speed,
            'wind_deg'      => $meanSensors->wind_deg ?? $meanWeather->wind_deg,
            'wind_gust'     => $meanWeather->wind_gust ?? null,
            'clouds'        => $meanWeather->clouds ?? null,
            'precipitation' => $meanWeather->precipitation ?? null,
        ];
    }

    // Вычисляем среднее значение по всему массиву
    protected function _calc_mean($data): object
    {
        $count  = 0;
        $summary = [];

        if (empty($data))
            return (object) $summary;

        foreach ($data as $item)
        {
            $count++;

            // Удаляем не нужные объекты
            unset($item->item_id, $item->item_utc_date, $item->conditions, $item->feels_like);

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

        return (object) $summary;
    }
}