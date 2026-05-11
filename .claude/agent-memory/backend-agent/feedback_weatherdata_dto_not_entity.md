---
name: WeatherData is a plain DTO, not a CI4 Entity
description: WeatherData must stay as a plain PHP class; it cannot extend CodeIgniter\Entity\Entity
type: feedback
---

`App\Entities\WeatherData` is intentionally a plain PHP DTO, NOT a CI4 Entity. It is populated from raw aggregation arrays (`getResultArray` / `getRowArray`) that come from multiple models with different schemas. It is used exclusively for outbound JSON / text serialisation.

**Why:** Converting it to a CI4 Entity would break all callers (Current, Forecast, Heatmap, History controllers) because they all use `new WeatherData($arrayData)` with a custom constructor, and the data arrays are not backed by any single model's `returnType`.

**How to apply:** Do not add `extends Entity` to `WeatherData.php`. Keep it as a plain class with typed public properties and a constructor. Callers continue using `new WeatherData($data)`. The private method must use the `_` prefix convention (`_toCamelCase`).
