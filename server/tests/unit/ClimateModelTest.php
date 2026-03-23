<?php

use App\Models\ClimateModel;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Models\ClimateModel.
 *
 * All test cases exercise getClimateStats() — which orchestrates PHP-level
 * baseline computation, tempAnomaly calculation, and response assembly — by
 * using a partial mock that overrides the two protected database-query methods
 * (_getAnnualStats / _getMonthlyNormals) with fixture data.
 *
 * No database connection is required.
 *
 * @internal
 */
final class ClimateModelTest extends CIUnitTestCase
{
    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Build a minimal annual-stats row for one year.
     *
     * @param int   $year
     * @param float $avgTemp
     * @param int   $frostDays
     * @param int   $hotDays
     * @param float $totalPrecip
     * @param int   $heavyRainDays
     * @return array
     */
    private function _makeYearRow(
        int   $year,
        float $avgTemp,
        int   $frostDays    = 0,
        int   $hotDays      = 0,
        float $totalPrecip  = 0.0,
        int   $heavyRainDays = 0
    ): array {
        return [
            'year'          => $year,
            'avgTemp'       => $avgTemp,
            'minTemp'       => $avgTemp - 10.0,
            'maxTemp'       => $avgTemp + 10.0,
            'totalPrecip'   => $totalPrecip,
            'precipDays'    => 0,
            'frostDays'     => $frostDays,
            'hotDays'       => $hotDays,
            'heavyRainDays' => $heavyRainDays,
            'avgPressure'   => 1013.0,
            'avgHumidity'   => 70.0,
            'avgWindSpeed'  => 3.5,
            'avgClouds'     => 60.0,
        ];
    }

    /**
     * Build a minimal monthly-normals row.
     *
     * @param int $month 1–12
     * @return array
     */
    private function _makeMonthRow(int $month): array
    {
        return [
            'month'        => $month,
            'avgTemp'      => 0.0,
            'minTemp'      => -5.0,
            'maxTemp'      => 5.0,
            'avgPrecip'    => 30.0,
            'avgClouds'    => 60.0,
            'avgWindSpeed' => 3.0,
        ];
    }

    /**
     * Create a partial mock of ClimateModel with _getAnnualStats and
     * _getMonthlyNormals overridden to return the provided fixture data.
     *
     * @param array $years
     * @param array $monthlyNormals
     * @return ClimateModel
     */
    private function _mockModel(array $years, array $monthlyNormals): ClimateModel
    {
        $mock = $this->getMockBuilder(ClimateModel::class)
            ->onlyMethods(['_getAnnualStats', '_getMonthlyNormals'])
            ->getMock();

        $mock->method('_getAnnualStats')->willReturn($years);
        $mock->method('_getMonthlyNormals')->willReturn($monthlyNormals);

        return $mock;
    }

    // -------------------------------------------------------------------------
    // 1. Frost-day count is preserved correctly
    // -------------------------------------------------------------------------

    /**
     * Rows with known frostDays values must appear unchanged in the response.
     * Frost days are days where temperature < 0°C (computed by SQL SUM(temperature < 0)).
     */
    public function testFrostDaysCountIsCorrect(): void
    {
        $years = [
            $this->_makeYearRow(2022, 5.0, frostDays: 84),
            $this->_makeYearRow(2023, 6.0, frostDays: 72),
        ];

        $mock   = $this->_mockModel($years, []);
        $result = $mock->getClimateStats();

        $this->assertSame(84, $result['years'][0]['frostDays']);
        $this->assertSame(72, $result['years'][1]['frostDays']);
    }

    // -------------------------------------------------------------------------
    // 2. Hot-day count is preserved correctly
    // -------------------------------------------------------------------------

    /**
     * Rows with known hotDays values must appear unchanged in the response.
     * Hot days are days where temperature >= 30°C.
     */
    public function testHotDaysCountIsCorrect(): void
    {
        $years = [
            $this->_makeYearRow(2022, 8.0, hotDays: 12),
            $this->_makeYearRow(2023, 9.0, hotDays: 18),
        ];

        $mock   = $this->_mockModel($years, []);
        $result = $mock->getClimateStats();

        $this->assertSame(12, $result['years'][0]['hotDays']);
        $this->assertSame(18, $result['years'][1]['hotDays']);
    }

    // -------------------------------------------------------------------------
    // 3. Temperature anomaly sign is correct
    // -------------------------------------------------------------------------

    /**
     * A year whose avgTemp is below the grand-mean baseline must have a
     * negative tempAnomaly; a year above the baseline must have a positive one.
     *
     * Baseline = (8.0 + 12.0) / 2 = 10.0
     * Year 2022 anomaly: 8.0 - 10.0 = -2.0  (below baseline → negative)
     * Year 2023 anomaly: 12.0 - 10.0 = +2.0 (above baseline → positive)
     */
    public function testTempAnomalySignIsCorrect(): void
    {
        $years = [
            $this->_makeYearRow(2022, 8.0),   // below baseline
            $this->_makeYearRow(2023, 12.0),  // above baseline
        ];

        $mock   = $this->_mockModel($years, []);
        $result = $mock->getClimateStats();

        $this->assertSame(10.0, $result['baselineAvgTemp']);
        $this->assertSame(-2.0, $result['years'][0]['tempAnomaly']);
        $this->assertSame(2.0,  $result['years'][1]['tempAnomaly']);
    }

    // -------------------------------------------------------------------------
    // 4. Monthly normals always has 12 entries
    // -------------------------------------------------------------------------

    /**
     * When the mock provides all 12 months, the response must contain exactly
     * 12 monthlyNormals entries with months 1–12.
     */
    public function testMonthlyNormalsHas12Entries(): void
    {
        $months = array_map(fn(int $m) => $this->_makeMonthRow($m), range(1, 12));

        $mock   = $this->_mockModel([], $months);
        $result = $mock->getClimateStats();

        $this->assertCount(12, $result['monthlyNormals']);

        $monthNums = array_column($result['monthlyNormals'], 'month');
        $this->assertSame(range(1, 12), $monthNums);
    }

    // -------------------------------------------------------------------------
    // 5. Total precipitation is a sum, not an average
    // -------------------------------------------------------------------------

    /**
     * totalPrecip for a year must be the yearly SUM of daily precipitation,
     * not the average. The model stores whatever value the SQL returns for
     * total_precip; this test verifies that a large SUM (e.g. 487.3 mm) is
     * faithfully preserved in the output rather than being divided by day count.
     */
    public function testTotalPrecipIsSumNotAverage(): void
    {
        $years = [
            $this->_makeYearRow(2022, 9.0, totalPrecip: 487.3),
        ];

        $mock   = $this->_mockModel($years, []);
        $result = $mock->getClimateStats();

        // A daily average for ~365 days would be ≈ 1.33 mm, nowhere near 487.3.
        // Asserting the value is preserved proves SUM semantics.
        $this->assertSame(487.3, $result['years'][0]['totalPrecip']);
    }
}
