---
name: CI4 Entity $dates vs $casts redundancy rule
description: Fields in $dates must NOT also appear in $casts; nullable cast variants must be used for nullable columns
type: feedback
---

Fields listed in `$dates` are automatically mutated to `CodeIgniter\I18n\Time` instances by CI4 on read. Adding those same fields to `$casts` with a `'datetime'` cast causes redundant double-processing and should be avoided.

For all nullable DB columns, use nullable cast variants (`'?integer'`, `'?float'`) instead of plain `'integer'` / `'float'`. This preserves NULL values from the database rather than coercing them to 0.

**Why:** Discovered during entity audit (2026-04-27). The original `WeatherDataEntity` and `WeatherForecastEntity` had `date`/`forecast_time` in both `$dates` and `$casts`, and used non-nullable casts for nullable columns.

**How to apply:** When writing or reviewing CI4 Entities:
- Put datetime columns in `$dates` only.
- Use `'?integer'` / `'?float'` for every DB column declared as `NULL`.
- Update any tests that assert the old non-nullable cast values or check `$casts` for date keys.
