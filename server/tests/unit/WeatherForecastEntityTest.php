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
     * The $dates property declares 'forecast_time' for automatic Time-instance conversion.
     */
    public function testDatesPropertyContainsForecastTime(): void
    {
        $entity = new WeatherForecastEntity();
        $dates  = $this->getPrivateProperty($entity, 'dates');

        $this->assertContains('forecast_time', $dates);
    }

    /**
     * forecast_time is managed by $dates, not $casts.
     *
     * Fields listed in $dates trigger CI4's mutateDate() automatically on read.
     * Duplicating them in $casts with a 'datetime' cast is redundant and
     * can cause double-processing; the cast is intentionally absent.
     */
    public function testCastsDoNotIncludeForecastTime(): void
    {
        $entity = new WeatherForecastEntity();
        $casts  = $this->getPrivateProperty($entity, 'casts');

        $this->assertArrayNotHasKey('forecast_time', $casts);
    }

    /**
     * Casts use nullable variants for all numeric columns.
     *
     * Nullable casts ('?integer', '?float') preserve NULL values from the
     * database rather than coercing them to 0, which is correct for optional
     * sensor / API fields.
     */
    public function testCastsUseNullableVariantsForNumericColumns(): void
    {
        $entity = new WeatherForecastEntity();
        $casts  = $this->getPrivateProperty($entity, 'casts');

        $this->assertArrayHasKey('id',          $casts);
        $this->assertArrayHasKey('temperature', $casts);
        $this->assertArrayHasKey('pressure',    $casts);
        $this->assertArrayHasKey('clouds',      $casts);
        $this->assertArrayHasKey('wind_deg',    $casts);
        $this->assertArrayHasKey('weather_id',  $casts);

        $this->assertSame('?integer', $casts['id']);
        $this->assertSame('?float',   $casts['temperature']);
        $this->assertSame('?integer', $casts['pressure']);
        $this->assertSame('?integer', $casts['clouds']);
        $this->assertSame('?integer', $casts['wind_deg']);
        $this->assertSame('?integer', $casts['weather_id']);
    }

    /**
     * The $datamap maps camelCase forecastTime alias and all shared snake_case field aliases.
     */
    public function testDatamapContainsForecastTimeAndSharedAliases(): void
    {
        $entity  = new WeatherForecastEntity();
        $datamap = $this->getPrivateProperty($entity, 'datamap');

        $this->assertArrayHasKey('forecastTime',  $datamap);
        $this->assertSame('forecast_time', $datamap['forecastTime']);

        $this->assertArrayHasKey('feelsLike',    $datamap);
        $this->assertArrayHasKey('dewPoint',     $datamap);
        $this->assertArrayHasKey('uvIndex',      $datamap);
        $this->assertArrayHasKey('solEnergy',    $datamap);
        $this->assertArrayHasKey('solRadiation', $datamap);
        $this->assertArrayHasKey('windSpeed',    $datamap);
        $this->assertArrayHasKey('windDeg',      $datamap);
        $this->assertArrayHasKey('windGust',     $datamap);
        $this->assertArrayHasKey('weatherId',    $datamap);
    }

    /**
     * All expected attribute keys are present in $attributes.
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
