<?php

use App\Libraries\EventFeedBuilder;
use App\Models\PrecipitationModel;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit tests for App\Libraries\EventFeedBuilder.
 *
 * All tests exercise pure PHP logic on plain arrays (the shape returned by
 * WeatherDataEntity::toRawArray()) — no database connection is required.
 *
 * @internal
 */
final class EventFeedBuilderTest extends CIUnitTestCase
{
    private EventFeedBuilder $builder;

    protected function setUp(): void
    {
        parent::setUp();
        $this->builder = new EventFeedBuilder();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function _window(string $start, string $end): array
    {
        return [
            new DateTime($start, new DateTimeZone('UTC')),
            new DateTime($end, new DateTimeZone('UTC')),
        ];
    }

    private function _row(array $overrides = []): array
    {
        return array_merge([
            'date'          => '2026-07-13 15:00:00',
            'temperature'   => null,
            'pressure'      => null,
            'wind_gust'     => null,
            'wind_deg'      => null,
            'precipitation' => null,
        ], $overrides);
    }

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    public function testConstantsHaveExpectedValues(): void
    {
        $this->assertSame(0.5, EventFeedBuilder::TEMPERATURE_CHANGE_THRESHOLD_C);
        $this->assertSame(1.0, EventFeedBuilder::PRESSURE_CHANGE_THRESHOLD_HPA);
        $this->assertSame(20, EventFeedBuilder::CHANGE_WINDOW_MINUTES);
        $this->assertSame(7.0, EventFeedBuilder::WIND_GUST_THRESHOLD_MS);
        $this->assertSame(0.1, PrecipitationModel::RAIN_THRESHOLD_MM);
        $this->assertSame(15, EventFeedBuilder::SYSTEM_FRESHNESS_MINUTES);
    }

    // -------------------------------------------------------------------------
    // temperature_change / pressure_change
    // -------------------------------------------------------------------------

    /**
     * A temperature rise of 0.6°C over a 25-minute gap (>= the 20-minute window)
     * must produce a single "up" temperature_change event.
     */
    public function testTemperatureRiseAboveThresholdEmitsUpEvent(): void
    {
        $rows = [
            $this->_row(['date' => '2026-07-13 15:00:00', 'temperature' => 20.0]),
            $this->_row(['date' => '2026-07-13 15:25:00', 'temperature' => 20.6]),
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build($rows, [], $start, $end, null, 50);

        $changeEvents = array_values(array_filter($events, static fn($e) => $e['type'] === 'temperature_change'));

        $this->assertCount(1, $changeEvents);
        $this->assertSame('up', $changeEvents[0]['direction']);
        $this->assertSame(0.6, $changeEvents[0]['value']);
    }

    /**
     * A pressure drop of 1.2 hPa over the rolling window must produce a
     * "down" pressure_change event.
     */
    public function testPressureDropAboveThresholdEmitsDownEvent(): void
    {
        $rows = [
            $this->_row(['date' => '2026-07-13 15:00:00', 'pressure' => 1013.0]),
            $this->_row(['date' => '2026-07-13 15:25:00', 'pressure' => 1011.8]),
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build($rows, [], $start, $end, null, 50);

        $changeEvents = array_values(array_filter($events, static fn($e) => $e['type'] === 'pressure_change'));

        $this->assertCount(1, $changeEvents);
        $this->assertSame('down', $changeEvents[0]['direction']);
        $this->assertSame(1.2, $changeEvents[0]['value']);
    }

    /**
     * A temperature delta below the threshold must not emit an event.
     */
    public function testTemperatureChangeBelowThresholdEmitsNoEvent(): void
    {
        $rows = [
            $this->_row(['date' => '2026-07-13 15:00:00', 'temperature' => 20.0]),
            $this->_row(['date' => '2026-07-13 15:25:00', 'temperature' => 20.2]),
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build($rows, [], $start, $end, null, 50);

        $changeEvents = array_filter($events, static fn($e) => $e['type'] === 'temperature_change');

        $this->assertCount(0, $changeEvents);
    }

    /**
     * Readings closer together than CHANGE_WINDOW_MINUTES must not be compared
     * (the anchor only advances once the elapsed time reaches the window).
     */
    public function testTemperatureChangeIgnoresReadingsInsideWindow(): void
    {
        $rows = [
            $this->_row(['date' => '2026-07-13 15:00:00', 'temperature' => 20.0]),
            $this->_row(['date' => '2026-07-13 15:05:00', 'temperature' => 21.0]), // only 5 min later, skipped
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build($rows, [], $start, $end, null, 50);

        $changeEvents = array_filter($events, static fn($e) => $e['type'] === 'temperature_change');

        $this->assertCount(0, $changeEvents);
    }

    // -------------------------------------------------------------------------
    // wind_gust
    // -------------------------------------------------------------------------

    /**
     * A wind_gust reading above the threshold must emit a wind_gust event
     * carrying the raw gust speed and compass degrees.
     */
    public function testWindGustAboveThresholdEmitsEvent(): void
    {
        $rows = [
            $this->_row(['date' => '2026-07-13 15:39:00', 'wind_gust' => 8.5, 'wind_deg' => 315]),
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build($rows, [], $start, $end, null, 50);

        $gustEvents = array_values(array_filter($events, static fn($e) => $e['type'] === 'wind_gust'));

        $this->assertCount(1, $gustEvents);
        $this->assertSame(8.5, $gustEvents[0]['value']);
        $this->assertSame(315, $gustEvents[0]['windDeg']);
    }

    /**
     * A wind_gust reading at or below the threshold must not emit an event.
     */
    public function testWindGustAtThresholdEmitsNoEvent(): void
    {
        $rows = [
            $this->_row(['date' => '2026-07-13 15:39:00', 'wind_gust' => 7.0, 'wind_deg' => 90]),
            $this->_row(['date' => '2026-07-13 15:40:00', 'wind_gust' => 4.0, 'wind_deg' => 90]),
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build($rows, [], $start, $end, null, 50);

        $gustEvents = array_filter($events, static fn($e) => $e['type'] === 'wind_gust');

        $this->assertCount(0, $gustEvents);
    }

    // -------------------------------------------------------------------------
    // precipitation
    // -------------------------------------------------------------------------

    /**
     * Consecutive positive precipitation readings must be collapsed into a
     * single event, summed, timestamped at the last reading in the run.
     */
    public function testConsecutivePrecipitationReadingsAreCollapsedIntoOneEvent(): void
    {
        $rows = [
            $this->_row(['date' => '2026-07-13 15:37:00', 'precipitation' => 0.2]),
            $this->_row(['date' => '2026-07-13 15:38:00', 'precipitation' => 0.15]),
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build($rows, [], $start, $end, null, 50);

        $precipEvents = array_values(array_filter($events, static fn($e) => $e['type'] === 'precipitation'));

        $this->assertCount(1, $precipEvents);
        $this->assertSame(0.35, $precipEvents[0]['value']);
        $this->assertStringStartsWith('2026-07-13T15:38:00', $precipEvents[0]['date']);
    }

    /**
     * A precipitation value at or below the noise threshold must not start
     * or extend a run.
     */
    public function testPrecipitationAtThresholdEmitsNoEvent(): void
    {
        $rows = [
            $this->_row(['date' => '2026-07-13 15:37:00', 'precipitation' => 0.1]),
            $this->_row(['date' => '2026-07-13 15:38:00', 'precipitation' => 0.0]),
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build($rows, [], $start, $end, null, 50);

        $precipEvents = array_filter($events, static fn($e) => $e['type'] === 'precipitation');

        $this->assertCount(0, $precipEvents);
    }

    /**
     * A run that is still positive at the end of the row list must still be
     * flushed as an event (no trailing zero reading required).
     */
    public function testPrecipitationRunIsFlushedAtEndOfRows(): void
    {
        $rows = [
            $this->_row(['date' => '2026-07-13 15:37:00', 'precipitation' => 0.3]),
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build($rows, [], $start, $end, null, 50);

        $precipEvents = array_values(array_filter($events, static fn($e) => $e['type'] === 'precipitation'));

        $this->assertCount(1, $precipEvents);
        $this->assertSame(0.3, $precipEvents[0]['value']);
    }

    // -------------------------------------------------------------------------
    // system_status
    // -------------------------------------------------------------------------

    /**
     * A lastUpdate timestamp within the freshness window must produce a
     * system_status event with status "ok".
     */
    public function testSystemStatusIsOkWithinFreshnessWindow(): void
    {
        $lastUpdate = (new DateTime('now', new DateTimeZone('UTC')))->modify('-5 minutes')->format('Y-m-d H:i:s');

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build([], [], $start, $end, $lastUpdate, 50);

        $statusEvents = array_values(array_filter($events, static fn($e) => $e['type'] === 'system_status'));

        $this->assertCount(1, $statusEvents);
        $this->assertSame('ok', $statusEvents[0]['status']);
    }

    /**
     * A lastUpdate timestamp older than the freshness window must produce a
     * system_status event with status "stale".
     */
    public function testSystemStatusIsStaleOutsideFreshnessWindow(): void
    {
        $lastUpdate = (new DateTime('now', new DateTimeZone('UTC')))->modify('-30 minutes')->format('Y-m-d H:i:s');

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build([], [], $start, $end, $lastUpdate, 50);

        $statusEvents = array_values(array_filter($events, static fn($e) => $e['type'] === 'system_status'));

        $this->assertCount(1, $statusEvents);
        $this->assertSame('stale', $statusEvents[0]['status']);
    }

    /**
     * A null lastUpdate must not produce a system_status event at all.
     */
    public function testSystemStatusOmittedWhenLastUpdateIsNull(): void
    {
        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build([], [], $start, $end, null, 50);

        $statusEvents = array_filter($events, static fn($e) => $e['type'] === 'system_status');

        $this->assertCount(0, $statusEvents);
    }

    // -------------------------------------------------------------------------
    // anomaly_started / anomaly_ended
    // -------------------------------------------------------------------------

    /**
     * An anomaly_log row whose start_date falls within the window must emit
     * an anomaly_started event with the matching anomalyType.
     */
    public function testAnomalyStartedEmittedWhenStartDateInWindow(): void
    {
        $anomalyRows = [
            ['type' => 'heat_wave', 'start_date' => '2026-07-13', 'end_date' => null],
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build([], $anomalyRows, $start, $end, null, 50);

        $started = array_values(array_filter($events, static fn($e) => $e['type'] === 'anomaly_started'));

        $this->assertCount(1, $started);
        $this->assertSame('heat_wave', $started[0]['anomalyType']);
    }

    /**
     * An anomaly_log row whose end_date falls within the window must emit an
     * anomaly_ended event with the matching anomalyType.
     */
    public function testAnomalyEndedEmittedWhenEndDateInWindow(): void
    {
        $anomalyRows = [
            ['type' => 'cold_snap', 'start_date' => '2026-07-01', 'end_date' => '2026-07-13'],
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build([], $anomalyRows, $start, $end, null, 50);

        $ended = array_values(array_filter($events, static fn($e) => $e['type'] === 'anomaly_ended'));

        $this->assertCount(1, $ended);
        $this->assertSame('cold_snap', $ended[0]['anomalyType']);
    }

    /**
     * An anomaly_log row entirely outside the window must not emit any event.
     */
    public function testAnomalyOutsideWindowEmitsNoEvent(): void
    {
        $anomalyRows = [
            ['type' => 'heat_wave', 'start_date' => '2026-01-01', 'end_date' => '2026-01-05'],
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build([], $anomalyRows, $start, $end, null, 50);

        $this->assertCount(0, $events);
    }

    // -------------------------------------------------------------------------
    // Sorting and limit
    // -------------------------------------------------------------------------

    /**
     * The merged feed must be sorted by date descending.
     */
    public function testEventsAreSortedByDateDescending(): void
    {
        $rows = [
            $this->_row(['date' => '2026-07-13 15:00:00', 'wind_gust' => 8.0]),
            $this->_row(['date' => '2026-07-13 16:00:00', 'wind_gust' => 9.0]),
            $this->_row(['date' => '2026-07-13 14:00:00', 'wind_gust' => 7.5]),
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build($rows, [], $start, $end, null, 50);

        $dates = array_column($events, 'date');
        $sorted = $dates;
        rsort($sorted);

        $this->assertSame($sorted, $dates);
    }

    /**
     * The result must never exceed the supplied limit.
     */
    public function testResultIsCappedAtLimit(): void
    {
        $rows = [];

        for ($i = 0; $i < 10; $i++) {
            $rows[] = $this->_row([
                'date'      => sprintf('2026-07-13 %02d:00:00', $i),
                'wind_gust' => 8.0,
            ]);
        }

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build($rows, [], $start, $end, null, 3);

        $this->assertCount(3, $events);
    }

    // -------------------------------------------------------------------------
    // Date format
    // -------------------------------------------------------------------------

    /**
     * Every emitted event's "date" field must be a valid ISO 8601 string.
     */
    public function testEmittedDatesAreIso8601(): void
    {
        $rows = [
            $this->_row(['date' => '2026-07-13 15:39:00', 'wind_gust' => 8.5, 'wind_deg' => 315]),
        ];

        [$start, $end] = $this->_window('2026-07-13 00:00:00', '2026-07-13 23:59:59');
        $events = $this->builder->build($rows, [], $start, $end, null, 50);

        $this->assertNotEmpty($events);
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/',
            $events[0]['date']
        );
    }
}
