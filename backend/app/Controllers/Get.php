<?php namespace App\Controllers;

use App\Api\Weather;
use App\Api\Statistic;
use App\Api\Heatmap;
use App\Api\Uptime;

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: GET, OPTIONS");

/**
 * Basic controller for receiving data through the service API.
 */
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

    /**
     * Returns an array of the forecast at intervals of 4 hours
     */
    function forecast()
    {
        $data = $this->Weather->get_forecast();
        $this->_response($data->update, $data->payload);
    }

    /**
     * Returns the current weather parameters
     */
    function current()
    {
        $data = $this->Weather->get_last();
        $this->_response($data->update, $data->payload);
    }

    /**
     * Returns the current weather parameters in text format for use,
     * for example, on the observatory server (INDI driver)
     */
    function current_text()
    {
        $data = $this->Weather->get_last();
        $text = "dataGMTTime=" . gmdate('Y/m/d H:i:s') . PHP_EOL;

        foreach ($data->payload as $key => $value)
        {
            $text .= "{$key}={$value}" . PHP_EOL;
        }

        $this->response->setContentType('text/plain')->setBody($text)->send();

        exit();
    }

    /**
     * Returns an array of readings and dynamics of changes for all available sensors
     */
    function sensors()
    {
        $data = $this->Weather->get_sensors();
        $this->_response($data->update, $data->payload);
    }

    /**
     * Возвращяет массив данных для формирования диаграмы по запрашиваемым датчикам и в заданном интервале дат
     * @example https://meteo.miksoft.pro/api/get/statistic?date_start=2021-10-01&date_end=2021-10-10&sensors=temperature
     */
    function statistic()
    {
        $period  = $this->_get_period();
        $sensors = $this->_get_sensors();
        $data    = $this->Statistic->get_data($period, $sensors);

        $this->_response($data->update, $data->payload);
    }

    /**
     * Returns an array of data for the formation of a diagram - a heat map for the requested sensors and in a given date interval
     * @example https://meteo.miksoft.pro/api/get/heatmap?date_start=2021-10-01&date_end=2021-10-10&sensors=temperature
     */
    function heatmap()
    {
        $period  = $this->_get_period();
        $sensors = $this->_get_sensors();
        $Heatmap = new Heatmap();
        $data    = $Heatmap->get_data($period, $sensors);

        $this->_response($data->update, $data->payload);
    }

    /**
     * Returns the operating time of the weather station per day as a percentage
     */
    function uptime()
    {
        $this->Uptime = new Uptime();

        $data = $this->Uptime->get_uptime();
        $this->_response($data->update, $data->payload);
    }

    /**
     * Creates an array of requested sensors from the GET parameter
     * @return array|false|string[]|null
     */
    protected function _get_sensors()
    {
        $string = $this->request->getGet('sensors');
        $array  = explode(',', $string);

        if ( ! $string || ! is_array($array)) return null;

        return $array;
    }

    /**
     * Forms an object with a range of dates that it gets from the GET parameter.
     * If there is no such parameter or the dates are not valid, the interval is returned after the current date.
     * @return object
     */
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

    /**
     * Gets the date by the name of the GET parameter, checks for validity
     * @param $param_name
     * @return false|string|null
     */
    protected function _get_date($param_name)
    {
        $date = $this->request->getGet($param_name);

        if ( ! $date) return null;

        $date = strtotime($date);

        if ( ! checkdate(date('m', $date), date('d', $date), date('Y', $date)))
            return null;

        return gmdate('Y-m-d', $date);
    }

    /**
     * Generates a response in JSON format
     * @param int $update
     * @param $payload
     */
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
            ->setJSON($response)
            ->send();

        exit();
    }
}
