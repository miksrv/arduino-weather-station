<?php namespace App\Controllers;

use App\Api\Weather;
use App\Api\Statistic;
use App\Api\Uptime;

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: GET, OPTIONS");

class Get extends BaseController
{
    protected Weather $Weather;
    protected Statistic $Statistic;
    protected Uptime $Uptime;

    function __construct()
    {
        $this->Weather   = new Weather();
        $this->Statistic = new Statistic();
    }

    function forecast()
    {
        $data = $this->Weather->get_forecast();
        $this->_response($data->update, $data->payload);
    }

    function current()
    {
        $data = $this->Weather->get_last();
        $this->_response($data->update, $data->payload);
    }

    function sensors()
    {
        $data = $this->Weather->get_sensors();
        $this->_response($data->update, $data->payload);
    }

    /**
     * https://meteo.miksoft.pro/api/get/statistic?date_start=2021-10-01&date_end=2021-10-10&sensors=temperature,pressure,humidity
     */
    function statistic()
    {
        $period  = $this->_get_period();
        $sensors = $this->_get_sensors();
        $data    = $this->Statistic->get_data($period, $sensors);
        
        $this->_response(time(), $data);
    }

    function uptime()
    {
        $this->Uptime = new Uptime();

        $data = $this->Uptime->get_uptime();
        $this->_response($data->update, $data->payload);
    }

    protected function _get_sensors()
    {
        $string = $this->request->getGet('sensors');
        $array  = explode(',', $string);

        if ( ! $string || ! is_array($array)) return null;

        return $array;
    }

    protected function _get_period(): object
    {
        $date_start = $this->_get_date('date_start');
        $date_end   = $this->_get_date('date_end');

        if ( ! $date_start || ! $date_end) return (object) [
            'start' => gmdate('Y-m-d'),
            'end'   => gmdate('Y-m-d')
        ];

        return (object) [
            'start' => $date_start,
            'end'   => $date_end
        ];
    }

    protected function _get_date($param_name)
    {
        $date = $this->request->getGet($param_name);

        if ( ! $date) return null;

        $date = strtotime($date);

        if ( ! checkdate(date('m', $date), date('d', $date), date('Y', $date)))
            return null;

        return gmdate('Y-m-d', $date);
    }

    protected function _response(int $update, $payload)
    {
        $response = [
            'status' => true,
            'timestamp' => [
                'server' => (int) gmdate('U'),
                'update' => $update
            ],
            'payload' => $payload
        ];

        $this->response
            ->setStatusCode(200)
            ->setJSON($response)
            ->send();

        exit();
    }
}
