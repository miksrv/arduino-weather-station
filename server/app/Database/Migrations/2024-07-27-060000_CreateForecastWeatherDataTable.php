<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateForecastWeatherDataTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'forecast_time' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
            'source' => [
                'type'       => 'ENUM',
                'constraint' => ['OpenWeatherMap', 'WeatherAPI', 'VisualCrossing', 'CustomStation', 'OtherSource'],
                'default'    => 'OpenWeatherMap',
                'null'       => false,
            ],
            'temperature' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'feels_like' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'pressure' => [
                'type' => 'INT',
                'null' => true,
            ],
            'humidity' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'dew_point' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'uv_index' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'sol_energy' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'sol_radiation' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'precipitation' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'clouds' => [
                'type' => 'INT',
                'null' => true,
            ],
            'visibility' => [
                'type' => 'INT',
                'null' => true,
            ],
            'wind_speed' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'wind_deg' => [
                'type' => 'INT',
                'null' => true,
            ],
            'wind_gust' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'weather_id' => [
                'type' => 'INT',
                'null' => true,
            ]
        ]);
        $this->forge->addKey('id', true, true);
        $this->forge->addKey('forecast_time');
        $this->forge->createTable('forecast_weather_data');
    }

    public function down()
    {
        $this->forge->dropTable('forecast_weather_data');
    }
}

