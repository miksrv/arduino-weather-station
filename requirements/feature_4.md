# Feature 4: Precipitation Calendar

## Overview

A **Precipitation Calendar** page that visualises daily rainfall totals in a GitHub-style contribution heatmap — one cell per day, coloured by rainfall intensity. The user can navigate by year and see at a glance which months and seasons were wet or dry, track multi-day rain streaks and drought spells, and compare totals across years.

The station already records `precipitation` at every measurement interval. This feature aggregates it into daily totals and presents the full temporal pattern in a compact, scannable format.

---

## Motivation

- Precipitation is the parameter with the strongest seasonal and inter-annual variation, but it is poorly represented in the existing UI (only visible as a tiny line on the History page).
- A calendar view communicates patterns — monsoon seasons, summer dryness, autumn wetness — that no time-series chart can convey at multi-year scale.
- "Wet streak" and "dry streak" statistics are immediately useful for gardeners, farmers, and anyone who cares about water.
- The GitHub contribution grid is an instantly understood metaphor requiring no explanation.

---

## Scope

### New API Endpoint

**`GET /precipitation`**

Returns daily precipitation totals and derived statistics for a given year.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `year` | integer | current year | Year to return data for |

#### Response Shape

```json
{
  "year": 2024,
  "days": [
    { "date": "2024-01-01", "total": 0.0 },
    { "date": "2024-01-02", "total": 2.3 },
    { "date": "2024-01-03", "total": 14.7 },
    ...
  ],
  "stats": {
    "totalYear":       412.5,
    "rainyDays":       87,
    "dryDays":         279,
    "maxDailyTotal":   { "value": 38.4, "date": "2024-05-19" },
    "longestWetStreak":  { "days": 9,  "start": "2024-09-04", "end": "2024-09-12" },
    "longestDryStreak":  { "days": 31, "start": "2024-07-01", "end": "2024-07-31" },
    "monthlyTotals": [
      { "month": 1, "total": 18.2 },
      { "month": 2, "total": 9.1 },
      ...
    ]
  },
  "availableYears": [2022, 2023, 2024, 2025, 2026]
}
```

A "rainy day" is any day with `total > 0.1 mm`.

---

## Backend Requirements

### Controller: `Precipitation` (`server/app/Controllers/Precipitation.php`)

- Extends `ResourceController`.
- `index()` → `GET /precipitation`.
- Validates `year` (must be between 2020 and current year).
- Delegates to `PrecipitationModel`.

### Model: `PrecipitationModel` (`server/app/Models/PrecipitationModel.php`)

Data source: `daily_averages` table (has one row per day after aggregation).

Key queries:

```sql
-- Daily totals for a year
SELECT DATE(date) AS day, SUM(precipitation) AS total
FROM daily_averages
WHERE YEAR(date) = ?
GROUP BY DATE(date)
ORDER BY day;

-- Available years
SELECT DISTINCT YEAR(date) AS yr FROM daily_averages ORDER BY yr;
```

Streak computation is done in PHP after fetching the daily array (not in SQL):

```php
private function _computeStreaks(array $days): array {
    // Iterate sorted days, track current wet/dry run length and best
}
```

Methods:
- `getDailyTotals(int $year): array`
- `getAvailableYears(): array`
- `getStats(int $year, array $dailyTotals): array` — computes all stat fields from the daily array.

### Route

```php
$routes->get('precipitation', 'Precipitation::index');
```

### PHPUnit Tests (`server/tests/unit/PrecipitationModelTest.php`)

- Streak detection: known sequence of wet/dry days → verify correct streak lengths.
- Monthly totals: verify sum matches sum of daily totals for that month.
- Rainy day threshold: 0.1 mm boundary.

---

## Frontend Requirements

### New Page: `/precipitation` (`client/pages/precipitation.tsx`)

Layout:

```
[Page Header: "Precipitation Calendar"]
[Year Selector — buttons for each available year]

┌──────────────────────────────────────────────────────┐
│  2024  [← Prev]                            [Next →]  │
│                                                      │
│  Jan  [■■□□■■■□□□□...]                              │
│  Feb  [□□□□□□■□□□□...]                              │
│  ...                                                 │
│  Dec  [■■■□□□□□□□□...]                              │
│                                                      │
│  Legend: □ Dry  ░ < 1mm  ▒ 1–5mm  ▓ 5–20mm  █ 20+mm │
└──────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌────────────────┐
│ Total 2024   │  │ Rainy days   │  │ Driest stretch │
│ 412.5 mm     │  │ 87 days      │  │ 31 days dry    │
│              │  │ (24%)        │  │ Jul 1 – Jul 31 │
└──────────────┘  └──────────────┘  └────────────────┘

┌──────────────────────────────────────────────────────┐
│  MONTHLY TOTALS                                      │
│  [ECharts vertical bar chart, 12 bars]               │
└──────────────────────────────────────────────────────┘
```

### New Component: `WidgetPrecipCalendar` (`client/components/widget-precip-calendar/`)

- Renders a 12×(28–31) grid of cells.
- Rows = months (Jan–Dec), columns = days.
- Cell colour scale (5 levels):
  - White / transparent: no data or 0 mm
  - Level 1 (lightest blue): > 0 and ≤ 1 mm
  - Level 2: 1–5 mm
  - Level 3: 5–20 mm
  - Level 4 (darkest blue): > 20 mm
- Tooltip on hover: date + total mm.
- Month labels on the left, day-of-month numbers optional (hidden on mobile).
- Fully responsive.

### New Component: `WidgetStreakCard` (`client/components/widget-streak-card/`)

Reusable card showing:
- Streak type icon (raindrop or sun)
- Number of consecutive days
- Date range of the streak
- Used for both wet streak and dry streak.

### New RTK Query Endpoint (`client/api/endpoints/Precipitation.ts`)

```typescript
interface PrecipDay {
  date: string
  total: number
}

interface PrecipStats {
  totalYear: number
  rainyDays: number
  dryDays: number
  maxDailyTotal: { value: number; date: string }
  longestWetStreak: { days: number; start: string; end: string }
  longestDryStreak: { days: number; start: string; end: string }
  monthlyTotals: Array<{ month: number; total: number }>
}

interface PrecipitationResponse {
  year: number
  days: PrecipDay[]
  stats: PrecipStats
  availableYears: number[]
}

interface PrecipitationRequest {
  year: number
}
```

### Navigation

Add "Precipitation" to the main navigation menu (raindrop icon).

---

## i18n Requirements

```json
"precipitation-calendar": "Precipitation Calendar",
"rainy-days": "Rainy days",
"dry-days": "Dry days",
"total-precipitation": "Total precipitation",
"longest-wet-streak": "Longest wet streak",
"longest-dry-streak": "Longest dry streak",
"max-daily-rain": "Maximum daily rainfall",
"days-count": "{{count}} days",
"monthly-totals": "Monthly totals",
"precip-level-trace": "Trace (< 1 mm)",
"precip-level-light": "Light (1–5 mm)",
"precip-level-moderate": "Moderate (5–20 mm)",
"precip-level-heavy": "Heavy (20+ mm)",
"precipitation-page-description": "Annual rainfall calendar and statistics for {{location}} — daily totals, wet/dry streaks, and monthly breakdown"
```

---

## Acceptance Criteria

1. The calendar grid renders correctly for all 12 months with correct day counts (including leap years).
2. Cell colour levels match the defined thresholds.
3. Hovering a cell shows the date and total mm.
4. Year navigation updates all stats and the chart.
5. Streak computation correctly identifies runs of wet/dry days across month boundaries.
6. PHPUnit tests cover streak edge cases (single-day streaks, year-end rollovers).
7. Both `en` and `ru` translations present.
