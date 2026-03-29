# Feature 3: Wind Rose & Wind Analysis

## Overview

A dedicated **Wind** page providing a full statistical breakdown of wind behavior at the station's location. The centrepiece is an interactive **wind rose diagram** — a polar chart showing the frequency and speed distribution of wind across 16 compass sectors. Alongside it, the page presents speed distribution histograms, calm-day statistics, and strongest recorded gusts — giving a complete picture of the local wind climate.

Wind data is one of the richest datasets the station records (`wind_speed`, `wind_deg`, `wind_gust`) and is currently under-represented: it only appears as a single value on the Sensors page.

---

## Motivation

- The station records wind direction and speed at every 10-minute interval, making multi-year directional analysis possible.
- Wind rose diagrams are standard in meteorology but absent from most DIY stations.
- Understanding prevailing wind direction is practically useful for the observatory (dome orientation, tube currents) and for local residents.
- Gust frequency analysis helps identify storm patterns.

---

## Scope

### New API Endpoint

**`GET /wind`**

Returns aggregated wind statistics for a configurable time range.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `start_date` | date string | 30 days ago | Range start (ISO date) |
| `end_date` | date string | today | Range end (ISO date) |
| `source` | `station` \| `all` | `all` | Filter by data source |

#### Response Shape

```json
{
  "rose": [
    { "direction": "N",   "sector": 0,   "calm": false, "frequency": 8.2,  "speeds": { "0-3": 3.1, "3-6": 3.5, "6-10": 1.2, "10+": 0.4 } },
    { "direction": "NNE", "sector": 22,  "calm": false, "frequency": 5.1,  "speeds": { "0-3": 2.0, "3-6": 2.0, "6-10": 0.8, "10+": 0.3 } },
    ...
    { "direction": "NNW", "sector": 337, "calm": false, "frequency": 6.7,  "speeds": { ... } }
  ],
  "calmPercent": 4.3,
  "stats": {
    "avgSpeed":      3.8,
    "maxSpeed":      { "value": 22.5, "date": "2023-11-02T21:10:00Z" },
    "maxGust":       { "value": 31.0, "date": "2023-11-02T21:10:00Z" },
    "dominantDir":   "SW",
    "dominantDirDeg": 225,
    "calmDays":      12,
    "strongWindDays": 5
  },
  "speedDistribution": [
    { "range": "0–1",   "percent": 4.3 },
    { "range": "1–3",   "percent": 18.2 },
    { "range": "3–6",   "percent": 35.1 },
    { "range": "6–10",  "percent": 27.4 },
    { "range": "10–15", "percent": 11.2 },
    { "range": "15+",   "percent": 3.8 }
  ],
  "monthlyAvgSpeed": [
    { "month": "2024-01", "avgSpeed": 4.2 },
    ...
  ]
}
```

**Wind rose sectors:** 16 directions (N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW). Readings with `wind_speed < 0.5 m/s` are counted as calm.

**Speed bands** (Beaufort-inspired): 0–3, 3–6, 6–10, 10+ m/s — stacked per sector.

---

## Backend Requirements

### Controller: `Wind` (`server/app/Controllers/Wind.php`)

- Extends `ResourceController`.
- `index()` → `GET /wind`.
- Validates `start_date`, `end_date` (same logic as History controller).
- Delegates to `WindModel`.

### Model: `WindModel` (`server/app/Models/WindModel.php`)

Data source selection:
- Range ≤ 7 days → `hourly_averages`
- Range > 7 days → `daily_averages`

For wind rose, `hourly_averages` is always preferred if range ≤ 90 days (more directional resolution); fall back to `daily_averages` for longer ranges.

Key query for wind rose:
```sql
SELECT
  ROUND(wind_deg / 22.5) * 22.5 AS sector_deg,
  COUNT(*) AS count,
  SUM(CASE WHEN wind_speed < 3  THEN 1 ELSE 0 END) AS band_0_3,
  SUM(CASE WHEN wind_speed >= 3  AND wind_speed < 6  THEN 1 ELSE 0 END) AS band_3_6,
  SUM(CASE WHEN wind_speed >= 6  AND wind_speed < 10 THEN 1 ELSE 0 END) AS band_6_10,
  SUM(CASE WHEN wind_speed >= 10 THEN 1 ELSE 0 END) AS band_10_plus
FROM hourly_averages
WHERE date BETWEEN ? AND ?
  AND wind_speed >= 0.5
GROUP BY sector_deg
```

Methods:
- `getWindRose(string $start, string $end): array`
- `getWindStats(string $start, string $end): array`
- `getSpeedDistribution(string $start, string $end): array`
- `getMonthlyAvgSpeed(string $start, string $end): array`

### Route

```php
$routes->get('wind', 'Wind::index');
```

### PHPUnit Tests (`server/tests/unit/WindModelTest.php`)

- Test that calm readings (< 0.5 m/s) are excluded from sector counts but included in `calmPercent`.
- Test that sector degree 360 is collapsed to sector 0 (North).
- Test speed distribution bucket boundaries.

---

## Frontend Requirements

### New Page: `/wind` (`client/pages/wind.tsx`)

Layout:

```
[Page Header: "Wind Analysis"]
[Date Range Picker — default: last 30 days]

┌─────────────────────────────────────────┐
│  WIND ROSE                              │
│  [Polar ECharts chart — 16 sectors,     │
│   stacked color bands per speed range]  │
│  Calm: 4.3%                             │
└─────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Avg Speed    │  │ Max Speed    │  │ Max Gust     │
│ 3.8 m/s      │  │ 22.5 m/s    │  │ 31.0 m/s    │
│              │  │ 02 Nov 2023  │  │ 02 Nov 2023  │
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────────────────────────────────────────┐
│  SPEED DISTRIBUTION                              │
│  [Horizontal bar chart — 6 speed ranges]         │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  MONTHLY AVERAGE WIND SPEED                      │
│  [ECharts bar chart — one bar per month]         │
└──────────────────────────────────────────────────┘
```

### New Component: `WidgetWindRose` (`client/components/widget-wind-rose/`)

Implemented using ECharts `radar` or custom polar series.

- 16 axes (compass directions as labels).
- Each axis has stacked bars for 4 speed bands.
- Colors: calm=grey, 0–3=light-blue, 3–6=blue, 6–10=orange, 10+=red.
- Calm percentage displayed below the chart.
- Legend showing speed band colors.
- Responsive: scales with container width.

### New Component: `WidgetSpeedDistribution` (`client/components/widget-speed-distribution/`)

- Horizontal ECharts bar chart.
- X-axis: percentage of observations.
- Y-axis: speed range labels.
- Color gradient from light blue (calm) to dark red (storm).

### New RTK Query Endpoint (`client/api/endpoints/Wind.ts`)

```typescript
interface WindRoseSector {
  direction: string
  sector: number
  frequency: number
  speeds: { '0-3': number; '3-6': number; '6-10': number; '10+': number }
}

interface WindResponse {
  rose: WindRoseSector[]
  calmPercent: number
  stats: {
    avgSpeed: number
    maxSpeed: { value: number; date: string }
    maxGust:  { value: number; date: string }
    dominantDir: string
    dominantDirDeg: number
    calmDays: number
    strongWindDays: number
  }
  speedDistribution: Array<{ range: string; percent: number }>
  monthlyAvgSpeed: Array<{ month: string; avgSpeed: number }>
}

interface WindRequest {
  start_date: string
  end_date: string
}
```

### Navigation

Add "Wind" to the main navigation menu.

---

## i18n Requirements

```json
"wind-analysis": "Wind Analysis",
"wind-rose": "Wind Rose",
"speed-distribution": "Speed Distribution",
"monthly-avg-speed": "Monthly Average Wind Speed",
"calm": "Calm",
"calm-percent": "Calm {{percent}}%",
"dominant-direction": "Dominant direction",
"strong-wind-days": "Strong wind days",
"calm-days": "Calm days",
"speed-band-0-3": "0–3 m/s (Light)",
"speed-band-3-6": "3–6 m/s (Moderate)",
"speed-band-6-10": "6–10 m/s (Fresh)",
"speed-band-10-plus": "10+ m/s (Strong)",
"wind-page-description": "Wind rose and speed statistics for {{location}} — prevailing direction, calm frequency, and gust analysis"
```

---

## Acceptance Criteria

1. The wind rose correctly renders 16 sectors with stacked speed bands.
2. Calm readings (< 0.5 m/s) are excluded from directional sectors and reported as a percentage.
3. Sector 360° is treated as North (0°).
4. Changing the date range updates all charts.
5. The speed distribution chart accounts for 100% of all non-null wind readings.
6. PHPUnit tests cover sector assignment edge cases.
7. Both `en` and `ru` translations present.
