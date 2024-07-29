<?php namespace App\Entities;

use Exception;

class WeatherData
{
    public ?float $temperature;
    public ?float $feelsLike;
    public ?int $pressure;
    public ?int $humidity;
    public ?float $dewPoint;
    public ?int $visibility;
    public ?float $uvIndex;
    public ?float $solEnergy;
    public ?float $solRadiation;
    public ?int $clouds;
    public ?float $precipitation;
    public ?float $windSpeed;
    public ?float $windGust;
    public ?int $windDeg;
    public ?int $weatherID;
    public ?string $weatherMain;
    public ?string $weatherIcon;
    public ?object $date;

    /**
     * @throws Exception
     */
    public function __construct(array $data)
    {
        $this->temperature   = $data['temperature'] ?? null;
        $this->feelsLike     = $data['feels_like'] ?? null;
        $this->pressure      = $data['pressure'] ?? null;
        $this->humidity      = $data['humidity'] ?? null;
        $this->dewPoint      = $data['dew_point'] ?? null;
        $this->visibility    = $data['visibility'] ?? null;
        $this->uvIndex       = $data['uv_index'] ?? null;
        $this->solEnergy     = $data['sol_energy'] ?? null;
        $this->solRadiation  = $data['sol_radiation'] ?? null;
        $this->clouds        = $data['clouds'] ?? null;
        $this->precipitation = $data['precipitation'] ?? null;
        $this->windSpeed     = $data['wind_speed'] ?? null;
        $this->windGust      = $data['wind_gust'] ?? null;
        $this->windDeg       = $data['wind_deg'] ?? null;
        $this->weatherID     = $data['weather_id'] ?? null;
        $this->weatherMain   = $data['weather_main'] ?? null;
        $this->weatherIcon   = $data['weather_icon'] ?? null;
    }
}
