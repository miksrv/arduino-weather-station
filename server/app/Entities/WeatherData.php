<?php namespace App\Entities;

use CodeIgniter\I18n\Time;
use Exception;

class WeatherData
{
    public ?float $temperature;
    public ?float $feels_like;
    public ?int $pressure;
    public ?int $humidity;
    public ?int $visibility;
    public ?float $wind_speed;
    public ?int $wind_deg;
    public ?int $clouds;
    public ?int $weather_id;
    public ?string $weather_main;
    public ?string $weather_icon;
    public ?object $date;
    public ?object $sunrise;
    public ?object $sunset;

    /**
     * @throws Exception
     */
    public function __construct(array $data)
    {
        $this->temperature  = $data['temperature'] ?? null;
        $this->feels_like   = $data['feels_like'] ?? null;
        $this->pressure     = $data['pressure'] ?? null;
        $this->humidity     = $data['humidity'] ?? null;
        $this->visibility   = $data['visibility'] ?? null;
        $this->wind_speed   = $data['wind_speed'] ?? null;
        $this->wind_deg     = $data['wind_deg'] ?? null;
        $this->clouds       = $data['clouds'] ?? null;
        $this->weather_id   = $data['weather_id'] ?? null;
        $this->weather_main = $data['weather_main'] ?? null;
        $this->weather_icon = $data['weather_icon'] ?? null;
        $this->sunrise      = !empty($data['sunrise']) ? Time::createFromTimestamp($data['sunrise']) : null;
        $this->sunset       = !empty($data['sunset']) ? Time::createFromTimestamp($data['sunset']) : null;
        $this->date         = !empty($data['date']) ? Time::createFromTimestamp($data['date']) : null;
    }
}
