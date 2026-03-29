# Feature 5: Solar Energy Dashboard

## Overview

A dedicated **Solar** page that turns the station's `sol_energy` (MJ/m²) and `sol_radiation` (W/m²) measurements into a practical energy and daylight analysis tool. It shows daily and monthly solar accumulation, identifies peak radiation windows, computes the estimated solar panel output potential, and compares current solar conditions with historical norms.

This feature is unique to stations with pyranometer or estimated solar irradiance data and gives the observatory owner actionable information about power generation, daytime observation windows, and seasonal daylight patterns.

---

## Motivation

- The station already records `sol_energy` and `sol_radiation` at every interval, but these sensors are invisible beyond a single value on the Sensors page.
- Solar radiation directly determines battery charge state for remote/off-grid observatories and sensor systems.
- Peak radiation time predicts optimal solar panel output — useful for sizing future expansions.
- Seasonal solar curves are visually striking and scientifically interesting.

---

## Scope

### New API Endpoint

**`GET /solar`**

Returns daily solar accumulation data and statistics for a configurable period.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `start_date` | date string | 365 days ago | Period start |
| `end_date` | date string | today | Period end |
| `resolution` | `daily` \| `monthly` | `daily` | Grouping granularity |

#### Response Shape

```json
{
  "summary": {
    "totalEnergy":      1842.5,
    "avgDailyEnergy":   5.04,
    "maxDailyEnergy":   { "value": 28.3, "date": "2024-06-21" },
    "maxRadiation":     { "value": 1142.7, "date": "2024-06-21T13:00:00Z" },
    "avgRadiation":     312.4,
    "peakHour":         13,
    "sunnyDays":        187,
    "cloudyDays":       178
  },
  "series": [
    { "date": "2024-01-01", "totalEnergy": 2.1, "maxRadiation": 310.4, "avgRadiation": 88.2 },
    { "date": "2024-01-02", "totalEnergy": 3.4, "maxRadiation": 480.1, "avgRadiation": 140.5 },
    ...
  ],
  "monthlyTotals": [
    { "month": "2024-01", "totalEnergy": 68.2, "avgDailyEnergy": 2.2, "avgRadiation": 110.5 },
    ...
  ],
  "peakHourDistribution": [
    { "hour": 6,  "avgRadiation": 12.3 },
    { "hour": 7,  "avgRadiation": 85.4 },
    ...
    { "hour": 19, "avgRadiation": 5.1 }
  ]
}
```

A "sunny day" is defined as `max_radiation > 400 W/m²` (midday peak above overcast threshold).

---

## Backend Requirements

### Controller: `Solar` (`server/app/Controllers/Solar.php`)

- Extends `ResourceController`.
- `index()` → `GET /solar`.
- Validates `start_date`, `end_date`, `resolution` params.
- Delegates to `SolarModel`.

### Model: `SolarModel` (`server/app/Models/SolarModel.php`)

Data source selection:
- `resolution=daily` → `daily_averages` (sum `sol_energy` per date, MAX `sol_radiation`)
- `resolution=monthly` → `daily_averages` grouped by YEAR+MONTH

Key daily query:
```sql
SELECT
  DATE(date) AS day,
  SUM(sol_energy) AS total_energy,
  MAX(sol_radiation) AS max_radiation,
  AVG(sol_radiation) AS avg_radiation
FROM daily_averages
WHERE date BETWEEN ? AND ?
GROUP BY DATE(date)
ORDER BY day;
```

For `peakHourDistribution`, query `hourly_averages`:
```sql
SELECT
  HOUR(date) AS hr,
  AVG(sol_radiation) AS avg_radiation
FROM hourly_averages
WHERE date BETWEEN ? AND ?
  AND sol_radiation > 0
GROUP BY HOUR(date)
ORDER BY hr;
```

Methods:
- `getDailySeries(string $start, string $end): array`
- `getMonthlySeries(string $start, string $end): array`
- `getPeakHourDistribution(string $start, string $end): array`
- `getSummary(string $start, string $end): array`

### Route

```php
$routes->get('solar', 'Solar::index');
```

### PHPUnit Tests (`server/tests/unit/SolarModelTest.php`)

- Verify `total_energy` is summed (not averaged) per day.
- Verify sunny day threshold logic (> 400 W/m²).
- Verify peak hour distribution excludes night hours (sol_radiation = 0).

---

## Frontend Requirements

### New Page: `/solar` (`client/pages/solar.tsx`)

Layout:

```
[Page Header: "Solar Dashboard"]
[Date Range Picker — default: current year]

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Total energy │  │ Daily avg    │  │ Sunny days   │  │ Peak solar   │
│ 1 842 MJ/m²  │  │ 5.04 MJ/m²  │  │ 187 days     │  │ 1 142 W/m²  │
│              │  │              │  │ (51%)        │  │ 21 Jun 2024  │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

┌──────────────────────────────────────────────────────┐
│  DAILY SOLAR ENERGY                                  │
│  [ECharts bar chart — daily MJ/m² totals]            │
│  [Toggle: Daily / Monthly view]                      │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  PEAK RADIATION BY HOUR (average over selected range)│
│  [ECharts bar chart — 24 hours, 0–24, W/m²]         │
│  Peak hour highlighted in orange                     │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  SOLAR PANEL POTENTIAL (informational estimate)      │
│  Given 1 m² panel at 20% efficiency:                 │
│  ≈ 102 Wh/day average · ≈ 37 kWh/year estimate      │
└──────────────────────────────────────────────────────┘
```

The solar panel estimate is computed on the frontend from `avgDailyEnergy`:
```
daily_wh = avgDailyEnergy * 1000 / 3.6 * panel_efficiency
```
where `panel_efficiency = 0.20` is a frontend constant (not configurable via API).

### New Component: `WidgetSolarEnergy` (`client/components/widget-solar-energy/`)

- ECharts `bar` chart of `total_energy` per day (or month).
- Y-axis: MJ/m².
- Colour gradient: pale yellow for low values, deep amber for high.
- Toggle button to switch daily / monthly grouping (triggers new API request with `resolution=monthly`).

### New Component: `WidgetPeakHour` (`client/components/widget-peak-hour/`)

- ECharts bar chart: average radiation by hour of day (0–23).
- The bar for the peak hour is rendered in a distinct highlight colour.
- X-axis labels: "06:00", "07:00", … (locale-aware).

### New RTK Query Endpoint (`client/api/endpoints/Solar.ts`)

```typescript
interface SolarSeriesItem {
  date: string
  totalEnergy: number
  maxRadiation: number
  avgRadiation: number
}

interface SolarMonthlyItem {
  month: string
  totalEnergy: number
  avgDailyEnergy: number
  avgRadiation: number
}

interface SolarPeakHourItem {
  hour: number
  avgRadiation: number
}

interface SolarSummary {
  totalEnergy: number
  avgDailyEnergy: number
  maxDailyEnergy: { value: number; date: string }
  maxRadiation:   { value: number; date: string }
  avgRadiation: number
  peakHour: number
  sunnyDays: number
  cloudyDays: number
}

interface SolarResponse {
  summary: SolarSummary
  series: SolarSeriesItem[]
  monthlyTotals: SolarMonthlyItem[]
  peakHourDistribution: SolarPeakHourItem[]
}

interface SolarRequest {
  start_date: string
  end_date: string
  resolution?: 'daily' | 'monthly'
}
```

### Navigation

Add "Solar" to the main navigation menu (sun icon).

---

## i18n Requirements

```json
"solar-dashboard": "Solar Dashboard",
"solar-energy": "Solar energy",
"solar-radiation": "Solar radiation",
"total-solar-energy": "Total solar energy",
"avg-daily-solar": "Average daily energy",
"sunny-days": "Sunny days",
"cloudy-days": "Overcast days",
"peak-radiation": "Peak radiation",
"peak-hour": "Peak hour",
"peak-hour-label": "{{hour}}:00",
"radiation-by-hour": "Average radiation by hour",
"daily-solar-energy": "Daily solar energy",
"monthly-solar-energy": "Monthly solar energy",
"panel-estimate-title": "Solar panel potential estimate",
"panel-estimate-body": "A 1 m² panel at 20% efficiency would generate approximately {{daily}} Wh/day ({{yearly}} kWh/year).",
"solar-page-description": "Solar radiation and energy accumulation data for {{location}} — daily totals, peak radiation times, and seasonal patterns"
```

---

## Acceptance Criteria

1. The daily energy chart correctly shows summed `sol_energy` (not averaged) per day.
2. Switching to monthly view aggregates correctly (sum of daily totals per month).
3. The peak hour chart excludes overnight hours (zero radiation).
4. The peak hour is visually highlighted.
5. The panel estimate widget displays a computed estimate based on `avgDailyEnergy`.
6. PHPUnit tests verify that daily totals are sums, not averages.
7. Both `en` and `ru` translations present.
