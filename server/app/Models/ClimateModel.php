<?php

namespace App\Models;

use CodeIgniter\Model;

/**
 * Class ClimateModel
 *
 * Computes long-term climate statistics from the daily_averages table.
 * All aggregation is performed server-side to avoid shipping thousands of
 * raw rows to the browser.
 *
 * @package App\Models
 *
 * Public Methods:
 * - getClimateStats(): array — orchestrates sub-queries and returns the full response array
 *
 * Protected Methods:
 * - _getAnnualStats(): array  — runs the per-year SQL aggregate query
 * - _getMonthlyNormals(): array — runs the per-calendar-month SQL query
 */
class ClimateModel extends Model
{
    protected $table = 'daily_averages';

    /**
     * The earliest year to include in climate statistics.
     */
    private const START_YEAR = 2022;

    /**
     * Build and return the complete climate statistics response.
     *
     * @return array{
     *     years: array,
     *     monthlyNormals: array,
     *     baselineAvgTemp: float,
     *     availableYears: int[]
     * }
     */
    public function getClimateStats(): array
    {
        $years          = $this->_getAnnualStats();
        $monthlyNormals = $this->_getMonthlyNormals();

        $baseline = count($years) > 0
            ? array_sum(array_column($years, 'avgTemp')) / count($years)
            : 0.0;

        $baseline = round($baseline, 2);

        foreach ($years as &$year) {
            $year['tempAnomaly'] = round($year['avgTemp'] - $baseline, 2);
        }
        unset($year);

        return [
            'years'           => $years,
            'monthlyNormals'  => $monthlyNormals,
            'baselineAvgTemp' => $baseline,
            'availableYears'  => array_values(array_column($years, 'year')),
        ];
    }

    /**
     * Run the annual aggregate query against daily_averages.
     *
     * @return array
     */
    protected function _getAnnualStats(): array
    {
        $rows = $this->db->query('
            SELECT
                YEAR(date)                AS year,
                AVG(temperature)          AS avg_temp,
                MIN(temperature)          AS min_temp,
                MAX(temperature)          AS max_temp,
                SUM(precipitation)        AS total_precip,
                SUM(precipitation > 0)    AS precip_days,
                SUM(temperature < -25)    AS frost_days,
                SUM(temperature >= 30)    AS hot_days,
                SUM(precipitation >= 4)   AS heavy_rain_days,
                AVG(pressure)             AS avg_pressure,
                AVG(humidity)             AS avg_humidity,
                AVG(wind_speed)           AS avg_wind_speed,
                AVG(clouds)               AS avg_clouds
            FROM daily_averages
            WHERE YEAR(date) >= ' . self::START_YEAR . '
            GROUP BY YEAR(date)
            ORDER BY year ASC
        ')->getResultArray();

        return array_map(static function (array $row): array {
            return [
                'year'          => (int) $row['year'],
                'avgTemp'       => round((float) $row['avg_temp'], 2),
                'minTemp'       => round((float) $row['min_temp'], 2),
                'maxTemp'       => round((float) $row['max_temp'], 2),
                'totalPrecip'   => round((float) $row['total_precip'], 2),
                'precipDays'    => (int) $row['precip_days'],
                'frostDays'     => (int) $row['frost_days'],
                'hotDays'       => (int) $row['hot_days'],
                'heavyRainDays' => (int) $row['heavy_rain_days'],
                'avgPressure'   => round((float) $row['avg_pressure'], 2),
                'avgHumidity'   => round((float) $row['avg_humidity'], 2),
                'avgWindSpeed'  => round((float) $row['avg_wind_speed'], 2),
                'avgClouds'     => round((float) $row['avg_clouds'], 2),
            ];
        }, $rows);
    }

    /**
     * Run the monthly normals query against daily_averages.
     *
     * @return array
     */
    protected function _getMonthlyNormals(): array
    {
        $rows = $this->db->query('
            SELECT
                MONTH(date)        AS month,
                AVG(temperature)   AS avg_temp,
                MIN(temperature)   AS min_temp,
                MAX(temperature)   AS max_temp,
                AVG(precipitation) AS avg_precip,
                AVG(clouds)        AS avg_clouds,
                AVG(wind_speed)    AS avg_wind_speed
            FROM daily_averages
            WHERE YEAR(date) >= ' . self::START_YEAR . '
            GROUP BY MONTH(date)
            ORDER BY month ASC
        ')->getResultArray();

        return array_map(static function (array $row): array {
            return [
                'month'        => (int) $row['month'],
                'avgTemp'      => round((float) $row['avg_temp'], 2),
                'minTemp'      => round((float) $row['min_temp'], 2),
                'maxTemp'      => round((float) $row['max_temp'], 2),
                'avgPrecip'    => round((float) $row['avg_precip'], 2),
                'avgClouds'    => round((float) $row['avg_clouds'], 2),
                'avgWindSpeed' => round((float) $row['avg_wind_speed'], 2),
            ];
        }, $rows);
    }
}
