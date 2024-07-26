<?php

namespace App\Controllers;

use App\Entities\RawWeatherDataEntity;
use App\Libraries\OpenWeatherLibrary;
use App\Models\RawWeatherDataModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Exception;

class System extends ResourceController {
    protected OpenWeatherLibrary $openWeather;
    protected RawWeatherDataModel $weatherDataModel;

    public function __construct()
    {
        $this->openWeather      = new OpenWeatherLibrary();
        $this->weatherDataModel = new RawWeatherDataModel();
    }

    /**
     * Get current weather data for given coordinates
     * @return ResponseInterface
     * @throws Exception
     */
    public function getCurrentWeather(): ResponseInterface
    {
        $data = $this->openWeather->getWeatherData();

        if ($data === false) {
            return $this->failServerError('Failed to retrieve weather data.');
        }

        try {
            $weatherDataEntity = new RawWeatherDataEntity();
            $weatherDataEntity->fill($data);

            $this->weatherDataModel->save($weatherDataEntity);

            return $this->respondCreated($weatherDataEntity);
        } catch (Exception $e) {
            log_message('error', 'Error saving weather data: {e}', ['e' => $e->getMessage()]);
            return $this->failServerError('Failed to save weather data.');
        }
    }
}