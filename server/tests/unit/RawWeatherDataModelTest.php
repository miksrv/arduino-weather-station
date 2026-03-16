<?php

use App\Entities\WeatherDataEntity;
use App\Models\RawWeatherDataModel;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Models\RawWeatherDataModel (no DB required).
 *
 * @internal
 */
final class RawWeatherDataModelTest extends CIUnitTestCase
{
    private RawWeatherDataModel $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->model = new RawWeatherDataModel();
    }

    // -------------------------------------------------------------------------
    // Model configuration
    // -------------------------------------------------------------------------

    public function testTableName(): void
    {
        $this->assertSame('raw_weather_data', $this->getPrivateProperty($this->model, 'table'));
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

    public function testAllowedFieldsContainsExpectedFields(): void
    {
        $allowed = $this->getPrivateProperty($this->model, 'allowedFields');

        foreach (['date', 'source', 'temperature', 'pressure', 'humidity',
                  'wind_speed', 'wind_deg', 'wind_gust', 'precipitation',
                  'clouds', 'visibility', 'weather_id'] as $field) {
            $this->assertContains($field, $allowed, "Expected '{$field}' in allowedFields");
        }
    }

    // -------------------------------------------------------------------------
    // Source constants
    // -------------------------------------------------------------------------

    public function testSourceConstants(): void
    {
        $this->assertSame('OpenWeatherMap', RawWeatherDataModel::SOURCE_OPENWEATHERMAP);
        $this->assertSame('WeatherAPI',     RawWeatherDataModel::SOURCE_WEATHERAPI);
        $this->assertSame('VisualCrossing', RawWeatherDataModel::SOURCE_VISUALCROSSING);
        $this->assertSame('CustomStation',  RawWeatherDataModel::SOURCE_CUSTOMSTATION);
        $this->assertSame('OtherSource',    RawWeatherDataModel::SOURCE_OTHERSOURCE);
    }

    // -------------------------------------------------------------------------
    // getSelectAverageSQL (static, no DB needed)
    // -------------------------------------------------------------------------

    public function testGetSelectAverageSQLWithoutTypeReturnsAllFields(): void
    {
        $sql = RawWeatherDataModel::getSelectAverageSQL();

        $this->assertStringContainsString('temperature', $sql);
        $this->assertStringContainsString('pressure',    $sql);
        $this->assertStringContainsString('humidity',    $sql);
        $this->assertStringContainsString('wind_speed',  $sql);
        $this->assertStringContainsString('AVG(',        $sql);
        // Trailing comma expected per implementation
        $this->assertStringEndsWith(',', trim($sql));
    }

    public function testGetSelectAverageSQLWithTypeReturnsOnlyThatField(): void
    {
        $sql = RawWeatherDataModel::getSelectAverageSQL('temperature');

        $this->assertStringContainsString('temperature', $sql);
        $this->assertStringNotContainsString('humidity', $sql);
        $this->assertStringNotContainsString('pressure', $sql);
    }

    public function testGetSelectAverageSQLWithUnknownTypeReturnsAllFields(): void
    {
        $sql = RawWeatherDataModel::getSelectAverageSQL('nonexistent_type');

        // Falls back to all fields when type key does not exist
        $this->assertStringContainsString('temperature', $sql);
        $this->assertStringContainsString('humidity',    $sql);
    }

    public function testGetSelectAverageSQLWithNullTypeReturnsAllFields(): void
    {
        $sql = RawWeatherDataModel::getSelectAverageSQL(null);

        $this->assertStringContainsString('temperature', $sql);
        $this->assertStringContainsString('humidity',    $sql);
    }

    // -------------------------------------------------------------------------
    // Validation rules
    // -------------------------------------------------------------------------

    public function testValidationRulesContainSourceInList(): void
    {
        $rules = $this->getPrivateProperty($this->model, 'validationRules');

        $this->assertArrayHasKey('source', $rules);
        $this->assertStringContainsString('in_list', $rules['source']);
        $this->assertStringContainsString('OpenWeatherMap', $rules['source']);
    }

    public function testValidationRulesDateIsRequired(): void
    {
        $rules = $this->getPrivateProperty($this->model, 'validationRules');
        $this->assertArrayHasKey('date', $rules);
        $this->assertStringContainsString('required', $rules['date']);
    }
}
