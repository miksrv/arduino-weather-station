<?php namespace App\Api;

use App\Models\Sensors;
use App\Models\Current;
use App\Models\Hourly;

/**
 * Weather station methods for calculate wind rose
 */
class WindRose {
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

    function get_chart_data(object $period): object
    {
        $this->_init($period);
        return $this->_make_chart_data();
    }

    protected function _init(object $period)
    {
        $this->period = (object) [
            'start' => date(DATE_FORMAT, strtotime($period->start)),
            'end'   => date(DATE_FORMAT, strtotime($period->end . ' +1 day')) // Включительно дату, а не ДО этой даты
        ];

        $this->sensors = ['wind_speed', 'wind_deg'];

        $this->period_days = calc_days_in_period($this->period->start, $this->period->end);
        $this->average_time = get_means_minutes($this->period_days);

        $this->_fetch();
    }

    protected function _make_chart_data(): object
    {
        $_temp_wd  = [0, 0, 0, 0, 0, 0, 0, 0]; // Array of wind directions (8 bit)
        $_temp_wr  = $this->create_wind_rose_array(); // Wind rose array
        $_temp_wr_total = 0; // Wind rose count items

        if ($this->isMean()) {
            $update = strtotime($this->dataMean[0]->item_utc_date . ' UTC');
            $tmp_array = $this->dataMean;
        } else {
            $basicDate = $this->dataBasic ? strtotime($this->dataBasic[0]->item_utc_date . ' UTC') : 0;
            $spareDate = $this->dataSpare ? strtotime($this->dataSpare[0]->item_utc_date . ' UTC') : 0;
            $update = max($basicDate, $spareDate);
            $tmp_array = !empty($this->dataBasic) ? $this->dataBasic : $this->dataSpare;
        }

        foreach ($tmp_array as $item) {
            if ((int) $item->wind_speed === 0)
            {
                continue;
            }

            $_tmp_wind_position = $this->convert_degree_to_direct($item->wind_deg);

            $_temp_wd[$_tmp_wind_position]++;
            $_temp_wr[$this->convert_wind_speed($item->wind_speed)][$_tmp_wind_position]++;
            $_temp_wr_total++;
        }

        $result = $this->_insert_wind_direction($_temp_wd, $_temp_wr, $_temp_wr_total);

        return (object) ['update' => $update, 'payload' => $result];
    }

    protected function _fetch()
    {
        // Если время обобщения данных 60 минут и более, то будем брать \ заполнять значения из сводной таблицы
        if ($this->isMean())
        {
            $this->Hourly = new Hourly();
            $this->Hourly->set_key_items($this->sensors);
            return $this->dataMean = $this->Hourly->get_period($this->period->start, $this->period->end);
        }

        $this->Sensors = new Sensors();
        $this->Current = new Current();

        $this->Sensors->set_key_items($this->sensors);
        $this->Current->set_key_items($this->sensors);

        $this->dataBasic = $this->Sensors->get_period($this->period->start, $this->period->end);
        $this->dataSpare = $this->Current->get_period($this->period->start, $this->period->end);
    }

    protected function isMean(): bool
    {
        return $this->average_time >= 60;
    }


    function create_wind_rose_array(): array
    {
        $_array = [];

        // Wind speed
        for ($i = 0; $i <= 6; $i++)
        {
            // Wind direction
            for ($k = 0; $k <= 7; $k++)
            {
                $_array[$i][$k] = 0;
            }
        }

        return $_array;
    }

    function convert_degree_to_direct($degree): int
    {
        if ($degree == 0) return 0;

        $_range = [
            '0' => ['min' => 337, 'max' => 22],
            '1' => ['min' => 22, 'max' => 67],
            '2' => ['min' => 67, 'max' => 112],
            '3' => ['min' => 112, 'max' => 157],
            '4' => ['min' => 157, 'max' => 202],
            '5' => ['min' => 202, 'max' => 247],
            '6' => ['min' => 247, 'max' => 292],
            '7' => ['min' => 292, 'max' => 337],
        ];

        foreach ($_range as $index => $group)
        {
            if ($degree >= $group['min'] && $degree < $group['max'])
            {
                return $index;
            }
        }

        return 0;
    }

    /**
     * Convert wind speed to index for wind rose chart
     * @param $wind_speed
     * @return int
     */
    function convert_wind_speed($wind_speed): int
    {
        $wind_speed = (int) $wind_speed;

        if ($wind_speed > 0 && $wind_speed <= 1)
            return 0;
        else if ($wind_speed > 1 && $wind_speed <= 3)
            return 1;
        else if ($wind_speed > 3 && $wind_speed <= 5)
            return 2;
        else if ($wind_speed > 5 && $wind_speed <= 7)
            return 3;
        else if ($wind_speed > 7 && $wind_speed <= 9)
            return 4;
        else
            return 5;
    }

    /**
     * Determine the frequency from which direction the wind blows
     * @param array $_temp_wd
     * @param $_temp_wr
     * @param $_temp_wr_total
     * @return array
     */
    protected function _insert_wind_direction(array $_temp_wd, $_temp_wr, $_temp_wr_total): array
    {
        $_tmp = $_temp_wd;

        sort($_tmp);

        return $this->calculate_wind_rose($_temp_wr, $_temp_wr_total);
    }

    /**
     * Calculate wind rose
     * @param $_temp_wr
     * @param $_temp_wr_total
     * @return array|null
     */
    function calculate_wind_rose($_temp_wr, $_temp_wr_total): ?array
    {
        $new_wr_array = [];

        foreach ($_temp_wr as $key_wr_1 => $val_wr_direct) {
            foreach ($val_wr_direct as $key_wr_2 => $val_wr_speed) {
                $_tmp = $_temp_wr_total > 0 ? round((($val_wr_speed / $_temp_wr_total) * 100), 1) : 0;
                $new_wr_array[$key_wr_1][] = [
                    $this->convert_index_to_degree($key_wr_2),
                    $_tmp
                ];
            }
        }

        return $new_wr_array;
    }

    /**
     * Convert 8bit wind index direction to degree
     * @param $key
     * @return int
     */
    function convert_index_to_degree($key): int
    {
        if ($key == 0) return 0;

        $_map = [
            1 => 45,
            2 => 90,
            3 => 135,
            4 => 180,
            5 => 225,
            6 => 270,
            7 => 315
        ];

        return $_map[$key];
    }
}