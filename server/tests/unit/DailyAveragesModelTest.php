<?php

use App\Entities\WeatherDataEntity;
use App\Models\DailyAveragesModel;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Models\DailyAveragesModel (no DB required).
 *
 * @internal
 */
final class DailyAveragesModelTest extends CIUnitTestCase
{
    private DailyAveragesModel $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->model = new DailyAveragesModel();
    }

    public function testTableName(): void
    {
        $this->assertSame('daily_averages', $this->getPrivateProperty($this->model, 'table'));
    }

    public function testReturnTypeIsWeatherDataEntity(): void
    {
        $this->assertSame(
            WeatherDataEntity::class,
            $this->getPrivateProperty($this->model, 'returnType')
        );
    }

    public function testUseTimestampsIsFalse(): void
    {
        $this->assertFalse($this->getPrivateProperty($this->model, 'useTimestamps'));
    }

    public function testAllowedFieldsContainsDateAndWeatherFields(): void
    {
        $allowed = $this->getPrivateProperty($this->model, 'allowedFields');

        foreach (['date', 'temperature', 'pressure', 'humidity', 'wind_speed', 'weather_id'] as $field) {
            $this->assertContains($field, $allowed);
        }
    }

    public function testValidationRulesContainDateRequired(): void
    {
        $rules = $this->getPrivateProperty($this->model, 'validationRules');
        $this->assertArrayHasKey('date', $rules);
        $this->assertStringContainsString('required', $rules['date']);
    }

    // -------------------------------------------------------------------------
    // SEC-08: Interval allowlist validation
    // -------------------------------------------------------------------------

    public function testGetWeatherHistoryGroupedThrowsForInvalidInterval(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->model->getWeatherHistoryGrouped('2023-01-01', '2023-01-31', 'invalid');
    }

    public function testGetWeatherHistoryGroupedAcceptsAllowedIntervals(): void
    {
        // Allowed intervals must not throw — they will fail at DB level in unit tests
        // but the InvalidArgumentException must NOT be thrown.
        foreach (['10 MINUTE', '1 HOUR', '1 DAY'] as $interval) {
            $threw = false;

            try {
                $this->model->getWeatherHistoryGrouped('2023-01-01', '2023-01-31', $interval);
            } catch (\InvalidArgumentException $e) {
                $threw = true;
            } catch (\Throwable $e) {
                // Any other exception (e.g. DB not available) is acceptable
            }

            $this->assertFalse($threw, "Interval '{$interval}' must not throw InvalidArgumentException");
        }
    }
}
