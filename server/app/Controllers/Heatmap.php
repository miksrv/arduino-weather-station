<?php

namespace App\Controllers;

use App\Entities\WeatherData;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Exception;

/**
 * Class Heatmap
 *
 * This class handles the retrieval of heatmap data for various weather types.
 *
 * @package App\Controllers
 *
 * Public Methods:
 * - getHeatmapData(): Retrieves heatmap data for a specific weather type within a given date range.
 *
 * Usage:
 * $heatmap = new Heatmap();
 * $heatmap->getHeatmapData();
 */
class Heatmap extends ResourceController {
    protected RawWeatherDataModel $weatherDataModel;

    public function __construct()
    {
        $this->weatherDataModel = new RawWeatherDataModel();
    }

    /**
     * Get heatmap data for a specific weather type.
     * @return ResponseInterface
     * @throws Exception
     */
    public function getHeatmapData(): ResponseInterface
    {
        $type      = $this->request->getGet('type');
        $startDate = $this->request->getGet('start_date');
        $endDate   = $this->request->getGet('end_date');

        // List of valid types
        $validTypes = ['temperature', 'pressure', 'humidity', 'precipitation', 'clouds', 'wind_speed'];

        // Validate type
        if (!$type || !in_array($type, $validTypes)) {
            return $this->failValidationErrors('Invalid or missing type parameter. Valid values: ' . implode(', ', $validTypes));
        }

        // Validate start_date and end_date
        if (!$startDate || !$endDate) {
            return $this->fail('Missing required parameters: start_date or end_date', 400);
        }

        $startTimestamp = strtotime($startDate);
        $endTimestamp = strtotime($endDate);

        if ($startTimestamp === false || $endTimestamp === false) {
            return $this->failValidationErrors('Invalid date format');
        }

        $currentTimestamp = time();
        $minTimestamp = strtotime('2020-01-01');

        if ($startTimestamp > $currentTimestamp || $startTimestamp < $minTimestamp) {
            return $this->failValidationErrors('Date is out of valid range. It cannot be in the future or before 2020-01-01.');
        }

        // Format the dates
        $startDate = date('Y-m-d 00:00:00', $startTimestamp);
        $endDate = date('Y-m-d 23:59:59', $endTimestamp);

        // Get the heatmap data grouped by 10 minutes
        $heatmapData = $this->weatherDataModel->getWeatherHistoryGrouped($startDate, $endDate, '10 MINUTE', $type);

        if (empty($heatmapData)) {
            return $this->failNotFound('No data found for the given date range and type');
        }

        $result = [];

        foreach ($heatmapData as $data) {
            $result[] = new WeatherData($data);
        }

        return $this->respond($result);
    }
}
