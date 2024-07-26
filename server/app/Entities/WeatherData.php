<?php namespace App\Entities;

use CodeIgniter\I18n\Time;
use Exception;

class WeatherData
{
    public ?float $temperature;
    public ?float $feels_like;
    public ?int $pressure;
    public ?int $humidity;
    public ?float $dew_point;
    public ?int $visibility;
    public ?int $uvi;
    public ?int $clouds;
    public ?float $precipitation;
    public ?float $wind_speed;
    public ?float $wind_gust;
    public ?int $wind_deg;
    public ?int $weather_id;
    public ?string $weather_main;
    public ?string $weather_icon;
    public ?object $date;

    /**
     * @throws Exception
     */
    public function __construct(array $data)
    {
        $this->temperature   = $data['temperature'] ?? null;
        $this->feels_like    = $data['feels_like'] ?? null;
        $this->pressure      = $data['pressure'] ?? null;
        $this->humidity      = $data['humidity'] ?? null;
        $this->dew_point     = $data['dew_point'] ?? null;
        $this->visibility    = $data['visibility'] ?? null;
        $this->uvi           = $data['uvi'] ?? null;
        $this->clouds        = $data['clouds'] ?? null;
        $this->precipitation = $data['precipitation'] ?? null;
        $this->wind_speed    = $data['wind_speed'] ?? null;
        $this->wind_gust     = $data['wind_gust'] ?? null;
        $this->wind_deg      = $data['wind_deg'] ?? null;
        $this->weather_id    = $data['weather_id'] ?? null;
        $this->weather_main  = $data['weather_main'] ?? null;
        $this->weather_icon  = $data['weather_icon'] ?? null;
        $this->date          = !empty($data['date']) ? Time::createFromTimestamp($data['date']) : null;
    }
}
