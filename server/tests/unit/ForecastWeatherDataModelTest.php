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

    public function testCastsContainsForecastTimeDatetime(): void
    {
        $casts = $this->getPrivateProperty($this->model, 'casts');
        $this->assertArrayHasKey('forecast_time', $casts);
        $this->assertSame('datetime', $casts['forecast_time']);
    }
}
