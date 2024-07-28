<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateDailyAveragesTable extends Migration
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
            'date' => [
                'type' => 'DATETIME',
                'null' => false,
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
                'type' => 'FLOAT',
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
            'uvi' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'precipitation' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'clouds' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'visibility' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'wind_speed' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'wind_deg' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'wind_gust' => [
                'type' => 'FLOAT',
                'null' => true,
            ],
            'weather_id' => [
                'type' => 'INT',
                'null' => true,
            ],
            'weather_main' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'null'       => true,
            ],
            'weather_icon' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'null'       => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('daily_averages');
    }

    public function down()
    {
        $this->forge->dropTable('daily_averages');
    }
}
