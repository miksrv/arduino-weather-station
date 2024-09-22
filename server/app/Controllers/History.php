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
        $result = [];

        foreach ($this->_getData() as $data) {
            $result[] = new WeatherData($data);
        }

        return $this->respond($result);
    }

    /**
     * Get history weather data as CSV file
     * @return ResponseInterface
     * @throws Exception
     */
    public function getHistoryWeatherCSV(): ResponseInterface
    {
        // CSV file headers
        $csvHeader = [
            'UTC Date', 'Temperature', 'Feels Like', 'Pressure', 'Humidity', 'Dew Point', 
            'Visibility', 'UV Index', 'Solar Energy', 'Solar Radiation', 'Clouds', 
            'Precipitation', 'Wind Speed', 'Wind Gust', 'Wind Degree'
        ];

        // Open a temporary stream to write CSV data
        $tempFile = fopen('php://temp', 'r+');

        // Write headers to CSV
        fputcsv($tempFile, $csvHeader);

        // Get the data and write each line to CSV
        foreach ($this->_getData() as $data) {
            $row = [
                $data['date'],
                $data['temperature'],
                $data['feels_like'],
                $data['pressure'],
                $data['humidity'],
                $data['dew_point'],
                $data['uv_index'],
                $data['sol_energy'],
                $data['sol_radiation'],
                $data['precipitation'],
                $data['clouds'],
                $data['visibility'],
                $data['wind_speed'],
                $data['wind_gust'],
                $data['wind_deg']
            ];

            // Write the line to CSV
            fputcsv($tempFile, $row);
        }

        // Rewind the stream to the beginning
        rewind($tempFile);

        // Get the CSV contents as a string
        $csvContent = stream_get_contents($tempFile);

        // Close the stream
        fclose($tempFile);

        // Return the file as a response
        return $this->response
            ->setHeader('Content-Type', 'text/csv')
            ->setHeader('Content-Disposition', 'attachment; filename="weather_history.csv"')
            ->setBody($csvContent);
    }

    /**
     * Retrieves historical weather data based on the provided date range.
     * 
     * This method accepts 'start_date' and 'end_date' as query parameters and returns weather data
     * from the corresponding time period. The data is grouped by different intervals depending on
     * the duration of the date range.
     * 
     * - If the date range is 24 hours or less, data is grouped by 10 minutes.
     * - If the range is between 24 hours and 7 days, data is grouped by the hour.
     * - If the range is more than 7 days, data is grouped by day.
     * 
     * @return array|null Returns an array of weather data objects or null in case of errors.
     * 
     * @throws \CodeIgniter\HTTP\Exceptions\HTTPException If any required parameters are missing or invalid.
     * @throws \CodeIgniter\HTTP\Exceptions\HTTPException If the date is in the future or before 2020-01-01.
     */
    protected function _getData(): ?array {
        $startDate = $this->request->getGet('start_date');
        $endDate   = $this->request->getGet('end_date');

        // Check for the presence of parameters
        if (!$startDate || !$endDate) {
            return $this->fail('Missing required parameters: start_date or end_date', 400);
        }

        // Check date validity
        $currentTimestamp = time();
        $startTimestamp = strtotime($startDate);
        $endTimestamp   = strtotime($endDate);
        $minTimestamp   = strtotime('2020-01-01');

        if ($startTimestamp === false || $endTimestamp === false) {
            return $this->failValidationErrors('Invalid date format');
        }

        // Temporary commented: need to fix timeZones on the client side
        //  || $endTimestamp > $currentTimestamp
        if ($startTimestamp > $currentTimestamp) {
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

        return $historyData;
    }
}