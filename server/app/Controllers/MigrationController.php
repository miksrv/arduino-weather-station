<?php

namespace App\Controllers;

use App\Entities\WeatherDataEntity;
use App\Models\DailyAveragesModel;
use App\Models\HourlyAveragesModel;
use App\Models\MigrateWeatherDataModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\RESTful\ResourceController;
use Exception;
use ReflectionException;

class MigrationController extends ResourceController
{
    private const BATCH_SIZE = 1000; // Количество записей для обработки за один раз

    protected RawWeatherDataModel $weatherDataModel;
    protected HourlyAveragesModel $hourlyAveragesModel;
    protected DailyAveragesModel $dailyAveragesModel;

    public function __construct() {
        $this->weatherDataModel    = new RawWeatherDataModel();
        $this->hourlyAveragesModel = new HourlyAveragesModel();
        $this->dailyAveragesModel  = new DailyAveragesModel();
    }

    /**
     * @throws \ReflectionException
     */
    public function migrateWeatherData()
    {
        helper('weather');

        $migrateModel = new MigrateWeatherDataModel();

        $offset = 0;
        while (true) {
            // Получаем порцию данных
            $oldData = $migrateModel->orderBy('item_utc_date', 'asc')->findAll(self::BATCH_SIZE, $offset);

            // Если данных больше нет, выходим из цикла
            if (empty($oldData)) {
                break;
            }

            $newData = [];
            foreach ($oldData as $item) {
                $newData[] = [
                    'date'          => $item->item_utc_date->toDateTimeString(),
                    'temperature'   => $item->temperature,
                    'feels_like'    => $item->feels_like,
                    'pressure'      => mmHg_to_hPa($item->pressure),
                    'humidity'      => $item->humidity,
                    'clouds'        => $item->clouds,
                    'wind_speed'    => $item->wind_speed,
                    'wind_deg'      => $item->wind_deg,
                    'wind_gust'     => $item->wind_gust,
                    'dew_point'     => calculateDewPoint($item->temperature, $item->humidity),
                    'precipitation' => $item->precipitation,
                    'source'        => RawWeatherDataModel::SOURCE_WEATHERAPI
                ];
            }

            // Вставляем порцию данных в новую таблицу
            $this->weatherDataModel->insertBatch($newData);

            // Увеличиваем смещение для следующей порции данных
            $offset += self::BATCH_SIZE;
        }

        // Calculate and save hourly averages
        $this->saveHourlyAverages();

        // Calculate and save daily averages
        $this->saveDailyAverages();

        return $this->respond(['message' => 'Migration completed successfully']);
    }

    /**
     * @throws ReflectionException
     */
    protected function saveHourlyAverages(): void
    {
        $hourlyData = $this->weatherDataModel->getHourlyAverages(true);

        foreach ($hourlyData as $data) {
            $existingRecordData  = $this->hourlyAveragesModel->select('id')->where('date', $data['date'])->first();
            $hourlyAverageEntity = new WeatherDataEntity();
            $hourlyAverageEntity->fill($data);

            if ($existingRecordData) {
                $hourlyAverageEntity->id = $existingRecordData->id;
            }

            $this->hourlyAveragesModel->save($hourlyAverageEntity);
        }
    }

    /**
     * @throws ReflectionException
     * @throws Exception
     */
    protected function saveDailyAverages(): void
    {
        $hourlyData = $this->weatherDataModel->getDailyAverages(true);

        foreach ($hourlyData as $data) {
            $existingRecordData = $this->dailyAveragesModel->select('id')->where('date', $data['date'])->first();
            $dailyAverageEntity = new WeatherDataEntity();
            $dailyAverageEntity->fill($data);

            if ($existingRecordData) {
                $dailyAverageEntity->id = $existingRecordData->id;
            }

            $this->dailyAveragesModel->save($dailyAverageEntity);
        }
    }
}
