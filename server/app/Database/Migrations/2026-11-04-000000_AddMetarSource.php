<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Extends the `source` ENUM on raw_weather_data and forecast_weather_data
 * with the airport METAR observation source ('Metar'). forecast_weather_data
 * gets it too so both tables keep the same list of sources, although METAR
 * itself has no forecast.
 */
class AddMetarSource extends Migration
{
    /** @var string[] Tables with the `source` ENUM column */
    private const TABLES = ['raw_weather_data', 'forecast_weather_data'];

    /** @var string[] Source ENUM values before this migration */
    private const ORIGINAL_SOURCE_VALUES = ['OpenWeatherMap', 'WeatherAPI', 'VisualCrossing', 'OpenMeteo', 'CustomStation', 'OtherSource'];

    /**
     * @var string[] Source ENUM values with Metar, appended last: MySQL adds a value at the end of an ENUM in place,
     * while one inserted in the middle rebuilds the whole table (and locks the large raw_weather_data meanwhile)
     */
    private const UPDATED_SOURCE_VALUES = ['OpenWeatherMap', 'WeatherAPI', 'VisualCrossing', 'OpenMeteo', 'CustomStation', 'OtherSource', 'Metar'];

    public function up()
    {
        $this->_setSourceValues(self::UPDATED_SOURCE_VALUES);
    }

    public function down()
    {
        // Rows of the removed source would not fit the narrower ENUM
        foreach (self::TABLES as $table) {
            $this->db->table($table)->where('source', 'Metar')->delete();
        }

        $this->_setSourceValues(self::ORIGINAL_SOURCE_VALUES);
    }

    /**
     * @param string[] $values Allowed source values.
     * @return void
     */
    private function _setSourceValues(array $values): void
    {
        foreach (self::TABLES as $table) {
            $this->forge->modifyColumn($table, [
                'source' => [
                    'type'       => 'ENUM',
                    'constraint' => $values,
                    'default'    => 'OpenWeatherMap',
                    'null'       => false,
                ],
            ]);
        }
    }
}
