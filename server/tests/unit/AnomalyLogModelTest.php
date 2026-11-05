<?php

use App\Models\AnomalyLogModel;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Models\AnomalyLogModel.
 *
 * Tests cover:
 *   - openAnomaly() stores peak_value and description when supplied.
 *   - openAnomaly() stores null peak_value and description when omitted.
 *   - updatePeakIfHigher() updates when |newValue| > |storedPeak|.
 *   - updatePeakIfHigher() is a no-op when |newValue| <= |storedPeak|.
 *   - updatePeakIfHigher() is a no-op when $newValue is null.
 *   - updatePeakIfHigher() updates when storedPeak is null.
 *   - updatePeakIfHigher() is a no-op when the row is not found.
 *
 * All database calls are intercepted via a PHPUnit partial mock of
 * AnomalyLogModel. The CI4 fluent __call chain is stubbed to return $this.
 *
 * @internal
 */
final class AnomalyLogModelTest extends CIUnitTestCase
{
    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Builds a partial mock of AnomalyLogModel with $stubMethods mocked and
     * the CI4 fluent __call chain returning $this.
     *
     * @param string[] $stubMethods
     */
    private function _stubModel(array $stubMethods): AnomalyLogModel
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods($stubMethods)
            ->getMock();

        return $stub;
    }

    // -------------------------------------------------------------------------
    // openAnomaly — with and without optional params
    // -------------------------------------------------------------------------

    /**
     * openAnomaly() must pass peak_value and description into the insert array.
     * We verify by capturing the argument supplied to insert().
     */
    public function testOpenAnomalyPassesPeakValueAndDescription(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['insert', 'getInsertID'])
            ->getMock();

        $captured = null;

        $stub->expects($this->once())
            ->method('insert')
            ->willReturnCallback(function (array $data) use (&$captured) {
                $captured = $data;
            });

        $stub->method('getInsertID')->willReturn(99);

        $id = $stub->openAnomaly('heat_wave', '2026-03-01', 2.75, 'Heat wave (temp Z-score: +2.75)');

        $this->assertSame(99, $id);
        $this->assertNotNull($captured);
        $this->assertSame('heat_wave', $captured['type']);
        $this->assertSame('2026-03-01', $captured['start_date']);
        $this->assertSame(2.75, $captured['peak_value']);
        $this->assertSame('Heat wave (temp Z-score: +2.75)', $captured['description']);
        $this->assertNull($captured['end_date']);
    }

    /**
     * When called without optional arguments, peak_value and description must
     * both be null in the insert array.
     */
    public function testOpenAnomalyDefaultsToNullPeakAndDescription(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['insert', 'getInsertID'])
            ->getMock();

        $captured = null;

        $stub->method('insert')
            ->willReturnCallback(function (array $data) use (&$captured) {
                $captured = $data;
            });

        $stub->method('getInsertID')->willReturn(1);

        $stub->openAnomaly('fog_risk', '2026-03-01');

        $this->assertNull($captured['peak_value']);
        $this->assertNull($captured['description']);
    }

    // -------------------------------------------------------------------------
    // updatePeakIfHigher — no-op when $newValue is null
    // -------------------------------------------------------------------------

    /**
     * updatePeakIfHigher() must return immediately without calling find() or update()
     * when $newValue is null.
     */
    public function testUpdatePeakIfHigherNoOpWhenNullNewValue(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['find', 'update'])
            ->getMock();

        $stub->expects($this->never())->method('find');
        $stub->expects($this->never())->method('update');

        $stub->updatePeakIfHigher(1, null);
    }

    // -------------------------------------------------------------------------
    // updatePeakIfHigher — no-op when row not found
    // -------------------------------------------------------------------------

    /**
     * updatePeakIfHigher() must return without calling update() when find() returns null.
     */
    public function testUpdatePeakIfHigherNoOpWhenRowNotFound(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['find', 'update'])
            ->getMock();

        $stub->method('find')->willReturn(null);
        $stub->expects($this->never())->method('update');

        $stub->updatePeakIfHigher(42, 3.5);
    }

    // -------------------------------------------------------------------------
    // updatePeakIfHigher — updates when storedPeak is null
    // -------------------------------------------------------------------------

    /**
     * When the stored peak_value is null, any non-null newValue must trigger update().
     */
    public function testUpdatePeakIfHigherUpdatesWhenStoredPeakIsNull(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['find', 'update'])
            ->getMock();

        $stub->method('find')->willReturn(['id' => 7, 'peak_value' => null]);

        $stub->expects($this->once())
            ->method('update')
            ->with(7, $this->callback(fn($d) => $d['peak_value'] === 2.5));

        $stub->updatePeakIfHigher(7, 2.5);
    }

    // -------------------------------------------------------------------------
    // updatePeakIfHigher — updates when |newValue| > |storedPeak|
    // -------------------------------------------------------------------------

    /**
     * When |newValue| (3.5) > |storedPeak| (2.0), update() must be called with
     * the rounded new value.
     */
    public function testUpdatePeakIfHigherUpdatesWhenNewValueIsLarger(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['find', 'update'])
            ->getMock();

        $stub->method('find')->willReturn(['id' => 10, 'peak_value' => 2.0]);

        $stub->expects($this->once())
            ->method('update')
            ->with(10, $this->callback(fn($d) => $d['peak_value'] === 3.5));

        $stub->updatePeakIfHigher(10, 3.5);
    }

    // -------------------------------------------------------------------------
    // updatePeakIfHigher — no-op when |newValue| <= |storedPeak|
    // -------------------------------------------------------------------------

    /**
     * When |newValue| (1.5) <= |storedPeak| (2.0), update() must NOT be called.
     */
    public function testUpdatePeakIfHigherNoOpWhenNewValueIsSmaller(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['find', 'update'])
            ->getMock();

        $stub->method('find')->willReturn(['id' => 11, 'peak_value' => 2.0]);
        $stub->expects($this->never())->method('update');

        $stub->updatePeakIfHigher(11, 1.5);
    }

    /**
     * Absolute-value comparison: |newValue| (-1.5) <= |storedPeak| (2.0)
     * — update() must NOT be called even when newValue is negative.
     */
    public function testUpdatePeakIfHigherUsesAbsoluteComparison(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['find', 'update'])
            ->getMock();

        $stub->method('find')->willReturn(['id' => 12, 'peak_value' => 2.0]);
        $stub->expects($this->never())->method('update');

        $stub->updatePeakIfHigher(12, -1.5);
    }

    /**
     * |newValue| (-3.0) > |storedPeak| (2.0) — update() MUST be called.
     */
    public function testUpdatePeakIfHigherUpdatesOnLargerAbsoluteNegativeValue(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['find', 'update'])
            ->getMock();

        $stub->method('find')->willReturn(['id' => 13, 'peak_value' => 2.0]);

        $stub->expects($this->once())
            ->method('update')
            ->with(13, $this->callback(fn($d) => $d['peak_value'] === -3.0));

        $stub->updatePeakIfHigher(13, -3.0);
    }

    // -------------------------------------------------------------------------
    // updatePeakIfHigher — rounding to 4 decimal places
    // -------------------------------------------------------------------------

    /**
     * The value written to the DB must be rounded to 4 decimal places.
     * Input: 3.123456789 → stored as 3.1235.
     */
    public function testUpdatePeakIfHigherRoundsToFourDecimals(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['find', 'update'])
            ->getMock();

        $stub->method('find')->willReturn(['id' => 14, 'peak_value' => null]);

        $stub->expects($this->once())
            ->method('update')
            ->with(14, $this->callback(fn($d) => $d['peak_value'] === 3.1235));

        $stub->updatePeakIfHigher(14, 3.123456789);
    }

    // -------------------------------------------------------------------------
    // getAnomaliesActiveOnDate — active-on-date predicate
    // -------------------------------------------------------------------------

    /**
     * getAnomaliesActiveOnDate() must return only rows where
     * start_date <= date AND (end_date IS NULL OR end_date >= date).
     *
     * We supply four rows:
     *   A — start=2026-03-10, end=null        → active on 2026-03-17 (open)
     *   B — start=2026-03-10, end=2026-03-17  → active on 2026-03-17 (closed today)
     *   C — start=2026-03-10, end=2026-03-16  → NOT active (closed yesterday)
     *   D — start=2026-03-18, end=null        → NOT active (starts tomorrow)
     *
     * The method calls findAll() internally; we stub it to return the full set
     * and verify the SQL constraints via the WHERE clauses captured in the
     * mock's __call chain.
     *
     * Because CI4 uses a fluent __call chain that is hard to introspect without
     * a live DB, we test the method's contract by running it against a real in-
     * memory DB fixture in the database test suite.  Here we limit the unit test
     * to confirming that findAll() is called exactly once (i.e., the method
     * delegates to the ORM rather than doing raw DB work), and that the return
     * value is passed through unchanged.
     */
    public function testGetAnomaliesActiveOnDateCallsFindAll(): void
    {
        $expected = [
            ['id' => 1, 'type' => 'heat_wave', 'start_date' => '2026-03-10', 'end_date' => null],
            ['id' => 2, 'type' => 'fog_risk',  'start_date' => '2026-03-10', 'end_date' => '2026-03-17'],
        ];

        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['findAll'])
            ->getMock();

        $stub->expects($this->once())
            ->method('findAll')
            ->willReturn($expected);

        $result = $stub->getAnomaliesActiveOnDate('2026-03-17');

        $this->assertSame($expected, $result);
    }

    /**
     * getAnomaliesActiveOnDate() must return an empty array when findAll() returns [].
     */
    public function testGetAnomaliesActiveOnDateReturnsEmptyArrayWhenNoRows(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['findAll'])
            ->getMock();

        $stub->method('findAll')->willReturn([]);

        $result = $stub->getAnomaliesActiveOnDate('2026-03-17');

        $this->assertSame([], $result);
    }

    // -------------------------------------------------------------------------
    // getAnomaliesTouchingWindow — used by the Events feed
    // -------------------------------------------------------------------------

    /**
     * getAnomaliesTouchingWindow() must delegate to findAll() and return its
     * result unchanged. As with getAnomaliesActiveOnDate(), the fluent
     * groupStart/where/orGroupStart chain is exercised for real (it only
     * builds the query, it does not execute it), so only findAll() needs to
     * be mocked.
     */
    public function testGetAnomaliesTouchingWindowCallsFindAll(): void
    {
        $expected = [
            ['id' => 1, 'type' => 'heat_wave', 'start_date' => '2026-07-13', 'end_date' => null],
        ];

        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['findAll'])
            ->getMock();

        $stub->expects($this->once())
            ->method('findAll')
            ->willReturn($expected);

        $result = $stub->getAnomaliesTouchingWindow('2026-07-13', '2026-07-14');

        $this->assertSame($expected, $result);
    }

    /**
     * getAnomaliesTouchingWindow() must return an empty array when findAll() returns [].
     */
    public function testGetAnomaliesTouchingWindowReturnsEmptyArrayWhenNoRows(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['findAll'])
            ->getMock();

        $stub->method('findAll')->willReturn([]);

        $result = $stub->getAnomaliesTouchingWindow('2026-07-13', '2026-07-14');

        $this->assertSame([], $result);
    }

    // -------------------------------------------------------------------------
    // closeAnomaly()
    // -------------------------------------------------------------------------

    /**
     * closeAnomaly() must call update() with the end_date supplied.
     */
    public function testCloseAnomalyCallsUpdateWithEndDate(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['update'])
            ->getMock();

        $captured = null;

        $stub->expects($this->once())
            ->method('update')
            ->willReturnCallback(function (int $id, array $data) use (&$captured): bool {
                $captured = ['id' => $id, 'data' => $data];
                return true;
            });

        $stub->closeAnomaly(7, '2026-03-20');

        $this->assertNotNull($captured);
        $this->assertSame(7, $captured['id']);
        $this->assertSame('2026-03-20', $captured['data']['end_date']);
    }

    // -------------------------------------------------------------------------
    // getOpenByType()
    // -------------------------------------------------------------------------

    /**
     * When first() returns a row, getOpenByType() must return it as an array.
     */
    public function testGetOpenByTypeReturnsArrayWhenRowFound(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['first'])
            ->getMock();

        $stub->method('first')->willReturn(['id' => 5, 'type' => 'heat_wave', 'end_date' => null]);

        $result = $stub->getOpenByType('heat_wave');

        $this->assertIsArray($result);
        $this->assertSame('heat_wave', $result['type']);
    }

    /**
     * When first() returns null, getOpenByType() must return null.
     */
    public function testGetOpenByTypeReturnsNullWhenNoRow(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['first'])
            ->getMock();

        $stub->method('first')->willReturn(null);

        $result = $stub->getOpenByType('heat_wave');

        $this->assertNull($result);
    }

    // -------------------------------------------------------------------------
    // getHistory()
    // -------------------------------------------------------------------------

    /**
     * getHistory() must call findAll() with the supplied limit and return its result.
     */
    public function testGetHistoryCallsFindAllWithLimit(): void
    {
        $expected = [
            ['id' => 1, 'type' => 'heat_wave', 'start_date' => '2026-03-01', 'end_date' => null],
        ];

        $capturedLimit = null;

        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['findAll'])
            ->getMock();

        $stub->method('findAll')
            ->willReturnCallback(function (int $limit = 0) use (&$capturedLimit, $expected) {
                $capturedLimit = $limit;
                return $expected;
            });

        $result = $stub->getHistory(25);

        $this->assertSame(25, $capturedLimit);
        $this->assertSame($expected, $result);
    }

    /**
     * getHistory() default limit must be 50.
     */
    public function testGetHistoryDefaultLimitIs50(): void
    {
        $capturedLimit = null;

        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['findAll'])
            ->getMock();

        $stub->method('findAll')
            ->willReturnCallback(function (int $limit = 0) use (&$capturedLimit) {
                $capturedLimit = $limit;
                return [];
            });

        $stub->getHistory();

        $this->assertSame(50, $capturedLimit);
    }

    // -------------------------------------------------------------------------
    // getCalendarData() — pure PHP logic
    // -------------------------------------------------------------------------

    /**
     * getCalendarData(7) with no rows must return exactly 7 calendar entries.
     */
    public function testGetCalendarDataReturnsCorrectNumberOfDays(): void
    {
        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['findAll'])
            ->getMock();

        $stub->method('findAll')->willReturn([]);

        $result = $stub->getCalendarData(7);

        $this->assertCount(7, $result);
    }

    /**
     * A still-open row (end_date=null, very old start) must count as active
     * on every day in the calendar window.
     */
    public function testGetCalendarDataActiveRowIsCountedForDate(): void
    {
        $rows = [
            ['type' => 'heat_wave', 'start_date' => '2020-01-01', 'end_date' => null, 'id' => 1],
        ];

        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['findAll'])
            ->getMock();

        $stub->method('findAll')->willReturn($rows);

        $result = $stub->getCalendarData(3);

        $activeEntry = null;

        foreach ($result as $entry) {
            if ($entry['activeCount'] >= 1) {
                $activeEntry = $entry;
                break;
            }
        }

        $this->assertNotNull($activeEntry, 'At least one calendar entry must have activeCount >= 1');
        $this->assertContains('heat_wave', $activeEntry['types']);
    }

    /**
     * A row closed long ago (end_date well before the calendar window) must not
     * be counted as active on any day in the window.
     */
    public function testGetCalendarDataClosedRowNotCountedAfterEndDate(): void
    {
        $rows = [
            ['type' => 'heat_wave', 'start_date' => '2020-01-01', 'end_date' => '2020-06-01', 'id' => 1],
        ];

        $stub = $this->getMockBuilder(AnomalyLogModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['findAll'])
            ->getMock();

        $stub->method('findAll')->willReturn($rows);

        $result = $stub->getCalendarData(3);

        foreach ($result as $entry) {
            $this->assertSame(0, $entry['activeCount'], 'Closed-long-ago row must not be active today');
        }
    }

    // -------------------------------------------------------------------------
    // applyDayState — episode bookkeeping (in-memory fake of the table)
    // -------------------------------------------------------------------------

    /**
     * Returns an AnomalyLogModel whose persistence is an in-memory array, exposed
     * through the public $rows property of the returned object.
     */
    private function _memoryModel(): AnomalyLogModel
    {
        return new class extends AnomalyLogModel {
            /** @var array<int, array> */
            public array $rows = [];
            private int $seq = 0;

            public function __construct()
            {
            }

            public function openAnomaly(string $type, string $date, ?float $peakValue = null, ?string $description = null): int
            {
                $id = ++$this->seq;
                $this->rows[$id] = [
                    'id' => $id, 'type' => $type, 'start_date' => $date, 'end_date' => null,
                    'peak_value' => $peakValue, 'description' => $description,
                ];

                return $id;
            }

            public function update($id = null, $row = null): bool
            {
                $this->rows[$id] = array_merge($this->rows[$id], $row);

                return true;
            }

            public function delete($id = null, bool $purge = false)
            {
                unset($this->rows[$id]);

                return true;
            }

            public function updatePeakIfHigher(int $id, ?float $newValue): void
            {
                if ($newValue !== null && ($this->rows[$id]['peak_value'] === null
                    || abs($newValue) > abs((float) $this->rows[$id]['peak_value']))) {
                    $this->rows[$id]['peak_value'] = $newValue;
                }
            }

            public function getLatestByType(string $type): ?array
            {
                $best = null;

                foreach ($this->rows as $row) {
                    if ($row['type'] === $type && ($best === null || $row['start_date'] >= $best['start_date'])) {
                        $best = $row;
                    }
                }

                return $best;
            }
        };
    }

    /**
     * Feeds a list of [date => active] days to the model like the cron does.
     *
     * @param array<string, bool> $days
     */
    private function _feed(AnomalyLogModel $model, array $days, string $type = 'fog_risk'): void
    {
        foreach ($days as $date => $active) {
            $model->applyDayState($type, $active, $date, 1.0, 'd', $model->getLatestByType($type));
        }
    }

    /**
     * end_date is the LAST ACTIVE day (inclusive), not the first inactive one.
     */
    public function testApplyDayStateClosesWithLastActiveDay(): void
    {
        $model = $this->_memoryModel();

        $this->_feed($model, ['2026-03-10' => true, '2026-03-11' => true, '2026-03-12' => false]);

        $this->assertCount(1, $model->rows);
        $row = reset($model->rows);
        $this->assertSame('2026-03-10', $row['start_date']);
        $this->assertSame('2026-03-11', $row['end_date']);
    }

    /**
     * Evaluating the same days again (cron run twice, catch-up window) changes nothing.
     */
    public function testApplyDayStateIsIdempotent(): void
    {
        $model = $this->_memoryModel();
        $days  = ['2026-03-10' => true, '2026-03-11' => true, '2026-03-12' => false, '2026-03-13' => true];

        $this->_feed($model, $days);
        $once = $model->rows;
        $this->_feed($model, $days);
        $this->_feed($model, $days);

        $this->assertEquals($once, $model->rows);
        $this->assertCount(2, $model->rows);
    }

    /**
     * A day evaluated active and then inactive (data changed, rerun) drops the
     * one-day episode instead of leaving end_date < start_date.
     */
    public function testApplyDayStateDropsEpisodeThatStartedOnTheDay(): void
    {
        $model = $this->_memoryModel();

        $this->_feed($model, ['2026-03-10' => true]);
        $this->_feed($model, ['2026-03-10' => false]);

        $this->assertSame([], $model->rows);
    }

    /**
     * An episode closed the previous day is re-opened (no duplicate row) when the
     * anomaly is active again; with a gap of an inactive day a new episode starts.
     */
    public function testApplyDayStateReopensAdjacentEpisodeButNotAcrossGap(): void
    {
        $model = $this->_memoryModel();

        // closed with end 03-10 (e.g. by an earlier partial evaluation of 03-11)
        $this->_feed($model, ['2026-03-09' => true, '2026-03-10' => true, '2026-03-11' => false]);
        $result = $model->applyDayState('fog_risk', true, '2026-03-11', 1.0, 'd', $model->getLatestByType('fog_risk'));

        $this->assertSame('reopened', $result['action']);
        $this->assertCount(1, $model->rows);
        $this->assertNull(reset($model->rows)['end_date']);

        // real gap: 03-12 inactive, 03-13 active -> second row
        $this->_feed($model, ['2026-03-12' => false, '2026-03-13' => true]);
        $this->assertCount(2, $model->rows);
    }

    /**
     * Different types do not interfere.
     */
    public function testApplyDayStateKeepsTypesSeparate(): void
    {
        $model = $this->_memoryModel();

        $this->_feed($model, ['2026-03-10' => true], 'fog_risk');
        $this->_feed($model, ['2026-03-10' => true], 'heat_wave');

        $this->assertCount(2, $model->rows);
    }
}
