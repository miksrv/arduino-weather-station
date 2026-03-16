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
}
