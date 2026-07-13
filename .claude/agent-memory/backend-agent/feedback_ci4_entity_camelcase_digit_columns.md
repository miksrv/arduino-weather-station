---
name: CI4 Entity camelCase access requires explicit datamap for columns with embedded digits
description: Entity::mapProperty() does NOT auto-convert camelCase<->snake_case — it only looks up exact keys in $datamap. Columns like pm2_5 need an explicit datamap entry (e.g. pm25 => pm2_5) to be reachable via a camelCase-style property name.
type: feedback
---

CodeIgniter 4's `Entity::mapProperty($key)` (system/Entity/Entity.php) does a literal `array_key_exists($key, $this->datamap)` lookup — there is no automatic camelCase-to-snake_case string transformation happening anywhere in `__get`/`__set`/`fill()`. Every existing camelCase alias in `WeatherDataEntity` (`feelsLike`, `dewPoint`, `windSpeed`, etc.) only works because it has an explicit entry in `$datamap`.

This matters for columns with embedded digits, like `pm2_5`: there's no way to derive a "natural" camelCase form the way you would for `dew_point` → `dewPoint`. We chose `pm25` (stripping the underscore) as the convention and added `'pm25' => 'pm2_5'` to `$datamap`. Verified by test: `$entity->fill(['pm25' => 12.3]); $entity->pm2_5 === 12.3` and `$entity->pm25 === 9.4` both work once the datamap entry exists.

Columns without underscores (`pm10`, `co`, `no2`, `so2`, `o3`) don't need a datamap entry — snake_case and "camelCase" are identical for single-word/already-alphanumeric names, so direct property access already works.

**Why:** Needed for the OpenMeteo air-quality columns added 2026-07-12 (see `App\Entities\WeatherDataEntity`).

**How to apply:** Any time a new DB column name contains a digit adjacent to an underscore (`pm2_5`, `co2_e`, etc.) and you want a camelCase-style accessor, add an explicit `$datamap` entry rather than assuming CI4 will derive it — it won't.
