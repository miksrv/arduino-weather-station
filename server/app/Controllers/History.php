<?php

namespace App\Controllers;

use App\Entities\WeatherData;
use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Exception;

class History extends ResourceController {
    protected RawWeatherDataModel $weatherDataModel;
    protected HourlyAveragesModel $hourlyAveragesModel;
    protected DailyAveragesModel $dailyAveragesModel;

    public function __construct()
    {
        $this->weatherDataModel    = new RawWeatherDataModel();
        $this->hourlyAveragesModel = new HourlyAveragesModel();
        $this->dailyAveragesModel  = new DailyAveragesModel();
    }

    /**
     * Get history weather data
     * @return ResponseInterface
     * @throws Exception
     */
    public function getHistoryWeather(): ResponseInterface
    {
        $startDate = $this->request->getGet('start_date');
        $endDate   = $this->request->getGet('end_date');

        // Проверка на наличие параметров
        if (!$startDate || !$endDate) {
            return $this->fail('Missing required parameters: start_date or end_date', 400);
        }

        // Проверка валидности дат
        $currentTimestamp = time();
        $startTimestamp = strtotime($startDate);
        $endTimestamp   = strtotime($endDate);
        $minTimestamp   = strtotime('2020-01-01');

        if ($startTimestamp === false || $endTimestamp === false) {
            return $this->failValidationErrors('Invalid date format');
        }

        if ($startTimestamp > $currentTimestamp || $endTimestamp > $currentTimestamp) {
            return $this->failValidationErrors('Date cannot be in the future');
        }

        if ($startTimestamp < $minTimestamp) {
            return $this->failValidationErrors('Date cannot be before 2020-01-01');
        }

        // Calculating the range
        $dateDiff  = ($endTimestamp - $startTimestamp) / (60 * 60 * 24); // difference in days
        $startDate = date('Y-m-d 00:00:00', strtotime($startDate));
        $endDate   = date('Y-m-d 23:59:59', strtotime($endDate));

        // Selecting a model and grouping
        if ($dateDiff <= 1) {
            // 24 hour range - RawWeatherDataModel (grouped by 10 minutes)
            $historyData = $this->weatherDataModel->getWeatherHistoryGrouped($startDate, $endDate, '10 MINUTE');
        } elseif ($dateDiff <= 7) {
            // Range from 24 hours to 7 days - Hourly Average Model (grouped by hour)
            $historyData = $this->hourlyAveragesModel->getWeatherHistoryGrouped($startDate, $endDate, '1 HOUR');
        } else {
            // Range from 7 days (grouped by day)
            $historyData = $this->dailyAveragesModel->getWeatherHistoryGrouped($startDate, $endDate, '1 DAY');
        }

        return $this->respond($historyData);
    }
}