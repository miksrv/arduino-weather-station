<?php

namespace App\Controllers;

use App\Libraries\WeatherStation;

class Set extends BaseController
{
    protected $WeatherStation;

    protected $source; // GET or POST array data
    protected $data;   // Array data received from device
    protected $query;  // Device request source string

    function __construct()
    {
        $this->WeatherStation = new WeatherStation();
    }

    /**
     * Метод получает данные с метеостанции, миксует с данными из OpenWeatherMap и добавляет их в БД
     * @example http://meteo.miksoft.pro/api/set/sensors?id=A7FE9540D1F5&p=750.1&t=16.3&h=56.7&i=365&uv=0.08&ws=5&wd=54
     */
    function sensors()
    {
        $this->_select_source();
        $this->_check_token();
        $this->_fetch_data();

        $this->WeatherStation->add_data($this->data);

        $this->_response(['state' => TRUE, 'data' => 'Data accepted'], 200);
    }

    /**
     * Fills device data into arrays
     */
    protected function _fetch_data()
    {
        $this->query = '?';
        $this->data  = (object) [];

        foreach ($this->source as $key => $val)
        {
            $this->query .= $key . '=' . $val . (end($this->source) != $val ? '&' : NULL);
            $this->data->{$key} = $val;
        }

        unset($this->data->id);
    }

    /**
     * The method defines a global variable as a data source
     * @return object|void
     */
    protected function _select_source() {
        if ( ! empty($this->request->getPost())) {
            return $this->source = (object) $this->request->getPost();
        } else if ( ! empty($this->request->getGet())) {
            return $this->source = (object) $this->request->getGet();
        }

        $response = ['state' => false, 'error' => 'Empty data input array'];

        log_message('error', '[' .  __METHOD__ . '] {error}', $response);

        $this->_response($response);
    }

    /**
     * Device ID Verification
     */
    protected function _check_token()
    {
        if (isset($this->source->id) && $this->source->id === getenv('app.token')) return ;

        $response = ['state' => FALSE, 'error' => 'The device identifier is missing or incorrect'];
        $log_data = ['m' => __METHOD__, 'e' => $response['error'], 'd' => json_encode($this->source)];

        log_message('error', '[{m}] {e} {d}', $log_data);

        $this->_response($response);
    }

    /**
     * Generates an answer for the client
     * @param $data
     * @param int $code
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
