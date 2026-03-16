<?php

use App\Entities\WeatherDataEntity;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Tests for App\Entities\WeatherDataEntity
 *
 * @internal
 */
final class WeatherDataEntityTest extends CIUnitTestCase
{
    /**
     * The entity can be instantiated with no arguments.
     */
    public function testInstantiation(): void
    {
        $entity = new WeatherDataEntity();
        $this->assertInstanceOf(WeatherDataEntity::class, $entity);
    }

    /**
     * fill() maps snake_case keys to the entity attributes correctly.
     */
    public function testFillSetsSnakeCaseAttributes(): void
    {
        $entity = new WeatherDataEntity();
        $entity->fill([
            'source'      => 'OpenWeatherMap',
            'temperature' => 22.5,
            'pressure'    => 1015,
            'humidity'    => 70,
        ]);

        $this->assertSame('OpenWeatherMap', $entity->source);
        $this->assertSame(22.5,            $entity->temperature);
        $this->assertSame(1015,            $entity->pressure);
        $this->assertSame(70,              $entity->humidity);
    }

    /**
     * The datamap property allows camelCase aliases to work via fill().
     */
    public function testCamelCaseDatamapAliases(): void
    {
        $entity = new WeatherDataEntity();
        $entity->fill([
            'feelsLike'    => 18.0,
            'dewPoint'     => 11.0,
            'uvIndex'      => 2.5,
            'solEnergy'    => 0.9,
            'solRadiation' => 120.0,
            'windSpeed'    => 3.6,
            'windDeg'      => 180,
            'windGust'     => 6.2,
            'weatherId'    => 801,
        ]);

        // Access via snake_case property names as defined in $attributes
        $this->assertSame(18.0,  $entity->feels_like);
        $this->assertSame(11.0,  $entity->dew_point);
        $this->assertSame(2.5,   $entity->uv_index);
        $this->assertSame(0.9,   $entity->sol_energy);
        $this->assertSame(120.0, $entity->sol_radiation);
        $this->assertSame(3.6,   $entity->wind_speed);
        $this->assertSame(180,   $entity->wind_deg);
        $this->assertSame(6.2,   $entity->wind_gust);
        $this->assertSame(801,   $entity->weather_id);
    }

    /**
     * Casts are configured for all expected fields.
     */
    public function testCastsConfigurationIsCorrect(): void
    {
        $entity = new WeatherDataEntity();
        $casts  = $this->getPrivateProperty($entity, 'casts');

        $this->assertArrayHasKey('id',            $casts);
        $this->assertArrayHasKey('source',        $casts);
        $this->assertArrayHasKey('date',          $casts);
        $this->assertArrayHasKey('temperature',   $casts);
        $this->assertArrayHasKey('feels_like',    $casts);
        $this->assertArrayHasKey('pressure',      $casts);
        $this->assertArrayHasKey('humidity',      $casts);
        $this->assertArrayHasKey('dew_point',     $casts);
        $this->assertArrayHasKey('wind_speed',    $casts);
        $this->assertArrayHasKey('wind_deg',      $casts);
        $this->assertArrayHasKey('wind_gust',     $casts);
        $this->assertArrayHasKey('weather_id',    $casts);

        $this->assertSame('integer',  $casts['id']);
        $this->assertSame('string',   $casts['source']);
        $this->assertSame('datetime', $casts['date']);
        $this->assertSame('float',    $casts['temperature']);
        $this->assertSame('integer',  $casts['pressure']);
    }

    /**
     * The $dates property declares 'date' for datetime handling.
     */
    public function testDatesPropertyContainsDate(): void
    {
        $entity = new WeatherDataEntity();
        $dates  = $this->getPrivateProperty($entity, 'dates');

        $this->assertContains('date', $dates);
    }

    /**
     * Setting the id property after fill() works correctly.
     */
    public function testIdCanBeSetAfterFill(): void
    {
        $entity     = new WeatherDataEntity();
        $entity->id = 42;

        $this->assertSame(42, $entity->id);
    }
}
