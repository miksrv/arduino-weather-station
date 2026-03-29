<?php

use App\Commands\BackfillAnomalyLog;
use App\Commands\DetectAnomalies;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for the private helper methods shared by DetectAnomalies and
 * BackfillAnomalyLog:
 *
 *   - _extractPeakValue(array $state): ?float
 *   - _buildDescription(string $type, array $state): string
 *
 * Both commands are identical in their helper implementations, so we run
 * the same assertions against both classes via the data-provider approach.
 *
 * Private methods are accessed via ReflectionMethod.
 *
 * @internal
 */
final class AnomalyCommandHelpersTest extends CIUnitTestCase
{
    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Calls a private method via reflection on the given object.
     *
     * @param object $obj
     * @param string $method
     * @param array  $args
     * @return mixed
     */
    private function _callPrivate(object $obj, string $method, array $args): mixed
    {
        $ref = new \ReflectionMethod($obj, $method);
        $ref->setAccessible(true);

        return $ref->invokeArgs($obj, $args);
    }

    /**
     * Returns instances of both command classes for use in data providers.
     * Each command extends BaseCommand, which has no constructor side-effects
     * when no services are bootstrapped.
     *
     * @return array<string, object>
     */
    private function _commandInstances(): array
    {
        $detect   = $this->getMockBuilder(DetectAnomalies::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['run'])
            ->getMock();

        $backfill = $this->getMockBuilder(BackfillAnomalyLog::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['run'])
            ->getMock();

        return ['DetectAnomalies' => $detect, 'BackfillAnomalyLog' => $backfill];
    }

    // -------------------------------------------------------------------------
    // _extractPeakValue
    // -------------------------------------------------------------------------

    /**
     * When zScore is set and non-null, _extractPeakValue() must return that
     * value rounded to 4 decimal places, ignoring extraMetric.
     */
    public function testExtractPeakValuePrefersZScore(): void
    {
        $state = [
            'zScore'      => 2.123456789,
            'extraMetric' => ['label' => 'SPI-30', 'value' => -1.5],
        ];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_extractPeakValue', [$state]);
            $this->assertSame(2.1235, $result, "{$name}: zScore not preferred or not rounded");
        }
    }

    /**
     * When zScore is null, _extractPeakValue() must fall back to extraMetric['value'].
     */
    public function testExtractPeakValueFallsBackToExtraMetric(): void
    {
        $state = [
            'zScore'      => null,
            'extraMetric' => ['label' => 'SPI-30', 'value' => -1.87654321],
        ];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_extractPeakValue', [$state]);
            $this->assertSame(-1.8765, $result, "{$name}: extraMetric fallback failed");
        }
    }

    /**
     * When both zScore and extraMetric are null (threshold-only type),
     * _extractPeakValue() must return null.
     */
    public function testExtractPeakValueReturnsNullWhenBothMissing(): void
    {
        $state = [
            'zScore'      => null,
            'extraMetric' => null,
        ];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_extractPeakValue', [$state]);
            $this->assertNull($result, "{$name}: expected null when both sources are null");
        }
    }

    /**
     * When extraMetric is present but its 'value' key is null,
     * _extractPeakValue() must return null.
     */
    public function testExtractPeakValueReturnsNullWhenExtraMetricValueIsNull(): void
    {
        $state = [
            'zScore'      => null,
            'extraMetric' => ['label' => 'precip7d', 'value' => null],
        ];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_extractPeakValue', [$state]);
            $this->assertNull($result, "{$name}: expected null when extraMetric.value is null");
        }
    }

    /**
     * A negative zScore must be preserved (not zeroed by abs).
     * Input zScore = -3.5678 → result = -3.5678 (already 4dp, no change).
     */
    public function testExtractPeakValuePreservesNegativeZScore(): void
    {
        $state = [
            'zScore'      => -3.5678,
            'extraMetric' => null,
        ];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_extractPeakValue', [$state]);
            $this->assertSame(-3.5678, $result, "{$name}: negative zScore sign must be preserved");
        }
    }

    // -------------------------------------------------------------------------
    // _buildDescription — known types
    // -------------------------------------------------------------------------

    /**
     * For heat_wave with a zScore, description must embed the Z-score.
     */
    public function testBuildDescriptionHeatWaveWithZScore(): void
    {
        $state = ['zScore' => 2.1234, 'extraMetric' => null];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_buildDescription', ['heat_wave', $state]);
            $this->assertStringContainsString('Heat wave', $result, $name);
            $this->assertStringContainsString('temp Z-score', $result, $name);
            $this->assertStringContainsString('+2.12', $result, $name);
        }
    }

    /**
     * For cold_snap with a negative zScore, description must embed a minus sign.
     */
    public function testBuildDescriptionColdSnapNegativeZScore(): void
    {
        $state = ['zScore' => -2.5, 'extraMetric' => null];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_buildDescription', ['cold_snap', $state]);
            $this->assertStringContainsString('Cold snap', $result, $name);
            $this->assertStringContainsString('-2.50', $result, $name);
        }
    }

    /**
     * For threshold-only types (pressure_collapse, freezing_rain, fog_risk,
     * heat_stress) the description must be a fixed string with no Z-score.
     */
    public function testBuildDescriptionThresholdOnlyTypes(): void
    {
        $state = ['zScore' => null, 'extraMetric' => null];

        $expected = [
            'pressure_collapse' => 'Rapid pressure collapse',
            'freezing_rain'     => 'Freezing rain',
            'fog_risk'          => 'Fog risk',
            'heat_stress'       => 'Heat stress',
        ];

        foreach ($this->_commandInstances() as $name => $cmd) {
            foreach ($expected as $type => $prefix) {
                $result = $this->_callPrivate($cmd, '_buildDescription', [$type, $state]);
                $this->assertStringContainsString($prefix, $result, "{$name}/{$type}");
                $this->assertStringNotContainsString('Z-score', $result, "{$name}/{$type}: threshold-only must not mention Z-score");
            }
        }
    }

    /**
     * For drought_spi30 the description must embed the SPI value from extraMetric.
     */
    public function testBuildDescriptionDroughtSpi(): void
    {
        $state = ['zScore' => null, 'extraMetric' => ['label' => 'SPI-30', 'value' => -1.87]];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_buildDescription', ['drought_spi30', $state]);
            $this->assertStringContainsString('Drought', $result, $name);
            $this->assertStringContainsString('SPI-30', $result, $name);
            $this->assertStringContainsString('-1.87', $result, $name);
        }
    }

    /**
     * For fire_risk the description must embed the 7-day precip value.
     */
    public function testBuildDescriptionFireRisk(): void
    {
        $state = ['zScore' => null, 'extraMetric' => ['label' => 'precip7d', 'value' => 1.5]];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_buildDescription', ['fire_risk', $state]);
            $this->assertStringContainsString('Fire risk', $result, $name);
            $this->assertStringContainsString('7-day precip', $result, $name);
            $this->assertStringContainsString('1.5', $result, $name);
        }
    }

    /**
     * An unknown anomaly type must produce a title-cased fallback from the key name.
     * e.g. 'unknown_type' → 'Unknown Type'
     */
    public function testBuildDescriptionUnknownTypeFallback(): void
    {
        $state = ['zScore' => null, 'extraMetric' => null];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_buildDescription', ['unknown_type', $state]);
            $this->assertSame('Unknown Type', $result, $name);
        }
    }

    /**
     * For extreme_uv with a UV Z-score, description must embed that score.
     */
    public function testBuildDescriptionExtremeUvWithZScore(): void
    {
        $state = ['zScore' => 3.1, 'extraMetric' => null];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_buildDescription', ['extreme_uv', $state]);
            $this->assertStringContainsString('Extreme UV', $result, $name);
            $this->assertStringContainsString('UV Z-score', $result, $name);
        }
    }

    /**
     * For strong_wind with a wind Z-score, description must contain the score.
     */
    public function testBuildDescriptionStrongWindWithZScore(): void
    {
        $state = ['zScore' => 2.8, 'extraMetric' => null];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_buildDescription', ['strong_wind', $state]);
            $this->assertStringContainsString('Strong wind', $result, $name);
            $this->assertStringContainsString('wind Z-score', $result, $name);
        }
    }

    /**
     * For late_frost the description must mention "Late frost".
     */
    public function testBuildDescriptionLateFrost(): void
    {
        $state = ['zScore' => -2.3, 'extraMetric' => null];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_buildDescription', ['late_frost', $state]);
            $this->assertStringContainsString('Late frost', $result, $name);
            $this->assertStringContainsString('temp Z-score', $result, $name);
        }
    }

    /**
     * For pressure_high the description must mention "Anomalously high pressure".
     */
    public function testBuildDescriptionPressureHigh(): void
    {
        $state = ['zScore' => 2.5, 'extraMetric' => null];

        foreach ($this->_commandInstances() as $name => $cmd) {
            $result = $this->_callPrivate($cmd, '_buildDescription', ['pressure_high', $state]);
            $this->assertStringContainsString('Anomalously high pressure', $result, $name);
            $this->assertStringContainsString('pressure Z-score', $result, $name);
        }
    }
}
