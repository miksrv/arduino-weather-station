<?php

namespace App\Controllers;

use App\Entities\WeatherData;
use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Exception;

/**
 * Class History
 *
 * This class handles the retrieval of historical weather data and provides it in different formats.
 *
 * @package App\Controllers
 *
 * Public Methods:
 * - getHistoryWeather(): Retrieves and returns historical weather data.
 * - getHistoryWeatherCSV(): Retrieves historical weather data and returns it as a CSV file.
 *
 * Usage:
 * $history = new History();
 * $history->getHistoryWeather();
 * $history->getHistoryWeatherCSV();
 */
class History extends ResourceController {
    /** @var int Cache TTL for recent data requests (1 hour) */
    public const CACHE_TTL_RECENT = 60 * 60;

    /** @var int Cache TTL for purely historical requests (indefinite) */
    public const CACHE_TTL_HISTORICAL = 0;

    /** @var int Minimum range in hours to enable caching */
    public const CACHE_MIN_RANGE_HOURS = 48;

    /** @var int Number of days to consider data as "recent" (not fully historical) */
    public const CACHE_RECENT_DAYS_THRESHOLD = 7;

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

        // Calculate range in hours for cache decision
        $startTimestamp = strtotime($startDate ?? 'today');
        $endTimestamp   = strtotime($endDate ?? 'today');
        $rangeHours     = ($endTimestamp - $startTimestamp) / 3600;

        // Disable caching for short ranges (≤48 hours) due to timezone differences
        if ($rangeHours <= self::CACHE_MIN_RANGE_HOURS) {
            $rawData = $this->_getData();

            if (!is_array($rawData)) {
                return $rawData;
            }

            $result = [];
            foreach ($rawData as $data) {
                $result[] = new WeatherData($data);
            }

            return $this->respond($result);
        }

        $cacheKey = 'history_' . md5(($startDate ?? '') . '_' . ($endDate ?? ''));
        $rawData  = cache()->get($cacheKey);

        if (!is_array($rawData)) {
            $rawData = $this->_getData();

            if (is_array($rawData)) {
                // Determine cache TTL based on how recent the end date is
                // If end_date is within the last 7 days, use short TTL (1 hour)
                // If end_date is older than 7 days ago, cache indefinitely
                $recentThreshold = strtotime('-' . self::CACHE_RECENT_DAYS_THRESHOLD . ' days');
                $ttl = $endTimestamp >= $recentThreshold
                    ? self::CACHE_TTL_RECENT
                    : self::CACHE_TTL_HISTORICAL;

                cache()->save($cacheKey, $rawData, $ttl);
            }
        }

        if (!is_array($rawData)) {
            return $rawData;
        }

        $result = [];

        foreach ($rawData as $data) {
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
     * @return array|ResponseInterface Returns an array of weather data objects or Response in case of validation errors.
     *
     * @throws \CodeIgniter\HTTP\Exceptions\HTTPException If any required parameters are missing or invalid.
     * @throws \CodeIgniter\HTTP\Exceptions\HTTPException If the date is in the future or before 2020-01-01.
     */
    protected function _getData(): array|ResponseInterface {
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
        // Allow dates up to end of tomorrow to account for timezone differences
        $maxAllowedTimestamp = strtotime('tomorrow 23:59:59');

        if ($startTimestamp === false || $endTimestamp === false) {
            return $this->failValidationErrors('Invalid date format');
        }

        if ($startTimestamp > $maxAllowedTimestamp || $endTimestamp > $maxAllowedTimestamp) {
            return $this->failValidationErrors('Date cannot be in the future');
        }

        if ($startTimestamp < $minTimestamp) {
            return $this->failValidationErrors('Date cannot be before 2020-01-01');
        }

        if ($endTimestamp - $startTimestamp > 366 * 86400) {
            return $this->failValidationErrors('Date range cannot exceed 366 days.');
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
