<?php namespace App\Controllers;

class Set extends BaseController
{

    /**
     * Device token
     * @var string
     */
    private $_token = 'A7FE9540D1F5';

    /**
     * The array contains input data obtained via GET or POST
     * @var array
     */
    protected $source;

    /**
     * Device data
     * @var
     */
    protected $rawData;

    /**
     * Device request source string
     * @var
     */
    protected $rawInput;

    /**
     * Receives data from a weather station, checks a token, enters data into a storage
     */
    public function data()
    {
        $_dataTable = getenv('database.table.data');

        $this->_select_source();
        $this->_check_token();
        $this->_fetch_data();

        // DEPRECATED
        // 'item_token' => $this->_token,
        // 'item_client_ip' => $this->request->getIPAddress(),

        $db = \Config\Database::connect();
        $db->table($_dataTable)->insert([
            'item_id'        => uniqid(),
            'item_raw_data'  => json_encode($this->rawData),
            'item_timestamp' => date("Y-m-d H:i:s")
        ]);

        $this->_narodmon($this->rawData);

        $response = ['state' => TRUE, 'data' => 'Data accepted'];

        log_message('notice', '[' .  __METHOD__ . '] Data inserted: ' . $this->rawInput);

        $this->_response($response, 200);
    }


    /**
     * Send data to narodmon
     * @param $data
     */
    private function _narodmon($data)
    {
        if ( ! $narodmon = cache('narodmon'))
        {
            $sendData = [
                'ID'    => getenv('app.narodmon.mac'),
                'LAT'   => getenv('app.narodmon.lat'),
                'LON'   => getenv('app.narodmon.lon'),
                'ALT'   => getenv('app.narodmon.alt'),
                'T'     => $data['t1'],
                'TD'    => $this->_calc_dew_point($data['h'], $data['t1']),
                'H'     => $data['h'],
                'P'     => $data['p'],
                'L'     => $data['lux'],
                'UV'    => ($data['uv'] < 0 ? 0 : $data['uv']),
                'WS'    => $data['ws'],
                'WD'    => $this->_calc_wind_deg((int) $data['wd'])
            ];

            $client   = \Config\Services::curlrequest();
            $api_url  = 'http://narodmon.ru/post';
            $response = $client->request('POST', $api_url, [
                'form_params' => $sendData
            ]);

            log_message('notice', '[' .  __METHOD__ . '] Send data to narodmon (CODE: ' . $response->getStatusCode() . ')');

            // Save into the cache for 80 sec
            cache()->save('narodmon', time(), 300);
        }
    }

    /**
     * #TODO Перенести в отдельную функцию
     * @param $wind_value
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

    /**
     * #TODO Перенести в отдельную функцию
     * Return calculated dew point value by temperature and humidity
     * @param $humidity float humidity
     * @param $temp float temperature
     * @return false|float
     */
    protected function _calc_dew_point($humidity, $temp)
    {
        return round(((pow(($humidity / 100), 0.125)) * (112 + 0.9 * $temp) + (0.1 * $temp) - 112),1);
    }


    /**
     * Fills device data into arrays
     */
    protected function _fetch_data()
    {
        $this->rawInput = '?';
        $this->rawData  = [];

        foreach ($this->source as $key => $val)
        {
            $this->rawInput     .= $key . '=' . $val . (end($this->source) != $val ? '&' : NULL);
            $this->rawData[$key] = (float) $val;
        }

        unset($this->rawData['id']);
    }

    /**
     * The method defines a global variable as a data source
     * @return mixed
     */
    protected function _select_source() {
        if ( ! empty($this->request->getPost())) {
            return $this->source = (object) $this->request->getPost();
        } else if ( ! empty($this->request->getGet())) {
            return $this->source = (object) $this->request->getGet();
        }

        $response = array('state' => false, 'error' => 'Empty data input array');

        log_message('error', '[' .  __METHOD__ . '] {error}', $response);

        $this->_response($response);
    }

    /**
     * Device ID Verification
     */
    protected function _check_token()
    {
        if (isset($this->source->id) && $this->source->id === $this->_token)
        {
            return ;
        }

        $response = ['state' => FALSE, 'error' => 'The device identifier is missing or incorrect'];
        $log_data = ['m' => __METHOD__, 'e' => $response['error'], 'd' => json_encode($this->source)];

        log_message('error', '[{m}] {e} {d}', $log_data);

        $this->_response($response);
    }

    /**
     * Generates an answer for the client
     * @param $data
     */
    protected function _response($data, $code = 400)
    {
        $this->response
            ->setStatusCode($code)
            ->setJSON($data)
            ->send();

        exit();
    }

}
