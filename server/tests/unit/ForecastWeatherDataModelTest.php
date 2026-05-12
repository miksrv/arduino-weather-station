<?php

use App\Entities\WeatherForecastEntity;
use App\Models\ForecastWeatherDataModel;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Models\ForecastWeatherDataModel (no DB required).
 *
 * @internal
 */
final class ForecastWeatherDataModelTest extends CIUnitTestCase
{
    private ForecastWeatherDataModel $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->model = new ForecastWeatherDataModel();
    }

    public function testTableName(): void
    {
        $this->assertSame('forecast_weather_data', $this->getPrivateProperty($this->model, 'table'));
    }

    public function testReturnTypeIsWeatherForecastEntity(): void
    {
        $this->assertSame(
            WeatherForecastEntity::class,
            $this->getPrivateProperty($this->model, 'returnType')
        );
    }

    public function testUseTimestampsIsFalse(): void
    {
        $this->assertFalse($this->getPrivateProperty($this->model, 'useTimestamps'));
    }

    public function testAllowedFieldsContainsForecastTimeAndWeatherFields(): void
    {
        $allowed = $this->getPrivateProperty($this->model, 'allowedFields');

        foreach (['forecast_time', 'source', 'temperature', 'pressure',
                  'humidity', 'wind_speed', 'weather_id'] as $field) {
            $this->assertContains($field, $allowed, "Expected '{$field}' in allowedFields");
        }
    }

    public function testValidationRulesHaveForecastTimeRequired(): void
    {
        $rules = $this->getPrivateProperty($this->model, 'validationRules');
        $this->assertArrayHasKey('forecast_time', $rules);
        $this->assertStringContainsString('required', $rules['forecast_time']);
    }

    public function testValidationRulesHaveSourceInList(): void
    {
        $rules = $this->getPrivateProperty($this->model, 'validationRules');
        $this->assertArrayHasKey('source', $rules);
        $this->assertStringContainsString('in_list', $rules['source']);
    }

    /**
     * The entity used by the model handles forecast_time via $dates (Time mutation),
     * not via a redundant $casts entry. This test verifies the entity $dates property
     * rather than a model-level cast (models have no $casts in this project).
     */
    public function testForecastTimeManagedByEntityDates(): void
    {
        $entity = new WeatherForecastEntity();
        $dates  = $this->getPrivateProperty($entity, 'dates');

        $this->assertContains('forecast_time', $dates,
            'forecast_time must be in $dates so CI4 auto-mutates it to a Time instance');

        // forecast_time must not also appear in $casts to avoid double-processing
        $casts = $this->getPrivateProperty($entity, 'casts');
        $this->assertArrayNotHasKey('forecast_time', $casts,
            'forecast_time must not appear in $casts when already listed in $dates');
    }
}
