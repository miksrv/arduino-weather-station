<?php namespace App\Controllers;

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: GET, OPTIONS");

class Get extends BaseController
{

    protected $_data;
    protected $_updated;
    protected $_period = ['today', 'yesterday', 'week', 'month'];

    /**
     * Receives data from a weather station, checks a token, enters data into a storage
     */
    public function general()
    {
        $dataModel = model('App\Models\SensorData');

        $this->_data = $dataModel->get_period();
        $this->_fetch_data();

        $this->response
            ->setJSON([
                'update'  => strtotime($this->_updated),
                'moon'    => $this->_moon(),
                'sun'     => $this->_sun(),
                'sensors' => $this->_data
            ])->send();

        exit();
    }


    /**
     * Returns an array of data for plotting
     */
    public function graphdata()
    {
        $dataModel = model('App\Models\SensorData');
        $period = $this->request->getGet('period');
        $period = ! in_array($period, $this->_period) ? $this->_period[0] : $period;

        $this->_data = $dataModel->get_period($period);
        $this->_make_graph_data($period);

        $this->response
            ->setJSON([
                'update'  => strtotime($this->_updated),
                'sensors' => $this->_data
            ])->send();

        exit();
    }

    /**
     * #TODO OpenWeatherMap library
     * Weather forecast from OpenWeatherMap service
     */
    public function forecast()
    {
        if ( ! $foreacst = cache('forecast'))
        {
            $client   = \Config\Services::curlrequest();
            $api_url  = 'http://api.openweathermap.org/data/2.5/forecast?id=' . getenv('app.openweather.city') . '&appid=' . getenv('app.openweather.key') . '&units=metric&lang=ru';
            $response = $client->get($api_url);

            if ($response->getStatusCode() !== 200)
            {
                $this->response
                    ->setStatusCode($response->getStatusCode())
                    ->setJSON([
                        'error'  => $response->getBody(),
                    ])->send();

                exit();
            }

            $foreacst = $response->getBody();

            // Save into the cache for 10 minutes
            cache()->save('foreacst', $foreacst, 600);
        }

        $this->response
            ->setJSON([
                'data' => json_decode($foreacst)->list,
            ])->send();

        exit();
    }

    /**
     * #TODO nooa.gov library
     * Getting data from the weather data service
     */
    public function kindex()
    {
        if ( ! $kindex = cache('kindex'))
        {
            $api_url = 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json';
            $kindex  = file_get_contents($api_url);

            // Save into the cache for 10 minutes
            cache()->save('kindex', $kindex, 600);
        }

        $this->response
            ->setJSON([
                'data' => json_decode($kindex),
            ])->send();

        exit();
    }

    /**
     * Make and return graph data array
     * @return array|void
     */
    protected function _make_graph_data($period)
    {
        if (empty($this->_data))
        {
            return ;
        }

        $_result = [];

        $_counter   = 0; // Счетчик итераций
        $_prev_time = 0; // Изначальное время первой итерации
        $_temp_val  = []; // Массив средних значений
        $_temp_wd   = [0, 0, 0, 0, 0, 0, 0, 0]; // Массив направлений ветра (8 направлений)

        $_temp_wr   = []; // Массив розы ветров
        $_temp_wr_total = 0; // Общее число для высчитывания процента

        // Заполняем пустыми значениями
        // Скорость
        for ($i = 0; $i <= 6; $i++)
        {
            // Направление
            for ($k = 0; $k <= 7; $k++)
            {
                $_temp_wr[$i][$k] = 0;
            }
        }

        /* Wind Rose
         * 1. < 0.5
         * 2. 0.5 - 2
         * 3. 2 - 4
         * 4. 4 - 6
         * 5. 6 - 8
         * 6. 8 - 10
         * 7. > 10
         */

        switch ($period) {
            case 'today'     :
            case 'yesterday' : $period = '600'; break;
            case 'week'      : $period = '3600'; break;
            case 'month'     : $period = '18000'; break;
        }

        // Если период - день, то достаточно значения раз в 10 мин
        foreach ($this->_data as $num => $item)
        {
            $item->item_raw_data = $this->_insert_additional_data($item->item_raw_data);

            if ($num === 0)
            {
                $this->_updated = $item->item_timestamp;
            }

            // ------------------------------------------------------------
            // Если время между первой и текущей итерацией больше или равно
            // 10 мин (для одного дня - 10 мин усреднение)
            if ($_prev_time - strtotime($item->item_timestamp) >= $period)
            {
                foreach ($_temp_val as $_key => $_val)
                {
                    if ($_key === 'timestamp')
                    {
                        continue;
                    }

                    // Для графика направления ветра значения timestamp не нужны
                    if ($_key === 'wd')
                    {
                        continue;
                    }

                    $_result[$_key][] = [
                        round($_temp_val['timestamp'] / $_counter, 0) * 1000,
                        round($_val / $_counter, 1)];
                }

                $_counter   = 0;
                $_prev_time = 0;
                $_temp_val  = [];
            }

            if ($_counter == 0) {
                $_prev_time = strtotime($item->item_timestamp);
            }

            $json_data = json_decode($item->item_raw_data);

            foreach ($json_data as $key => $val)
            {

                if ( ! isset($_temp_val[$key]))
                {
                    $_temp_val[$key] = 0;
                }

                // Определяем направление ветра
                if ($key === 'wd')
                {
                    $_tmp_wind_position = 0;

                    if (($val >= 337 && $val < 22) || $val == 0)
                    {
                        $_tmp_wind_position = 0;
                    }
                    else if ($val >= 22 && $val < 67)
                    {
                        $_tmp_wind_position = 1;
                    }
                    else if ($val >= 67 && $val < 112)
                    {
                        $_tmp_wind_position = 2;
                    }
                    else if ($val >= 112 && $val < 157)
                    {
                        $_tmp_wind_position = 3;
                    }
                    else if ($val >= 157 && $val < 202)
                    {
                        $_tmp_wind_position = 4;
                    }
                    else if ($val >= 202 && $val < 247)
                    {
                        $_tmp_wind_position = 5;
                    }
                    else if ($val >= 247 && $val < 292)
                    {
                        $_tmp_wind_position = 6;
                    }
                    else if ($val >= 292 && $val < 337)
                    {
                        $_tmp_wind_position = 7;
                    }

                    // Только если есть ветер
                    if ($json_data->ws > 0) {
                        $_temp_wd[$_tmp_wind_position]++;

                        $_temp_wr[$this->_map_wind_speed($json_data->ws)][$_tmp_wind_position]++;
                        $_temp_wr_total++;
                    }

                    continue;
                }

                $_temp_val[$key] += $val;
            }

            if ( ! isset($_temp_val['timestamp']))
            {
                $_temp_val['timestamp'] = 0;
            }

            $_temp_val['timestamp'] += strtotime($item->item_timestamp);
            $_counter++;
        }

        $tmp = $_temp_wd;
        $wind_dir = [];

        sort($tmp);

        foreach ($_temp_wd as $key => $val)
        {
            $wind_dir[$key] = array_search($val, $tmp);
        }

        // Считаем сколько процентов составляет числа розы ветров
        $new_wr_array = [];
        foreach ($_temp_wr as $key_wr_1 => $val_wr_direct)
        {
            foreach ($val_wr_direct as $key_wr_2 => $val_wr_speed)
            {
//                unset($_temp_wr[$key_wr_1][$key_wr_2]);

                $new_wr_array[$key_wr_1][] = [
                    $this->_map_windkey_degree($key_wr_2),
                    round((($val_wr_speed / $_temp_wr_total) * 100), 1)
                ];

//                $_temp_wr[$key_wr_1][$this->_map_windkey_degree($key_wr_2)] =
//                    round((($val_wr_speed / $_temp_wr_total) * 100), 1);
            }
        }

        $_result['wd'] = $wind_dir;
        $_result['wr'] = $new_wr_array;

        return $this->_data = $_result;
    }


    protected function _map_windkey_degree($key) {
        switch ($key)
        {
            case 0 : return 0;
            case 1 : return 45;
            case 2 : return 90;
            case 3 : return 135;
            case 4 : return 180;
            case 5 : return 225;
            case 6 : return 270;
            case 7 : return 315;

            default: return 0;
        }
    }

    protected function _map_wind_speed($wind_speed)
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
     * Return calculated dew point value by temperature and humidity
     * @param $humidity float
     * @param $temp float
     * @return false|float
     */
    protected function _calc_dew_point($humidity, $temp)
    {
        return round(((pow(($humidity / 100), 0.125)) * (112 + 0.9 * $temp) + (0.1 * $temp) - 112),1);
    }

    /**
     * Inserted some data in first sensors array elements
     * @param $raw_input
     * @return false|string
     */
    protected function _insert_additional_data($raw_input)
    {

        $_tmp = json_decode($raw_input);
        $_tmp->dp = $this->_calc_dew_point($_tmp->h, $_tmp->t2);
        $_tmp->wd = $this->_calc_wind_deg((int) $_tmp->wd);
        $_tmp->uv = $_tmp->uv < 0 ? 0 : $_tmp->uv;

        return json_encode($_tmp);
    }


    /**
     * @param $wind_value
     * @param $text
     * @return int
     * Calculate wind deg
     */
    private function _calc_wind_deg($wind_value) {
        $_wind_dir = [
            1 => 0, 12 => 22, 2 => 45, 23 => 67, 3 => 90, 34 => 112,
            4 => 135, 45 => 157, 5 => 180, 56 => 202, 6 => 225,
            67 => 247,  7 => 270, 78 => 292, 8 => 315, 81 => 337
        ];

        return key_exists($wind_value, $_wind_dir) ? $_wind_dir[$wind_value] : 0;
    }

    private function _wind_deg_to_name($wind_deg) {
        if (($wind_deg >= 337 && $wind_deg < 22) || $wind_deg == 0)
        {
            return 'Север';
        }
        else if ($wind_deg >= 22 && $wind_deg < 67)
        {
            return 'Северо-восток';
        }
        else if ($wind_deg >= 67 && $wind_deg < 112)
        {
            return 'Восток';
        }
        else if ($wind_deg >= 112 && $wind_deg < 157)
        {
            return 'Юго-восток';
        }
        else if ($wind_deg >= 157 && $wind_deg < 202)
        {
            return 'Юг';
        }
        else if ($wind_deg >= 202 && $wind_deg < 247)
        {
            return 'Юго-запад';
        }
        else if ($wind_deg >= 247 && $wind_deg < 292)
        {
            return 'Запад';
        }
        else if ($wind_deg >= 292 && $wind_deg < 337)
        {
            return 'Северо-запад';
        }
    }

    /**
     * Returns the calculated time of sunset and sunrise
     * @return object
     */
     protected function _sun() {
        return (object) [
            'rise' => date_sunrise(
                time(),
                SUNFUNCS_RET_TIMESTAMP,
                getenv('app.latitude'),
                getenv('app.longitude'),
                90,
                getenv('app.timezone')
            ),
            'set' => date_sunset(
                time(),
                SUNFUNCS_RET_TIMESTAMP,
                getenv('app.latitude'),
                getenv('app.longitude'),
                90,
                getenv('app.timezone')
            )
        ];
    }

    /**
     * Returns lunar data - sunset, dawn, age, phase, illumination, distance
     * @return object
     */
    protected function _moon()
    {
        $MoonCalc = new \MoonCalc();
        $MoonTime = \MoonTime::calculateMoonTimes(
            date("m"), date("d"), date("Y"),
            getenv('app.latitude'),
            getenv('app.longitude')
        );

        return (object) [
            'rise'         => $MoonTime->moonrise,
            'set'          => $MoonTime->moonset,
            'phrase'       => $MoonCalc->phase(),
            'age'          => $MoonCalc->age(),
            'diameter'     => $MoonCalc->diameter(),
            'distance'     => $MoonCalc->distance(),
            'illumination' => $MoonCalc->illumination(),
            'phase_name'   => $MoonCalc->phase_name(),
            'phase_icon'   => $MoonCalc->phase_name_icon(),
            'phase_new'    => round($MoonCalc->next_new_moon(), 0),
            'phase_full'   => round($MoonCalc->next_full_moon(), 0)
        ];
    }

    /**
     * Returns ready-made sensor data
     * @throws \Exception
     */
    protected function _fetch_data()
    {
        if (empty($this->_data)) return ;

        $count = 0;
        $temp  = [];

        foreach ($this->_data as $key => $item)
        {

            $item->item_raw_data = $this->_insert_additional_data($item->item_raw_data);

            if ($key === 0)
            {
                $this->_updated = $item->item_timestamp;
                $temp = $this->_make_initial_data(json_decode($item->item_raw_data));

                continue;
            }

            $_time_a = new \DateTime($this->_updated);
            $_time_b = new \DateTime($item->item_timestamp);
            $_avg_en = $_time_a->getTimestamp() - $_time_b->getTimestamp() <= 3600;

            if ($_avg_en) $count++;

            foreach (json_decode($item->item_raw_data) as $sensorKey => $sensorVal)
            {
                $temp[$sensorKey]->min = $sensorVal < $temp[$sensorKey]->min ? $sensorVal : $temp[$sensorKey]->min;
                $temp[$sensorKey]->max = $sensorVal > $temp[$sensorKey]->max ? $sensorVal : $temp[$sensorKey]->max;

                if ($_avg_en)
                {
                    $temp[$sensorKey]->trend += $sensorVal;
                }

                if (end($this->_data) === $item)
                {
                    $temp[$sensorKey]->trend = round($temp[$sensorKey]->value - ($temp[$sensorKey]->trend / $count), 1);
                }
            }
        }

        $this->_data = $temp;
    }

    /**
     * Creates an initial array of sensor data
     * @param $sensor_array
     * @return array|void
     */
    protected function _make_initial_data($sensor_array)
    {
        if (empty($sensor_array) || ! is_object($sensor_array)) return ;

        $_tmp = [];

        foreach ($sensor_array as $key => $val)
        {
            $_tmp[$key] = (object) [
                'value' => $val,
                'trend' => 0,
                'max'   => $val,
                'min'   => $val
            ];

            if ($key == 'wd')
            {
                $_tmp[$key]->info = $this->_wind_deg_to_name($val);
            }
        }

        return $_tmp;
    }
}
