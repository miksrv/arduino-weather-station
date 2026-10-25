<?php

namespace App\Models;

use Config\App;
use App\Entities\WeatherForecastEntity;
use App\Libraries\ForecastAggregator;
use DateTimeImmutable;
use DateTimeZone;
use CodeIgniter\Model;

/**
 * Model for the forecast_weather_data table.
 *
 * Stores forecast records fetched from external weather APIs. Provides
 * hourly and daily aggregation methods (see ForecastAggregator) consumed by the Forecast controller
 * and the Current controller (next-hour precipitation look-ahead).
 *
 * @package App\Models
 */
class ForecastWeatherDataModel extends Model
{
    protected $table            = 'forecast_weather_data';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = WeatherForecastEntity::class;
    protected $useSoftDeletes   = false;
    protected $allowedFields    = [
        'forecast_time',
        'source',
        'temperature',
        'feels_like',
        'pressure',
        'humidity',
        'dew_point',
        'uv_index',
        'sol_energy',
        'sol_radiation',
        'precipitation',
        'clouds',
        'visibility',
        'wind_speed',
        'wind_deg',
        'wind_gust',
        'weather_id',
    ];

    protected $useTimestamps = false;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $validationRules = [
        'forecast_time' => 'required|valid_date',
        'source'        => 'required|in_list[OpenWeatherMap,WeatherAPI,VisualCrossing,OpenMeteo,CustomStation,OtherSource]',
        'temperature'   => 'permit_empty|decimal',
        'feels_like'    => 'permit_empty|decimal',
        'pressure'      => 'permit_empty|integer',
        'humidity'      => 'permit_empty|decimal',
        'dew_point'     => 'permit_empty|decimal',
        'uv_index'      => 'permit_empty|decimal',
        'sol_energy'    => 'permit_empty|decimal',
        'sol_radiation' => 'permit_empty|decimal',
        'precipitation' => 'permit_empty|decimal',
        'clouds'        => 'permit_empty|integer',
        'visibility'    => 'permit_empty|integer',
        'wind_speed'    => 'permit_empty|decimal',
        'wind_deg'      => 'permit_empty|integer',
        'wind_gust'     => 'permit_empty|decimal',
        'weather_id'    => 'permit_empty|integer',
    ];

    protected $validationMessages = [
        'source' => [
            'in_list' => 'The source must be one of: OpenWeatherMap, WeatherAPI, VisualCrossing, OpenMeteo, CustomStation, OtherSource.',
        ],
    ];

    protected $skipValidation = false;

    /**
     * Returns hourly forecast rows for the next $hours hours starting at the
     * current UTC hour. Sources are averaged per hour in PHP.
     *
     * @param int                    $hours Number of hours to return.
     * @param DateTimeImmutable|null $now   Reference time (defaults to now, UTC).
     * @return array<int, array<string, mixed>> Hourly rows (camelCase keys).
     */
    public function getHourlyAverages(int $hours = 48, ?DateTimeImmutable $now = null): array
    {
        $utc   = new DateTimeZone('UTC');
        $now   = ($now ?? new DateTimeImmutable('now', $utc))->setTimezone($utc);
        $start = $now->setTime((int) $now->format('G'), 0, 0);
        $end = $start->modify('+' . $hours . ' hours');

        return ForecastAggregator::hourly($this->_getSourceRows($start, $end));
    }

    /**
     * Returns daily forecast rows grouped by local (station time zone) calendar
     * day, starting from the current local day.
     *
     * @param int                    $days Maximum number of days to return.
     * @param DateTimeImmutable|null $now  Reference time (defaults to now).
     * @return array<int, array<string, mixed>> Daily rows (camelCase keys).
     */
    public function getDailyAverages(int $days = 8, ?DateTimeImmutable $now = null): array
    {
        $timezone = new DateTimeZone(config(App::class)->stationTimezone);
        $localNow = ($now ?? new DateTimeImmutable('now', $timezone))->setTimezone($timezone);
        $start    = $localNow->setTime(0, 0, 0)->setTimezone(new DateTimeZone('UTC'));
        $end = $localNow->setTime(0, 0, 0)->modify('+' . $days . ' days')->setTimezone(new DateTimeZone('UTC'));

        return ForecastAggregator::daily(
            ForecastAggregator::hourly($this->_getSourceRows($start, $end)),
            $timezone,
            $days
        );
    }

    /**
     * Fetches the raw per-source rows of a UTC time window with a single query.
     *
     * @param DateTimeImmutable $from Inclusive start (UTC).
     * @param DateTimeImmutable $to   Exclusive end (UTC).
     * @return array<int, array<string, mixed>>
     */
    private function _getSourceRows(DateTimeImmutable $from, DateTimeImmutable $to): array
    {
        return $this->builder()
            ->select('forecast_time, source, temperature, feels_like, pressure, humidity, dew_point, uv_index, '
                . 'sol_energy, sol_radiation, precipitation, clouds, visibility, wind_speed, wind_deg, wind_gust, weather_id')
            ->where('forecast_time >=', $from->format('Y-m-d H:i:s'))
            ->where('forecast_time <', $to->format('Y-m-d H:i:s'))
            ->orderBy('forecast_time', 'ASC')
            ->get()
            ->getResultArray();
    }
}
