# Feature 1: Weather Records & All-Time Extremes

## Overview

A dedicated **Records** page that surfaces all-time and monthly record values across every measured parameter. The station has been collecting data since 2022; this feature turns that history into a living trophy board — showing what the most extreme conditions ever recorded were, when they happened, and how close today's readings are to breaking those records.

This is a compelling "first stop" for visitors who want to understand the range and character of the local climate at a glance.

---

## Motivation

- The station accumulates years of high-resolution data that is currently accessible only through the History or Climate pages, which require the user to manually search.
- Record values (coldest night, highest wind gust, driest month, etc.) are inherently interesting and give context to current readings.
- "Records almost broken today" is a natural hook that encourages users to visit during notable weather events.

---

## Scope

### New API Endpoint

**`GET /records`**

Returns all-time and per-month records for each sensor parameter.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | `all` \| `month` \| `year` | `all` | Scope of record lookup |
| `month` | integer (1–12) | current month | Used when `period=month` |
| `year` | integer | current year | Used when `period=year` |

#### Response Shape

```json
{
  "temperature": {
    "max": { "value": 41.3, "date": "2023-07-28T15:20:00Z" },
    "min": { "value": -31.7, "date": "2024-01-14T05:00:00Z" }
  },
  "pressure": {
    "max": { "value": 775, "date": "2022-12-03T09:00:00Z" },
    "min": { "value": 726, "date": "2023-03-15T18:30:00Z" }
  },
  "humidity": {
    "max": { "value": 100, "date": "2023-09-12T06:00:00Z" },
    "min": { "value": 8,   "date": "2024-06-20T14:00:00Z" }
  },
  "wind_speed": {
    "max": { "value": 22.5, "date": "2023-11-02T21:10:00Z" }
  },
  "wind_gust": {
    "max": { "value": 31.0, "date": "2023-11-02T21:10:00Z" }
  },
  "precipitation": {
    "max_daily":   { "value": 38.4, "date": "2023-05-19" },
    "max_monthly": { "value": 94.1, "month": "2023-05" }
  },
  "uv_index": {
    "max": { "value": 9, "date": "2024-07-04T12:00:00Z" }
  },
  "sol_radiation": {
    "max": { "value": 1140.2, "date": "2024-06-21T13:00:00Z" }
  },
  "dew_point": {
    "max": { "value": 24.1, "date": "2023-07-30T09:00:00Z" },
    "min": { "value": -38.0, "date": "2024-01-14T05:00:00Z" }
  }
}
```

---

## Backend Requirements

### Controller: `Records` (`server/app/Controllers/Records.php`)

- Extends `ResourceController`.
- Method `index()` — handles `GET /records`.
- Accepts and validates `period`, `month`, `year` query parameters.
- Delegates all DB work to `RecordsModel`.
- Returns JSON via `$this->respond()`.

### Model: `RecordsModel` (`server/app/Models/RecordsModel.php`)

Queries **`daily_averages`** for most parameters (fast, pre-aggregated).
For `precipitation.max_daily` use `daily_averages`; for `precipitation.max_monthly` group by month.
For temperature precision (e.g., absolute minimum) optionally fall back to `hourly_averages`.

Methods:
- `getAllTimeRecords(): array` — runs `SELECT MAX / MIN` over the entire table for each parameter.
- `getMonthlyRecords(int $month): array` — same but filtered by `MONTH(date) = ?`.
- `getYearlyRecords(int $year): array` — filtered by `YEAR(date) = ?`.

Each record row must include the `date` of occurrence via a correlated sub-query or `JOIN`.

### Route

Add to `server/app/Config/Routes.php`:

```php
$routes->get('records', 'Records::index');
```

### PHPUnit Tests (`server/tests/unit/RecordsModelTest.php`)

- Test that all-time records return the correct extreme values against fixture data.
- Test month filtering.
- Test that the response includes a `date` alongside every record value.

---

## Frontend Requirements

### New Page: `/records` (`client/pages/records.tsx`)

Layout and structure:

```
[Page Header: "Weather Records"]
[Period Selector: All Time | This Month | This Year | Custom Month]

[Grid of Record Cards — grouped by category]

Category: Temperature
  ┌─────────────────┐  ┌─────────────────┐
  │  ▲ Max ever     │  │  ▼ Min ever     │
  │  41.3 °C        │  │  −31.7 °C       │
  │  28 Jul 2023    │  │  14 Jan 2024    │
  └─────────────────┘  └─────────────────┘

Category: Wind
  ┌─────────────────┐  ┌─────────────────┐
  │  ▲ Max speed    │  │  ▲ Max gust     │
  │  22.5 m/s       │  │  31.0 m/s       │
  │  02 Nov 2023    │  │  02 Nov 2023    │
  └─────────────────┘  └─────────────────┘

... (Pressure, Humidity, Precipitation, UV, Solar)

[Footer note: "Records computed from data since January 2022"]
```

### New RTK Query Endpoint (`client/api/endpoints/Records.ts`)

```typescript
interface RecordValue {
  value: number
  date: string
}

interface Records {
  temperature: { max: RecordValue; min: RecordValue }
  pressure:    { max: RecordValue; min: RecordValue }
  humidity:    { max: RecordValue; min: RecordValue }
  windSpeed:   { max: RecordValue }
  windGust:    { max: RecordValue }
  uvIndex:     { max: RecordValue }
  solRadiation:{ max: RecordValue }
  dewPoint:    { max: RecordValue; min: RecordValue }
  precipitation: {
    maxDaily:   RecordValue
    maxMonthly: { value: number; month: string }
  }
}

// Query params
interface RecordsRequest {
  period?: 'all' | 'month' | 'year'
  month?: number
  year?: number
}
```

### New Component: `WidgetRecord` (`client/components/widget-record/`)

Props:
- `label: string` — translated label (e.g., "Maximum temperature")
- `value: number`
- `unit: string`
- `date: string`
- `type: 'max' | 'min'` — controls arrow icon color (red for max, blue for min)

Displays:
- Icon (▲ red or ▼ blue)
- Value + unit (large, bold)
- Date (small, formatted per locale)

### Navigation

Add "Records" to the main navigation menu (`client/components/app-bar/` and locale files).

---

## i18n Requirements

Add to both `client/public/locales/en/common.json` and `client/public/locales/ru/common.json`:

```json
"records": "Records",
"weather-records": "Weather Records",
"all-time-records": "All-time Records",
"records-since": "Records compiled from data since {{year}}",
"record-max-temperature": "Maximum temperature",
"record-min-temperature": "Minimum temperature",
"record-max-pressure": "Maximum pressure",
"record-min-pressure": "Minimum pressure",
"record-max-humidity": "Maximum humidity",
"record-min-humidity": "Minimum humidity",
"record-max-wind-speed": "Maximum wind speed",
"record-max-wind-gust": "Maximum wind gust",
"record-max-uv": "Maximum UV index",
"record-max-solar": "Maximum solar radiation",
"record-max-dew-point": "Maximum dew point",
"record-min-dew-point": "Minimum dew point",
"record-max-daily-precip": "Maximum daily precipitation",
"record-max-monthly-precip": "Maximum monthly precipitation",
"period-all-time": "All time",
"period-this-month": "This month",
"period-this-year": "This year",
"records-page-description": "All-time weather records for {{location}} — extremes in temperature, wind, precipitation, and more"
```

---

## Acceptance Criteria

1. The `/records` page loads and displays all-time records for all parameters.
2. Switching period to "This Month" narrows records to the current calendar month.
3. Each record card shows the value, unit, and the exact date it was recorded.
4. All strings are translated in both `en` and `ru` locales.
5. The new RTK Query endpoint is covered by at least one integration test.
6. The `RecordsModel` has PHPUnit tests for correctness of extreme-value queries.
