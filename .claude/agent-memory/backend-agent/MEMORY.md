# Backend Agent Memory Index

## Feedback
- [feedback_ci4_entity_dates_vs_casts.md](feedback_ci4_entity_dates_vs_casts.md) — Fields in $dates must NOT appear in $casts; use nullable casts ('?integer', '?float') for all nullable columns
- [feedback_weatherdata_dto_not_entity.md](feedback_weatherdata_dto_not_entity.md) — WeatherData is a plain DTO (not a CI4 Entity); it must stay as a plain class with constructor
- [feedback_controller_testing.md](feedback_controller_testing.md) — Use ControllerTestTrait (not raw new) for CI4 controller tests; withBody trait collision resolution; TypeError handling
- [feedback_ci4_response_codes.md](feedback_ci4_response_codes.md) — failValidationErrors() returns 400 (not 422) in CodeIgniter4
- [feedback_history_controller_bug.md](feedback_history_controller_bug.md) — History::_getData() has return type mismatch causing TypeError in PHP 8.3; tests must use expectException
- [feedback_ci4_model_mocking.md](feedback_ci4_model_mocking.md) — CI4 Model fluent methods are __call magic; use getMockBuilder without onlyMethods, stub __call to return self, only stub findAll/first
- [feedback_weather_entity_cast.md](feedback_weather_entity_cast.md) — DailyAveragesModel/HourlyAveragesModel return WeatherDataEntity; use toRawArray() not (array) cast to get column-name keys
- [feedback_throttle_filter_testing.md](feedback_throttle_filter_testing.md) — CI4 shared throttler holds old cache ref; inject fresh throttler with Services::injectMock() in setUp() to reset rate limit between tests
- [feedback_smart_quotes_in_php_files.md](feedback_smart_quotes_in_php_files.md) — Edit tool can introduce Unicode smart quotes in PHP config files causing "Undefined constant" errors; verify with python3 hex check and use bash heredoc to fix
- [feedback_phpunit_mock_return_types.md](feedback_phpunit_mock_return_types.md) — willReturnCallback closures must declare and return the correct type when the mocked method has a PHP 8 return type declaration
