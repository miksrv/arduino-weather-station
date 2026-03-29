---
name: WeatherDataEntity cast pattern
description: DailyAveragesModel and HourlyAveragesModel return WeatherDataEntity objects — (array) cast produces mangled protected property keys, not column names. Use toRawArray() instead.
type: feedback
---

`DailyAveragesModel` and `HourlyAveragesModel` both set `$returnType = WeatherDataEntity::class`. When a row is returned, it is a CI4 `Entity` object — NOT a plain array.

**The problem:** `(array) $entity` produces an array with mangled protected property keys like `"\0*\0attributes"`, `"\0*\0dates"`, etc. Accessing `$arr['temperature']` returns `undefined` (null/fallback), silently breaking all threshold checks.

**The fix:** Check for Entity type and call `toRawArray()`:
```php
$rowArr = $row instanceof \CodeIgniter\Entity\Entity
    ? $row->toRawArray()
    : (is_array($row) ? $row : (array) $row);
```

`toRawArray()` returns snake_case column keys: `temperature`, `dew_point`, `wind_speed`, `uv_index`, etc.
`toArray()` returns the datamap-translated camelCase keys: `dewPoint`, `windSpeed`, `uvIndex`.

Always use `toRawArray()` when the downstream code expects column-name keys (e.g. passing to AnomalyDetector).

**Why:** This caused `BackfillAnomalyLog` to detect 0 anomalies on first attempt. `DetectAnomalies.php` has the same latent bug but it was not caught because it also silently returns null/fallback values for all checks.

**How to apply:** Any time you iterate `DailyAveragesModel::findAll()` or `HourlyAveragesModel::findAll()` and need to work with raw column values, use `toRawArray()` — never `(array) $entity`.

**Additional gotcha — `date` column after `toRawArray()`:** Even after `toRawArray()`, the `date` key is NOT a plain string. The entity's cast `'date' => 'datetime'` means the value is a `CodeIgniter\I18n\Time` object (which extends `DateTimeImmutable`, NOT `DateTime`). So `instanceof \DateTime` checks fail on it. Always use `instanceof \DateTimeInterface` when checking if a date field is a date object. `(string) $timeObject` calls `Time::__toString()` → `'YYYY-MM-DD HH:MM:SS'`, so `substr(..., 0, 10)` still works for date extraction.
