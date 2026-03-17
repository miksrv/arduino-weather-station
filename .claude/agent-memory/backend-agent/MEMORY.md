# Backend Agent Memory Index

## Feedback
- [feedback_controller_testing.md](feedback_controller_testing.md) — Use ControllerTestTrait (not raw new) for CI4 controller tests; withBody trait collision resolution; TypeError handling
- [feedback_ci4_response_codes.md](feedback_ci4_response_codes.md) — failValidationErrors() returns 400 (not 422) in CodeIgniter4
- [feedback_history_controller_bug.md](feedback_history_controller_bug.md) — History::_getData() has return type mismatch causing TypeError in PHP 8.3; tests must use expectException
- [feedback_ci4_model_mocking.md](feedback_ci4_model_mocking.md) — CI4 Model fluent methods are __call magic; use getMockBuilder without onlyMethods, stub __call to return self, only stub findAll/first
- [feedback_weather_entity_cast.md](feedback_weather_entity_cast.md) — DailyAveragesModel/HourlyAveragesModel return WeatherDataEntity; use toRawArray() not (array) cast to get column-name keys
