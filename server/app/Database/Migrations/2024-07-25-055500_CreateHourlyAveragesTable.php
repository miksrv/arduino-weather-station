<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateHourlyAveragesTable extends Migration
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
            'hour' => [
                'type'       => 'DATETIME',
                'null'       => false,
            ],
            'average_temperature' => [
                'type'       => 'FLOAT',
                'null'       => true,
            ],
            'average_feels_like' => [
                'type'       => 'FLOAT',
                'null'       => true,
            ],
            'average_pressure' => [
                'type'       => 'FLOAT',
                'null'       => true,
            ],
            'average_humidity' => [
                'type'       => 'FLOAT',
                'null'       => true,
            ],
            'average_dew_point' => [
                'type'       => 'FLOAT',
                'null'       => true,
            ],
            'average_uvi' => [
                'type'       => 'FLOAT',
                'null'       => true,
            ],
            'average_clouds' => [
                'type'       => 'FLOAT',
                'null'       => true,
            ],
            'average_visibility' => [
                'type'       => 'FLOAT',
                'null'       => true,
            ],
            'average_wind_speed' => [
                'type'       => 'FLOAT',
                'null'       => true,
            ],
            'average_wind_deg' => [
                'type'       => 'FLOAT',
                'null'       => true,
            ],
            'average_wind_gust' => [
                'type'       => 'FLOAT',
                'null'       => true,
            ],
            'weather_id' => [
                'type'       => 'INT',
                'null'       => true,
            ],
            'weather_main' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'null'       => true,
            ],
            'weather_description' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
                'null'       => true,
            ],
            'weather_icon' => [
                'type'       => 'VARCHAR',
                'constraint' => '10',
                'null'       => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('hourly_averages');
    }

    public function down()
    {
        $this->forge->dropTable('hourly_averages');
    }
}
