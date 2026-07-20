# Backend Agent Memory Index

## Feedback
- [feedback_ci4_entity_dates_vs_casts.md](feedback_ci4_entity_dates_vs_casts.md) — Fields in $dates must NOT appear in $casts; use nullable casts ('?integer', '?float') for all nullable columns
- [feedback_weatherdata_dto_not_entity.md](feedback_weatherdata_dto_not_entity.md) — WeatherData is a plain DTO (not a CI4 Entity); it must stay as a plain class with constructor
- [feedback_controller_testing.md](feedback_controller_testing.md) — Use ControllerTestTrait (not raw new) for CI4 controller tests; withBody trait collision resolution; TypeError handling
- [feedback_ci4_response_codes.md](feedback_ci4_response_codes.md) — failValidationErrors() returns 400 (not 422) in CodeIgniter4
- [feedback_history_controller_bug.md](feedback_history_controller_bug.md) — History::_getData() has return type mismatch causing TypeError in PHP 8.3; tests must use expectException
- [feedback_ci4_model_mocking.md](feedback_ci4_model_mocking.md) — CI4 Model fluent methods are __call magic; when mocking a model as a DEPENDENCY, use getMockBuilder without onlyMethods + stub __call to return self; when testing the model's OWN method (e.g. getRowsSince), scope onlyMethods(['__call','findAll']) or the mock silently no-ops the method under test
- [feedback_weather_entity_cast.md](feedback_weather_entity_cast.md) — DailyAveragesModel/HourlyAveragesModel return WeatherDataEntity; use toRawArray() not (array) cast to get column-name keys
- [feedback_throttle_filter_testing.md](feedback_throttle_filter_testing.md) — CI4 shared throttler holds old cache ref; inject fresh throttler with Services::injectMock() in setUp() to reset rate limit between tests
- [feedback_smart_quotes_in_php_files.md](feedback_smart_quotes_in_php_files.md) — Edit tool can introduce Unicode smart quotes in PHP config files causing "Undefined constant" errors; verify with python3 hex check and use bash heredoc to fix
- [feedback_phpunit_mock_return_types.md](feedback_phpunit_mock_return_types.md) — willReturnCallback closures must declare and return the correct type when the mocked method has a PHP 8 return type declaration
- [feedback_ci4_shared_test_db_wipes_schema.md](feedback_ci4_shared_test_db_wipes_schema.md) — vendor/bin/phpunit wipes the App-namespace schema in the shared dev DB; run migrate AFTER phpunit, before final manual DB verification
- [feedback_ci4_entity_camelcase_digit_columns.md](feedback_ci4_entity_camelcase_digit_columns.md) — Entity camelCase access needs explicit $datamap entries; no auto-conversion, especially for columns with embedded digits (pm2_5 → pm25)

## Reference
- [reference_openmeteo_api_quirks.md](reference_openmeteo_api_quirks.md) — Open-Meteo API verified response shape: dual-host, ISO8601 time (not epoch), columnar hourly arrays, visibility is valid, shorter air-quality forecast horizon
