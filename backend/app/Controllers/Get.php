<?php

namespace App\Controllers;

use App\Libraries\ApiWeather;

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: GET, OPTIONS");

class Get extends BaseController
{
    protected $ApiWeather;

    function __construct()
    {
        $this->ApiWeather = new ApiWeather();
    }

    function forecast()
    {
        $data = $this->ApiWeather->get_forecast();
        $this->_response($data->update, $data->payload);
    }

    function current()
    {
        $data = $this->ApiWeather->get_last();
        $this->_response($data->update, $data->payload);
    }

    function sensors()
    {
        $data = $this->ApiWeather->get_sensors();
        $this->_response($data->update, $data->payload);
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
