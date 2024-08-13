<?php

namespace App\Entities;

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
    public ?int $weatherId;
    public ?string $date;

    /**
     * @throws Exception
     */
    public function __construct(array $data)
    {
        // Initialize class properties based on data from an array
        foreach ($data as $key => $value) {
            $property = $this->camelCase($key); // Convert the array key to camelCase
            if (property_exists($this, $property)) {
                if ($value !== null) {
                    $this->$property = $value;
                }
            }
        }

        if (!empty($data['date']) && !is_string($data['date'])) {
            $this->date = $data['date']?->toDateTimeString();
        }
    }

    // Method to convert a string with underscores to camelCase
    private function camelCase(string $string): string
    {
        return lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $string))));
    }
}
