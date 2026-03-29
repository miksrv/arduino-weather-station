<?php

use App\Entities\WeatherForecastEntity;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Tests for App\Entities\WeatherForecastEntity
 *
 * @internal
 */
final class WeatherForecastEntityTest extends CIUnitTestCase
{
    /**
     * The entity can be instantiated with no arguments.
     */
    public function testInstantiation(): void
    {
        $entity = new WeatherForecastEntity();
        $this->assertInstanceOf(WeatherForecastEntity::class, $entity);
    }

    /**
     * fill() sets forecast-specific and shared weather attributes.
     */
    public function testFillSetsAttributes(): void
    {
        $entity = new WeatherForecastEntity();
        $entity->fill([
            'source'      => 'WeatherAPI',
            'temperature' => 19.3,
            'pressure'    => 1008,
            'clouds'      => 60,
        ]);

        $this->assertSame('WeatherAPI', $entity->source);
        $this->assertSame(19.3,         $entity->temperature);
        $this->assertSame(1008,         $entity->pressure);
        $this->assertSame(60,           $entity->clouds);
    }

    /**
     * The $dates property declares 'forecast_time' for datetime handling.
     */
    public function testDatesPropertyContainsForecastTime(): void
    {
        $entity = new WeatherForecastEntity();
        $dates  = $this->getPrivateProperty($entity, 'dates');

        $this->assertContains('forecast_time', $dates);
    }

    /**
     * Casts contain forecast_time as datetime.
     */
    public function testCastsIncludeForecastTime(): void
    {
        $entity = new WeatherForecastEntity();
        $casts  = $this->getPrivateProperty($entity, 'casts');

        $this->assertArrayHasKey('forecast_time', $casts);
        $this->assertSame('datetime', $casts['forecast_time']);
    }

    /**
     * All expected attributes keys are present.
     */
    public function testAttributesKeysAreComplete(): void
    {
        $entity      = new WeatherForecastEntity();
        $attributes  = $this->getPrivateProperty($entity, 'attributes');

        $expectedKeys = [
            'id', 'source', 'forecast_time', 'temperature', 'feels_like',
            'pressure', 'humidity', 'dew_point', 'uv_index', 'sol_energy',
            'sol_radiation', 'clouds', 'precipitation', 'visibility',
            'wind_speed', 'wind_deg', 'wind_gust', 'weather_id',
        ];

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $attributes, "Expected attribute key '{$key}' not found");
        }
    }
}
