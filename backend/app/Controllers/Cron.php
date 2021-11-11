<?php

namespace App\Controllers;

use App\Libraries\OpenWeather;

class Cron extends BaseController
{
    protected $OpenWeather;

    function __construct()
    {
        $this->OpenWeather = new OpenWeather();
    }

    function index()
    {
        if ( ! $this->OpenWeather->current() || ! $this->OpenWeather->forecast()) {
            $response = ['state' => FALSE, 'error' => 'Invalid Data, URL or remote server not responding'];
            $this->_response($response, 500);
        }

        $response = ['state' => TRUE, 'data' => 'OpenWeather data updated'];
        $this->_response($response, 200);
    }

    protected function _response($data, $code = 400)
    {
        $this->response
            ->setStatusCode($code)
            ->setJSON($data)
            ->send();

        exit();
    }
}
