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

    // -------------------------------------------------------------------------
    // SEC-06: Physical range validation rules
    // -------------------------------------------------------------------------

    #[\PHPUnit\Framework\Attributes\DataProvider('rangeRulesProvider')]
    public function testValidationRulesContainRangeConstraints(string $field, string $min, string $max): void
    {
        $rules = $this->getPrivateProperty($this->model, 'validationRules');
        $this->assertArrayHasKey($field, $rules, "Field '{$field}' must have validation rules");
        $rule = $rules[$field];
        $this->assertStringContainsString("greater_than_equal_to[{$min}]", $rule, "'{$field}' must have min {$min}");
        $this->assertStringContainsString("less_than_equal_to[{$max}]", $rule, "'{$field}' must have max {$max}");
    }

    /** @return array<string, array{string, string, string}> */
    public static function rangeRulesProvider(): array
    {
        return [
            'temperature'   => ['temperature',   '-80',  '60'],
            'feels_like'    => ['feels_like',     '-80',  '60'],
            'pressure'      => ['pressure',       '800',  '1100'],
            'humidity'      => ['humidity',       '0',    '100'],
            'uv_index'      => ['uv_index',       '0',    '20'],
            'precipitation' => ['precipitation',  '0',    '500'],
            'clouds'        => ['clouds',         '0',    '100'],
            'visibility'    => ['visibility',     '0',    '100000'],
            'wind_speed'    => ['wind_speed',     '0',    '100'],
            'wind_deg'      => ['wind_deg',       '0',    '360'],
            'wind_gust'     => ['wind_gust',      '0',    '150'],
        ];
    }

    // -------------------------------------------------------------------------
    // SEC-08: Interval allowlist validation
    // -------------------------------------------------------------------------

    public function testGetWeatherHistoryGroupedThrowsForInvalidInterval(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->model->getWeatherHistoryGrouped('2023-01-01', '2023-01-31', 'invalid');
    }

    public function testGetWeatherHistoryGroupedThrowsForArbitraryString(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->model->getWeatherHistoryGrouped('2023-01-01', '2023-01-31', '1 WEEK');
    }

    // -------------------------------------------------------------------------
    // getRowsSince() — used by the Events feed
    // -------------------------------------------------------------------------

    /**
     * getRowsSince() must delegate to the CI4 fluent query builder and return
     * whatever findAll() produces, without altering it. Only __call (where/
     * orderBy) and findAll are mocked via onlyMethods() so that getRowsSince()
     * itself keeps its real implementation.
     */
    public function testGetRowsSinceReturnsFindAllResult(): void
    {
        $expected = [
            ['id' => 1, 'date' => '2026-07-13 15:00:00', 'temperature' => 20.0],
        ];

        $stub = $this->getMockBuilder(RawWeatherDataModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['__call', 'findAll'])
            ->getMock();

        $stub->method('__call')->willReturnCallback(static fn() => $stub);
        $stub->expects($this->once())->method('findAll')->willReturn($expected);

        $result = $stub->getRowsSince(new \DateTime('2026-07-13 00:00:00'));

        $this->assertSame($expected, $result);
    }

    /**
     * getRowsSince() must return an empty array when findAll() returns none.
     */
    public function testGetRowsSinceReturnsEmptyArrayWhenNoRows(): void
    {
        $stub = $this->getMockBuilder(RawWeatherDataModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['__call', 'findAll'])
            ->getMock();

        $stub->method('__call')->willReturnCallback(static fn() => $stub);
        $stub->method('findAll')->willReturn([]);

        $result = $stub->getRowsSince(new \DateTime('2026-07-13 00:00:00'));

        $this->assertSame([], $result);
    }

    // -------------------------------------------------------------------------
    // getRecentAverages() — null-safety around getRowArray()
    //
    // getRowArray() returns null (not []) when the query matches no rows. Prior
    // to the fix, getCurrentActualWeatherData() fed this null straight into
    // array_merge(), which throws a TypeError (not an Exception) whenever the
    // Arduino sensor has not reported for ~30 minutes. getRecentAverages() must
    // now coalesce that null to an empty array itself.
    // -------------------------------------------------------------------------

    /**
     * When the underlying query returns no rows, getRowArray() yields null;
     * getRecentAverages() must coalesce this to an empty array rather than
     * propagating null to its caller.
     */
    public function testGetRecentAveragesReturnsEmptyArrayWhenNoRows(): void
    {
        $resultStub = new class {
            public function getRowArray(): ?array
            {
                return null;
            }
        };

        $stub = $this->getMockBuilder(RawWeatherDataModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['__call'])
            ->getMock();

        $stub->method('__call')->willReturnCallback(
            static fn(string $name) => $name === 'get' ? $resultStub : $stub
        );

        $result = $stub->getRecentAverages(new \DateTime('2026-07-13 00:00:00'), new \DateTime('2026-07-13 01:00:00'));

        $this->assertSame([], $result);
    }

    /**
     * When rows are found, getRecentAverages() must pass the row array through unchanged.
     */
    public function testGetRecentAveragesReturnsRowArrayWhenPresent(): void
    {
        $expected   = ['temperature' => 21.5, 'humidity' => 60];
        $resultStub = new class($expected) {
            public function __construct(private readonly array $row)
            {
            }

            public function getRowArray(): ?array
            {
                return $this->row;
            }
        };

        $stub = $this->getMockBuilder(RawWeatherDataModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['__call'])
            ->getMock();

        $stub->method('__call')->willReturnCallback(
            static fn(string $name) => $name === 'get' ? $resultStub : $stub
        );

        $result = $stub->getRecentAverages(new \DateTime('2026-07-13 00:00:00'), new \DateTime('2026-07-13 01:00:00'));

        $this->assertSame($expected, $result);
    }

    // -------------------------------------------------------------------------
    // getCurrentActualWeatherData() — must not throw when there is no recent data
    // -------------------------------------------------------------------------

    /**
     * With a completely empty table (no recent averages, no latest data, no
     * last update time at all), getCurrentActualWeatherData() must return a
     * plain ['date' => null] array instead of throwing a TypeError from
     * array_merge() receiving null arguments.
     */
    public function testGetCurrentActualWeatherDataDoesNotThrowWhenNoData(): void
    {
        $stub = $this->getMockBuilder(RawWeatherDataModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getRecentAverages', 'getLatestWeatherData', 'getLastUpdateTime'])
            ->getMock();

        $stub->method('getRecentAverages')->willReturn([]);
        $stub->method('getLatestWeatherData')->willReturn([]);
        $stub->method('getLastUpdateTime')->willReturn(null);

        $result = $stub->getCurrentActualWeatherData();

        $this->assertSame(['date' => null], $result);
    }

    /**
     * With data present, getCurrentActualWeatherData() merges the last update
     * date, recent averages, and latest infrequent-field data into one array.
     */
    public function testGetCurrentActualWeatherDataMergesAllSources(): void
    {
        $stub = $this->getMockBuilder(RawWeatherDataModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getRecentAverages', 'getLatestWeatherData', 'getLastUpdateTime'])
            ->getMock();

        $stub->method('getRecentAverages')->willReturn(['temperature' => 20.5]);
        $stub->method('getLatestWeatherData')->willReturn(['precipitation' => 0.0]);
        $stub->method('getLastUpdateTime')->willReturn('2026-07-20 10:00:00');

        $result = $stub->getCurrentActualWeatherData();

        $this->assertSame([
            'date'          => '2026-07-20 10:00:00',
            'temperature'   => 20.5,
            'precipitation' => 0.0,
        ], $result);
    }
}
