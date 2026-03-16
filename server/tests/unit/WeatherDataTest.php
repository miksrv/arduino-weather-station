<?php

use App\Entities\WeatherData;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\I18n\Time;

/**
 * Tests for App\Entities\WeatherData
 *
 * @internal
 */
final class WeatherDataTest extends CIUnitTestCase
{
    /**
     * Constructing with a full snake_case array populates all camelCase properties.
     */
    public function testConstructPopulatesPropertiesFromSnakeCaseKeys(): void
    {
        $data = [
            'temperature'   => 21.5,
            'feels_like'    => 20.0,
            'pressure'      => 1013,
            'humidity'      => 65,
            'dew_point'     => 14.2,
            'visibility'    => 10000,
            'uv_index'      => 3.1,
            'sol_energy'    => 1.8,
            'sol_radiation' => 250.0,
            'clouds'        => 40,
            'precipitation' => 0.0,
            'wind_speed'    => 5.5,
            'wind_gust'     => 8.2,
            'wind_deg'      => 270,
            'weather_id'    => 800,
            'date'          => '2024-06-15 12:00:00',
        ];

        $entity = new WeatherData($data);

        $this->assertSame(21.5,                  $entity->temperature);
        $this->assertSame(20.0,                  $entity->feelsLike);
        $this->assertSame(1013,                  $entity->pressure);
        $this->assertSame(65,                    $entity->humidity);
        $this->assertSame(14.2,                  $entity->dewPoint);
        $this->assertSame(10000,                 $entity->visibility);
        $this->assertSame(3.1,                   $entity->uvIndex);
        $this->assertSame(1.8,                   $entity->solEnergy);
        $this->assertSame(250.0,                 $entity->solRadiation);
        $this->assertSame(40,                    $entity->clouds);
        $this->assertSame(0.0,                   $entity->precipitation);
        $this->assertSame(5.5,                   $entity->windSpeed);
        $this->assertSame(8.2,                   $entity->windGust);
        $this->assertSame(270,                   $entity->windDeg);
        $this->assertSame(800,                   $entity->weatherId);
        $this->assertSame('2024-06-15 12:00:00', $entity->date);
    }

    /**
     * Null values in the source array leave properties uninitialized / not written.
     * WeatherData only assigns non-null values; the property declares ?Type so
     * accessing an unset property returns the PHP-default null.
     *
     * We verify the property IS declared on the class (not a dynamic property),
     * and that when it was not written it keeps its PHP default.
     */
    public function testNullValuesAreNotWrittenToProperties(): void
    {
        // Only provide non-null values so we can verify the null path is skipped
        $data = [
            'temperature' => 10.0,
            // pressure is intentionally omitted / not provided
        ];

        $entity = new WeatherData($data);

        $this->assertSame(10.0, $entity->temperature);
        // pressure was not provided — it must be declared but uninitialized
        $this->assertTrue(property_exists($entity, 'pressure'));
    }

    /**
     * Keys that are not declared properties on WeatherData are silently ignored.
     */
    public function testUnknownKeysAreIgnored(): void
    {
        $data = [
            'temperature'     => 15.0,
            'unknown_field'   => 'should_be_ignored',
            'another_unknown' => 999,
        ];

        $entity = new WeatherData($data);

        $this->assertSame(15.0, $entity->temperature);
        $this->assertFalse(property_exists($entity, 'unknownField'));
    }

    /**
     * When $data['date'] is a Time object (CodeIgniter I18n\Time), it is converted
     * to a string via ->toDateTimeString().
     */
    public function testDateIsConvertedFromTimeObjectToString(): void
    {
        $time = Time::createFromFormat('Y-m-d H:i:s', '2024-03-15 09:30:00');

        $data = [
            'temperature' => 10.0,
            'date'        => $time,
        ];

        $entity = new WeatherData($data);

        $this->assertIsString($entity->date);
        $this->assertSame('2024-03-15 09:30:00', $entity->date);
    }

    /**
     * When $data['date'] is already a plain string, the property is set directly without conversion.
     */
    public function testDateStaysStringWhenPassedAsString(): void
    {
        $data = [
            'temperature' => 1.0,
            'date'        => '2023-12-01 00:00:00',
        ];
        $entity = new WeatherData($data);

        $this->assertSame('2023-12-01 00:00:00', $entity->date);
    }

    /**
     * Constructing with only date leaves weather fields uninitialised.
     * We verify the entity can be constructed without exceptions.
     */
    public function testConstructWithOnlyDateDoesNotThrow(): void
    {
        $entity = new WeatherData(['date' => '2023-12-01 00:00:00']);
        $this->assertSame('2023-12-01 00:00:00', $entity->date);
    }

    /**
     * Null value for a non-null key: the constructor skips writing it to the property.
     * We test this indirectly by verifying that a subsequent property IS reachable
     * while the skipped one is left at PHP-default.
     */
    public function testPropertiesWithNullValueAreSkipped(): void
    {
        $entity = new WeatherData([
            'temperature' => null,
            'pressure'    => 1015,
        ]);

        // pressure was written (non-null)
        $this->assertSame(1015, $entity->pressure);

        // temperature was null → constructor skipped it → uninitialized typed prop
        // We can detect this via a try/catch
        $isUninitialized = false;
        try {
            $val = $entity->temperature; // triggers Error if uninitialized
        } catch (\Error $e) {
            $isUninitialized = true;
        }
        $this->assertTrue($isUninitialized, 'Null value should have left property uninitialized');
    }
}
