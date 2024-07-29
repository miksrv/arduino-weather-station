<?php

namespace App\Controllers;

use App\Models\MigrateWeatherDataModel;
use App\Models\RawWeatherDataModel;

class MigrationController extends BaseController
{
    private const BATCH_SIZE = 1000; // Количество записей для обработки за один раз

    public function migrateWeatherData()
    {
        $migrateModel = new MigrateWeatherDataModel();
        $rawWeatherModel = new RawWeatherDataModel();

        $offset = 0;
        while (true) {
            // Получаем порцию данных
            $oldData = $migrateModel->orderBy('id', 'asc')->findAll(self::BATCH_SIZE, $offset);

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
                    'pressure'      => $this->convertPressureToPascals($item->pressure),
                    'humidity'      => $item->humidity,
                    'clouds'        => $item->clouds,
                    'wind_speed'    => $item->wind_speed,
                    'wind_deg'      => $item->wind_deg,
                    'wind_gust'     => $item->wind_gust,
                    'precipitation' => $item->precipitation,
                    'source'        => 'Migration'
                ];
            }

            // Вставляем порцию данных в новую таблицу
            $rawWeatherModel->insertBatch($newData);

            // Увеличиваем смещение для следующей порции данных
            $offset += self::BATCH_SIZE;
        }

        return $this->respond(['message' => 'Migration completed successfully']);
    }

    private function convertPressureToPascals($pressure): ?float
    {
        if ($pressure === null) {
            return null;
        }
        // 1 мм рт. ст. = 133.322 Па
        return $pressure * 133.322;
    }
}
