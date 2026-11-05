<?php

use App\Controllers\Sensors;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;
use CodeIgniter\Throttle\Throttler;
use CodeIgniter\Config\Services;

/**
 * Feature/unit tests for App\Controllers\Sensors.
 *
 * @internal
 */
final class SensorsControllerTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    protected function setUp(): void
    {
        parent::setUp();
        // Reset the shared throttler service so each test starts with a fresh
        // rate-limit bucket. The default mockCache() in CIUnitTestCase replaces
        // the cache service but the shared throttler still holds a reference to
        // the old cache. Injecting a new throttler with the current cache fixes this.
        Services::injectMock('throttler', new Throttler(Services::cache()));
    }

    // -------------------------------------------------------------------------
    // Token validation
    // -------------------------------------------------------------------------

    public function testMissingTokenReturns401(): void
    {
        $result = $this->post('sensors', ['t' => '20.5', 'h' => '60', 'p' => '1013']);
        $result->assertStatus(401);
    }

    public function testInvalidTokenReturns401(): void
    {
        $result = $this->post('sensors?token=wrong_token', ['t' => '20.5', 'h' => '60', 'p' => '1013']);
        $result->assertStatus(401);
    }

    /**
     * A correct token but empty body — CI4 failValidationErrors returns 400.
     */
    public function testValidTokenButEmptyBodyReturns400(): void
    {
        $testToken = 'test_sensor_token_12345';
        putenv("app.arduino.token={$testToken}");

        $result = $this->post("sensors?token={$testToken}", []);

        putenv('app.arduino.token=');

        $result->assertStatus(400);
    }

    /**
     * When the token matches and data is present, auth + validation pass.
     * Without a DB, the model save will throw -> 500. That is the expected
     * outcome confirming auth and validation succeeded.
     */
    public function testValidTokenAndDataPassesAuthAndValidation(): void
    {
        $testToken = 'test_sensor_token_12345';
        putenv("app.arduino.token={$testToken}");

        $result = $this->post("sensors?token={$testToken}", [
            't'  => '20.5',
            'p'  => '1013',
            'h'  => '60',
            'ws' => '3.5',
            'wd' => '180',
            'uv' => '2.1',
        ]);

        putenv('app.arduino.token=');

        $statusCode = $result->response()->getStatusCode();
        $this->assertNotSame(401, $statusCode, 'Should not be 401 when token is correct');
        $this->assertNotSame(400, $statusCode, 'Should not be 400 when data is present');
    }

    /**
     * The firmware posts pressure in mmHg with one decimal; it must be converted to hPa and not fail validation.
     */
    public function testMmHgPressureFromFirmwarePassesValidation(): void
    {
        $testToken = 'test_sensor_token_12345';
        putenv("app.arduino.token={$testToken}");

        $result = $this->post("sensors?token={$testToken}", ['t' => '20.5', 'p' => '752.3', 'h' => '60']);

        putenv('app.arduino.token=');

        $this->assertNotSame(400, $result->response()->getStatusCode(), 'mmHg pressure must be accepted');
    }

    /**
     * A second POST within the rate window from the same IP must return 429.
     */
    public function testThrottleReturns429OnSubsequentRequest(): void
    {
        // First request — passes throttle (fresh bucket due to setUp)
        $first = $this->post('sensors', ['t' => '20.5']);
        $this->assertNotSame(429, $first->response()->getStatusCode(), 'First request must not be throttled');

        // Second immediate request from the same IP — throttle should fire
        $second = $this->post('sensors', ['t' => '20.5']);
        $this->assertSame(429, $second->response()->getStatusCode(), 'Second request within the window must be throttled');
    }

    // -------------------------------------------------------------------------
    // HTTP method constraint
    // -------------------------------------------------------------------------

    /**
     * Only POST is registered for /sensors. A GET should produce a 404.
     * FeatureTestTrait wraps PageNotFoundException as a 404 response.
     */
    public function testGetRequestToSensorsReturnsNotFound(): void
    {
        try {
            $result     = $this->get('sensors');
            $statusCode = $result->response()->getStatusCode();
            $this->assertSame(404, $statusCode);
        } catch (\CodeIgniter\Exceptions\PageNotFoundException $e) {
            // Also acceptable — route does not exist for GET
            $this->assertTrue(true);
        }
    }

    /**
     * An empty server-side token must never authenticate, even with an empty request token.
     */
    public function testEmptyServerTokenFailsClosed(): void
    {
        putenv('app.arduino.token=');

        $result = $this->post('sensors?token=', ['t' => '20.5']);

        $this->assertSame(401, $result->response()->getStatusCode());
    }

    /**
     * A body with only unknown fields stores nothing and is rejected.
     */
    public function testPayloadWithoutKnownMeasurementsReturns400(): void
    {
        putenv('app.arduino.token=test_sensor_token_12345');

        $result = $this->post('sensors?token=test_sensor_token_12345', ['foo' => 'bar']);

        putenv('app.arduino.token=');

        $this->assertSame(400, $result->response()->getStatusCode());
    }

    /**
     * Out-of-range values fail model validation and must not be reported as created.
     */
    public function testOutOfRangeValueReturns400(): void
    {
        putenv('app.arduino.token=test_sensor_token_12345');

        $result = $this->post('sensors?token=test_sensor_token_12345', ['t' => '999']);

        putenv('app.arduino.token=');

        $this->assertSame(400, $result->response()->getStatusCode());
    }

    /**
     * The calm anemometer (-1) and negative night UV must not reject the whole reading.
     */
    public function testNegativeWindAndUvDoNotRejectReading(): void
    {
        putenv('app.arduino.token=test_sensor_token_12345');

        $result = $this->post('sensors?token=test_sensor_token_12345', ['t' => '20.5', 'ws' => '-1', 'uv' => '-0.8']);

        putenv('app.arduino.token=');

        $this->assertNotSame(400, $result->response()->getStatusCode());
    }

    /**
     * An invalid single field is dropped while the valid ones are still stored.
     */
    public function testInvalidFieldIsDroppedNotWholeReading(): void
    {
        putenv('app.arduino.token=test_sensor_token_12345');

        $result = $this->post('sensors?token=test_sensor_token_12345', ['t' => '999', 'h' => '60', 'wd' => 'abc']);

        putenv('app.arduino.token=');

        $this->assertNotSame(400, $result->response()->getStatusCode());
    }

    /**
     * Only invalid fields: nothing is left to store, so the reading is rejected.
     */
    public function testOnlyInvalidFieldsReturns400(): void
    {
        putenv('app.arduino.token=test_sensor_token_12345');

        $result = $this->post('sensors?token=test_sensor_token_12345', ['t' => 'abc', 'wd' => '999']);

        putenv('app.arduino.token=');

        $this->assertSame(400, $result->response()->getStatusCode());
    }

    /**
     * Firmware that sends m/s and degrees (fw=2) keeps its wind.
     */
    public function testWindFromCurrentFirmwareIsKept(): void
    {
        $parsed = $this->_parse(['fw' => '2', 't' => '20.5', 'ws' => '3.5', 'wd' => '180', 'uv' => '2.1']);

        $this->assertSame(3.5, $parsed['wind_speed']);
        $this->assertSame(180, $parsed['wind_deg']);
        $this->assertSame(2.1, $parsed['uv_index']);
    }

    /**
     * The older firmware posts anemometer pulses and a sector number: its wind is dropped, so it can not reach the
     * observatory feed as strong wind; the rest of the reading (night UV clamped to 0) is kept.
     */
    public function testWindFromOldFirmwareIsDropped(): void
    {
        $parsed = $this->_parse(['p' => '752.3', 't' => '1.2', 'h' => '85.0', 'uv' => '-0.35', 'wd' => '3', 'ws' => '22']);

        $this->assertNull($parsed['wind_speed']);
        $this->assertNull($parsed['wind_deg']);
        $this->assertSame(1.2, $parsed['temperature']);
        $this->assertSame(0.0, $parsed['uv_index']);
    }

    /**
     * @param array<string, string> $data POST fields
     * @return array<string, float|int|null>
     */
    private function _parse(array $data): array
    {
        $method = new \ReflectionMethod(Sensors::class, '_parseMeasurements');
        $method->setAccessible(true);

        return $method->invoke(new Sensors(), $data);
    }
}
