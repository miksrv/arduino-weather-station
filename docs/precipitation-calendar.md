# Precipitation Calendar

## Overview

The **Precipitation Calendar** (`/precipitation`) is a full-year rainfall visualisation page. It displays daily precipitation totals in a compact GitHub-style contribution grid — one cell per day, coloured by rainfall intensity — so you can see seasonal patterns, dry spells, and wet periods at a glance across any recorded year.

The page also surfaces three key statistics and a monthly bar chart, giving a complete picture of the year's precipitation without any need to hunt through raw data tables.

---

## Navigating the Page

### Year Selector

At the top of the page, a row of buttons shows every year for which the station has data. Click any year to reload the calendar and all statistics for that year. The current year is selected by default.

### Calendar Grid

```
      1  2  3  4  5  6  7  8 … 31
Jan  [■][■][□][□][░][■][■][□]…
Feb  [□][□][□][□][□][□][░][□]…
…
Dec  [■][▒][▒][□][□][□][□][□]…
```

- **Rows** — one per month (January at the top, December at the bottom).
- **Columns** — one per calendar day (1–31). Days that don't exist in a given month (e.g. 30 and 31 in February) are shown as empty placeholders.
- **Day-of-month numbers** are displayed as column headers on desktop; they are hidden on mobile to save space.

#### Cell Colour Scale

| Colour | Meaning |
|--------|---------|
| Grey (neutral) | No data recorded for this day |
| Lightest blue | Trace — more than 0 mm and up to 1 mm |
| Light blue | Light rain — more than 1 mm and up to 5 mm |
| Medium blue | Moderate rain — more than 5 mm and up to 20 mm |
| Dark blue | Heavy rain — more than 20 mm |

A **legend** below the grid labels each colour level.

#### Tooltip

Hover over any cell to see the exact date and the daily total in millimetres.

---

## Statistics Cards

Three summary cards appear below the calendar.

| Card | What it shows |
|------|---------------|
| **Total precipitation** | Accumulated rainfall for the selected year in mm |
| **Rainy days** | Number of days with more than 0.1 mm of rain, plus the percentage of the year |
| **Longest dry stretch** | The longest unbroken sequence of days with no measurable rain — shown with the start and end dates |

> **Note:** A "rainy day" is defined as any day with a recorded total **greater than 0.1 mm**. Days with trace amounts of 0.1 mm or less count as dry for reporting purposes but do break the dry streak (see below).

---

## Monthly Totals Chart

A vertical bar chart at the bottom of the page shows precipitation totals for each of the 12 calendar months. Month labels automatically follow the active display language (English or Russian). Hovering a bar shows the month name and the total in mm.

---

## How Streaks Are Calculated

Both the wet streak and the dry streak scan every calendar day of the selected year — including days with no station data, which are treated as 0 mm.

- **Wet streak** — the longest consecutive run of days where the daily total is **greater than 0 mm** (any measurable precipitation).
- **Dry streak** — the longest consecutive run of days where the daily total is **exactly 0 mm**. Even a trace of 0.1 mm resets the dry streak counter.

Streaks cross month boundaries naturally. The station reports only the longest streak found; shorter streaks during the year are not listed separately.

> For the current year, only days up to and including today are considered — future dates are not counted as dry days.

---

## Interpreting the Data

**Seasonal patterns are immediately visible.** In the Orenburg region, winters typically show sparse blue cells (frozen precipitation is not always captured by the rain gauge), spring brings a cluster of moderate rainfall, and summer is characterised by alternating wet and dry periods.

**Long dry stretches in summer** (July–August) are normal for the continental climate of the southern Urals and typically span 3–5 weeks. Stretches exceeding 40 days are historically unusual and may indicate drought conditions.

**Heavy rainfall events** (dark blue cells, > 20 mm) are most common in May–June when convective thunderstorms are most frequent.

---

## Frequently Asked Questions

**Why does the total precipitation differ from official meteorological reports?**

The station's rain gauge measures precipitation at the installation point only, while official totals are station-averaged over a wider area. Micro-topographic effects, wind, and evaporation from the gauge funnel can all introduce differences of 10–20 % compared with regional averages.

**Why are some winter days shown as grey (no data)?**

Snow and ice can block the rain gauge funnel. The station records 0 mm during blockage periods, which are omitted from the grid to distinguish "no data" from "confirmed dry day." Snow water equivalent is tracked separately on the [Anomaly Monitor](./anomaly-monitor.md) page using a temperature-index model.

**Why does the calendar show fewer rainy days than I remember?**

Only days with a recorded total **above 0.1 mm** count as rainy. Very light drizzle or dew condensation may register below this threshold.

---

---

## Developer Reference

### API Endpoint

**`GET /precipitation`**

| Parameter | Type | Default | Constraint |
|-----------|------|---------|------------|
| `year` | integer | current year | 2020 – current year |

#### Response shape

```json
{
  "year": 2025,
  "days": [
    { "date": "2025-01-01", "total": 0.0 },
    { "date": "2025-01-14", "total": 3.2 }
  ],
  "stats": {
    "totalYear": 312.4,
    "rainyDays": 74,
    "dryDays": 291,
    "maxDailyTotal": { "value": 22.1, "date": "2025-05-18" },
    "longestWetStreak":  { "days": 7,  "start": "2025-04-03", "end": "2025-04-09" },
    "longestDryStreak":  { "days": 38, "start": "2025-07-04", "end": "2025-08-10" },
    "monthlyTotals": [
      { "month": 1, "total": 14.2 },
      { "month": 2, "total": 8.7 }
    ]
  },
  "availableYears": [2022, 2023, 2024, 2025]
}
```

`days` contains **only days with recorded precipitation** (`total > 0`). Days absent from the array had no measurable rain. The frontend fills in the full calendar grid by treating absent dates as 0 mm.

`stats` is computed entirely in PHP from the `days` array — no extra database queries are made.

### Precipitation Aggregation

Daily totals are computed from `raw_weather_data` using a two-level query to avoid inflating values when multiple external API sources report data for the same time period:

```sql
-- Step 1: average all source readings within each calendar hour
SELECT DATE(date) AS day,
       DATE_FORMAT(date, '%Y-%m-%d %H:00:00') AS hour_slot,
       AVG(precipitation) AS hour_avg
FROM raw_weather_data
WHERE YEAR(date) = ?
  AND precipitation IS NOT NULL AND precipitation > 0
GROUP BY day, hour_slot

-- Step 2: sum hourly averages to get the daily total
SELECT day, ROUND(SUM(hour_avg), 1) AS total
FROM ( … ) AS hourly
GROUP BY day ORDER BY day
```

The inner `AVG` collapses multiple sources (OpenWeatherMap, WeatherAPI, VisualCrossing, CustomStation) that each report the same physical rain event. The outer `SUM` then accumulates those hourly values into a correct daily total.

### Streak Algorithm

`PrecipitationModel::getStats()` expands the sparse `days` array into a **complete calendar** (every day from `{year}-01-01` to `min({year}-12-31, today)`) before running streak detection. Missing days are inserted with `total = 0.0`. This ensures that long dry periods with no recorded measurements are counted correctly.

`_computeStreaks()` then performs a single linear pass over the sorted calendar:
- **Wet threshold:** `total > 0.0` — any measurable precipitation.
- **Dry threshold:** `total === 0.0` — trace amounts (≤ 0.1 mm) also count as wet for streak purposes, so they break a dry streak.
- The `rainyDays` / `dryDays` counters in `getStats()` use the stricter `> 0.1 mm` threshold, matching the user-facing definition of a "rainy day."

### Frontend Components

| Component | Path | Purpose |
|-----------|------|---------|
| `WidgetPrecipCalendar` | `client/components/widget-precip-calendar/` | 12 × 31 CSS Grid calendar with colour-coded cells and hover tooltip |
| `WidgetPrecipChart` | `client/components/widget-precip-chart/` | ECharts bar chart for 12 monthly totals; reads locale from `i18n.language` |
| `WidgetPrecipStatCard` | `client/components/widget-precip-stat-card/` | Generic stat display card (title + value + optional sub-label) |
| `WidgetStreakCard` | `client/components/widget-streak-card/` | Wet or dry streak card with icon, day count, and date range |

The page (`client/pages/precipitation.tsx`) fetches data via RTK Query (`API.useGetPrecipitationQuery({ year })`). All widgets receive a `loading` prop and render a `Skeleton` placeholder while the request is in flight, so the page layout never collapses during navigation.

Month labels in both the calendar grid and the bar chart are generated at runtime using `toLocaleString(i18n.language, { month: 'short' })`, so they automatically switch between English and Russian without any i18n key lookups.
