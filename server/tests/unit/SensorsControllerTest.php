<?php

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Feature/unit tests for App\Controllers\Sensors.
 *
 * @internal
 */
final class SensorsControllerTest extends CIUnitTestCase
{
    use FeatureTestTrait;

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
     * Without a DB, the model save will throw → 500. That is the expected
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
}
