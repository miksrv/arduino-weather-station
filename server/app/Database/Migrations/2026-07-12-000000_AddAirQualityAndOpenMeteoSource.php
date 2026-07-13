<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Adds air quality columns (pm2_5, pm10, co, no2, so2, o3) to
 * raw_weather_data, hourly_averages, and daily_averages, and extends the
 * `source` ENUM on raw_weather_data and forecast_weather_data with the new
 * 'OpenMeteo' provider value.
 *
 * forecast_weather_data intentionally does NOT receive the air quality
 * columns — Open-Meteo forecast air-quality data is out of scope for this
 * change, matching how VisualCrossing already has no forecast support and
 * how sol_energy/sol_radiation are already excluded from OpenWeatherMap and
 * WeatherAPI forecast mapping.
 */
class AddAirQualityAndOpenMeteoSource extends Migration
{
    /** @var string[] Tables that receive the new air quality columns */
    private const AIR_QUALITY_TABLES = ['raw_weather_data', 'hourly_averages', 'daily_averages'];

    /** @var array Shared field definitions for the 6 new air quality columns */
    private const AIR_QUALITY_FIELDS = [
        'pm2_5' => [
            'type' => 'FLOAT',
            'null' => true,
        ],
        'pm10' => [
            'type' => 'FLOAT',
            'null' => true,
        ],
        'co' => [
            'type' => 'FLOAT',
            'null' => true,
        ],
        'no2' => [
            'type' => 'FLOAT',
            'null' => true,
        ],
        'so2' => [
            'type' => 'FLOAT',
            'null' => true,
        ],
        'o3' => [
            'type' => 'FLOAT',
            'null' => true,
        ],
    ];

    /** @var string[] Original source ENUM constraint list (pre-OpenMeteo) */
    private const ORIGINAL_SOURCE_VALUES = ['OpenWeatherMap', 'WeatherAPI', 'VisualCrossing', 'CustomStation', 'OtherSource'];

    /** @var string[] Updated source ENUM constraint list (with OpenMeteo) */
    private const UPDATED_SOURCE_VALUES = ['OpenWeatherMap', 'WeatherAPI', 'VisualCrossing', 'OpenMeteo', 'CustomStation', 'OtherSource'];

    public function up()
    {
        foreach (self::AIR_QUALITY_TABLES as $table) {
            $this->forge->addColumn($table, self::AIR_QUALITY_FIELDS);
        }

        foreach (['raw_weather_data', 'forecast_weather_data'] as $table) {
            $this->forge->modifyColumn($table, [
                'source' => [
                    'type'       => 'ENUM',
                    'constraint' => self::UPDATED_SOURCE_VALUES,
                    'default'    => 'OpenWeatherMap',
                    'null'       => false,
                ],
            ]);
        }
    }

    public function down()
    {
        foreach (self::AIR_QUALITY_TABLES as $table) {
            $this->forge->dropColumn($table, array_keys(self::AIR_QUALITY_FIELDS));
        }

        foreach (['raw_weather_data', 'forecast_weather_data'] as $table) {
            $this->forge->modifyColumn($table, [
                'source' => [
                    'type'       => 'ENUM',
                    'constraint' => self::ORIGINAL_SOURCE_VALUES,
                    'default'    => 'OpenWeatherMap',
                    'null'       => false,
                ],
            ]);
        }
    }
}
