---
name: Open-Meteo API response shape and quirks
description: Verified real-response shape for api.open-meteo.com (weather) and air-quality-api.open-meteo.com (air quality) — used by App\Libraries\OpenMeteoAPILibrary
type: reference
---

Verified 2026-07-12 by curling both hosts directly with the project's configured coordinates (lat=51.70952, lon=55.26690).

**Two separate hosts, no API key for either:**
- `https://api.open-meteo.com/v1/forecast` — general weather (temperature, wind, clouds, solar radiation, etc.)
- `https://air-quality-api.open-meteo.com/v1/air-quality` — PM2.5, PM10, CO, NO2, SO2, O3

**`current=` shape:** `{"current": {"time": "2026-07-12T05:30", "temperature_2m": 24.6, ...}}` — flat object, one value per requested variable.

**`hourly=` shape is columnar (structure-of-arrays), NOT row-based:** `{"hourly": {"time": ["2026-07-12T00:00", "2026-07-12T01:00", ...], "temperature_2m": [20.0, 19.5, ...], ...}}`. Every variable is a separate parallel array indexed the same way as `time`. This is different from WeatherAPI/OpenWeatherMap, which return one object per hour. `OpenMeteoAPILibrary::_zipHourlyByTime()` converts this into a `time string => [variable => value]` map for per-timestamp lookups.

**Time format is ISO8601 without seconds, NOT unix epoch:** `"2026-07-12T05:30"` (no `:00` seconds, no timezone suffix — timezone is controlled by the `&timezone=UTC` query param). Use `Time::parse($value, 'UTC')`, NOT `Time::createFromTimestamp()` (which the other 3 providers use, since they return unix epoch integers). Verified `Time::parse("2026-07-12T05:30", "UTC")` correctly produces `2026-07-12 05:30:00`.

**`visibility` IS a valid `current=`/`hourly=` variable** (returns meters directly, e.g. `31920.00`) — contrary to initial uncertainty, no need to omit it.

**Air quality forecast horizon is shorter than the general weather forecast horizon.** With `forecast_days` unset (default), the weather `hourly.time` array covers the full ~7 days while the air-quality `hourly.time` array covers fewer hours/days. Any merge-by-time-key logic must treat missing air-quality coverage for later timestamps as expected/normal, not an error.

**Wind speed:** pass `wind_speed_unit=ms` to get `wind_speed_10m`/`wind_gusts_10m` already in m/s — no `kmh_to_ms()` conversion needed (unlike VisualCrossing/WeatherAPI which return km/h).

**WMO weather codes → internal condition ID scale:** see `App\Libraries\OpenMeteoAPILibrary::$conditionMapping` for the full translation table (0→800 Clear sky, 1→801, 2→802, 3→804 Overcast, 45/48→741 Fog, 51-57→3xx Drizzle, 61-67→5xx Rain, 71-77→6xx Snow, 80-86→5xx/6xx showers, 95-99→2xx Thunderstorm). Unmapped codes return `null`.
