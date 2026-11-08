# Precipitation Calendar

## Overview

The **Precipitation Calendar** (`/precipitation`) is a full-year rainfall visualisation page. It displays daily precipitation totals in a compact GitHub-style contribution grid — one cell per day, coloured by rainfall intensity — so you can see seasonal patterns, dry spells, and wet periods at a glance across any recorded year.

The page also surfaces four summary cards and a monthly bar chart, giving a complete picture of the year's precipitation without any need to hunt through raw data tables.

---

## Navigating the Page

### Year Selector

At the top of the page, a row of buttons shows every year for which the station has precipitation data. Click any year to reload the calendar and all statistics for that year. The current year is selected by default.

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
| Neutral (surface) | Dry day (0 mm) or no data — the grid does not tell the two apart |
| Lightest blue | Trace — more than 0 mm and up to 1 mm |
| Light blue | Light rain — more than 1 mm and up to 5 mm |
| Medium blue | Moderate rain — more than 5 mm and up to 20 mm |
| Dark blue | Heavy rain — more than 20 mm |

A **legend** below the grid labels each colour level.

#### Tooltip

Hover over any cell to see the exact date and the daily total in millimetres.

---

## Statistics Cards

Four summary cards appear below the calendar.

| Card | What it shows |
|------|---------------|
| **Total precipitation** | Accumulated precipitation for the selected year in mm |
| **Rainy days** | Number of days with more than 0.1 mm, plus their share of the observed days |
| **Longest dry stretch** | The longest unbroken sequence of days without a rainy day — shown with the start and end dates |
| **Longest wet stretch** | The longest unbroken sequence of rainy days — shown with the start and end dates |

> **Note:** A "rainy day" is defined as any day with a recorded total **greater than 0.1 mm**. Days with 0.1 mm or less count as dry — for the counters and for the streaks alike.

---

## Monthly Totals Chart

A vertical bar chart at the bottom of the page shows precipitation totals for each of the 12 calendar months. Month labels automatically follow the active display language (English or Russian). Hovering a bar shows the month name and the total in mm.

---

## How Streaks Are Calculated

Both streaks scan the **observed** days of the selected year — days with a `daily_averages` row whose precipitation is known. A day without data is neither wet nor dry: it is left out, and it ends any streak running through it.

- **Wet streak** — the longest consecutive run of days where the daily total is **greater than 0.1 mm**.
- **Dry streak** — the longest consecutive run of days where the daily total is **0.1 mm or less**.

Streaks cross month boundaries naturally. Only the longest streak of each kind is reported; shorter streaks during the year are not listed separately.

> For the current year, only days up to and including today are considered — future dates are not counted as dry days.

---

## Interpreting the Data

**Seasonal patterns are immediately visible.** In the Orenburg region, winters typically show sparse blue cells, spring brings a cluster of moderate rainfall, and summer is characterised by alternating wet and dry periods.

**Long dry stretches in summer** (July–August) are normal for the continental climate of the southern Urals and typically span 3–5 weeks. Stretches exceeding 40 days are historically unusual and may indicate drought conditions.

**Heavy rainfall events** (dark blue cells, > 20 mm) are most common in May–June when convective thunderstorms are most frequent.

---

## Frequently Asked Questions

**Where does the precipitation figure come from?**

The station hardware has no rain gauge. Precipitation is reported by the external weather sources (OpenWeatherMap, WeatherAPI, VisualCrossing, Open-Meteo, airport METAR) that `system:getCurrentWeather` stores in `raw_weather_data`. Each hour's amount is the mean of the per-source means, so one wet source among dry ones does not make the whole hour wet, and the daily total is the sum of the hourly amounts.

**Why does the total precipitation differ from official meteorological reports?**

The sources are model and nowcast estimates for the station's coordinates, plus a nominal rate (mm/h by precipitation kind and intensity) derived from the nearby airport METAR, not a gauge at the installation point, and they are averaged with each other. Differences of 10–20 % compared with official station totals are normal.

**Why does the calendar show fewer rainy days than I remember?**

Only days with a recorded total **above 0.1 mm** count as rainy. Very light drizzle may stay below this threshold.

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

`days` contains **only days with recorded precipitation** (`total > 0`). Days absent from the array are drawn as dry cells by the frontend.

`dryDays` counts observed days only, so `rainyDays + dryDays` can be smaller than the number of days in the year. Responses are cached on the server: 5 minutes for the current year, 1 hour for a year that ended in the last few days, 7 days for older years.

### Precipitation Aggregation

The calendar reads `daily_averages`, whose `precipitation` is the day's total. It is built in two steps by `system:getCurrentWeather` (and `system:rebuildAverages` for history):

1. `RawWeatherDataModel::getHourlyAverages()` — for each hour, the mean of the per-source mean precipitation (a dry report counts too), stored in `hourly_averages`.
2. `HourlyAveragesModel::getDailyAverages()` — `SUM` of the hourly amounts of the day, stored in `daily_averages`.

`PrecipitationModel` then only reads `daily_averages`: `getDailyTotals()` (days with `precipitation > 0`, rounded to 0.1 mm), `getObservedDays()` (days with a non-NULL value, dry ones included) and `getAvailableYears()`. The climate page sums the same daily values.

### Streak Algorithm

`PrecipitationModel::getStats()` expands the sparse `days` array into a calendar of the **observed** days (from `{year}-01-01` to `min({year}-12-31, today)`): observed days missing from `days` are inserted with `total = 0.0`, unobserved days are left out. Statistics come from this calendar only — no extra database queries.

`_computeStreaks()` then performs a single linear pass over the sorted calendar:
- **Wet:** `total > RAIN_THRESHOLD_MM` (0.1 mm); everything else is dry.
- A gap in the dates (an unobserved day) resets both running streaks.
- The `rainyDays` / `dryDays` counters use the same threshold.

`PrecipitationModel::RAIN_THRESHOLD_MM` is the single source of truth for this threshold (the event feed and the freezing-rain check use it too).

### Frontend Components

| Component | Path | Purpose |
|-----------|------|---------|
| `WidgetPrecipCalendar` | `client/components/widget-precip-calendar/` | 12 × 31 CSS Grid calendar with colour-coded cells and hover tooltip |
| `WidgetPrecipChart` | `client/components/widget-precip-chart/` | ECharts bar chart for 12 monthly totals; reads locale from `i18n.language` |
| `WidgetPrecipStatCard` | `client/components/widget-precip-stat-card/` | Generic stat display card (title + value + optional sub-label) |
| `WidgetStreakCard` | `client/components/widget-streak-card/` | Wet or dry streak card with icon, day count, and date range |

The page (`client/pages/precipitation.tsx`) fetches data via RTK Query (`API.useGetPrecipitationQuery({ year })`). All widgets receive a `loading` prop and render a `Skeleton` placeholder while the request is in flight, so the page layout never collapses during navigation.

Month labels in both the calendar grid and the bar chart are generated at runtime using `toLocaleString(i18n.language, { month: 'short' })`, so they automatically switch between English and Russian without any i18n key lookups.
