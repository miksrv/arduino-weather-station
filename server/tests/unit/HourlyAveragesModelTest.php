<?php

use App\Entities\WeatherDataEntity;
use App\Libraries\ForecastAggregator;
use App\Models\HourlyAveragesModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Models\HourlyAveragesModel (no DB required).
 *
 * @internal
 */
final class HourlyAveragesModelTest extends CIUnitTestCase
{
    private HourlyAveragesModel $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->model = new HourlyAveragesModel();
    }

    public function testTableName(): void
    {
        $this->assertSame('hourly_averages', $this->getPrivateProperty($this->model, 'table'));
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

    // -------------------------------------------------------------------------
    // Daily roll-up expressions
    // -------------------------------------------------------------------------

    public function testDailyPrecipitationIsTheSumOfHours(): void
    {
        $expressions = $this->_dailyExpressions();

        $this->assertSame('ROUND(SUM(precipitation), 2)', $expressions['precipitation']);
        $this->assertSame('ROUND(AVG(temperature), 2)', $expressions['temperature']);
    }

    public function testDailyWindDirectionIsVectorMean(): void
    {
        $this->assertSame(RawWeatherDataModel::windDirectionSQL(), $this->_dailyExpressions()['wind_deg']);
    }

    public function testDailyWeatherIdFollowsForecastDayRules(): void
    {
        $sql = $this->_dailyExpressions()['weather_id'];

        $this->assertStringContainsString('>= ' . ForecastAggregator::WET_DAY_HOURS, $sql);
        $this->assertStringContainsString('>= ' . ForecastAggregator::WET_DAY_TOTAL_MM, $sql);
        $this->assertStringContainsString('>= ' . ForecastAggregator::FOG_DAY_HOURS, $sql);
        $this->assertStringContainsString(RawWeatherDataModel::mostSevereWeatherIdSQL(), $sql);
    }

    public function testDailyExpressionsCoverEveryStoredField(): void
    {
        $fields = array_diff($this->model->allowedFields, ['date']);

        $this->assertEqualsCanonicalizing(array_values($fields), array_keys($this->_dailyExpressions()));
    }

    /**
     * @return array<string, string>
     */
    private function _dailyExpressions(): array
    {
        $method = new \ReflectionMethod(HourlyAveragesModel::class, '_dailyExpressions');

        return $method->invoke(null);
    }
}
