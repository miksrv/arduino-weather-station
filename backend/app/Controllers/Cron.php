<?php namespace App\Controllers;

use App\Libraries\OpenWeather;
use App\Libraries\MeanWeather;
use App\Libraries\NarodMon;

class Cron extends BaseController
{
    protected OpenWeather $OpenWeather;
    protected MeanWeather $MeanWeather;
    protected NarodMon $NarodMon;

    function __construct()
    {
        $this->OpenWeather = new OpenWeather();
        $this->MeanWeather = new MeanWeather();
        $this->NarodMon = new NarodMon();
    }

    function index()
    {
        if ( ! $this->OpenWeather->current() || ! $this->OpenWeather->forecast()) {
            $response = ['state' => FALSE, 'error' => 'Invalid Data, URL or remote server not responding'];
            $this->_response($response, 500);
        }

        $this->MeanWeather->run();
        $this->NarodMon->report();

        $response = ['state' => TRUE, 'data' => 'All data has been updated'];
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
