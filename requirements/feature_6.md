# Feature 6: Weather Streaks & "Today in History"

## Overview

Two complementary features on a single **Statistics** page:

1. **Live Streaks Dashboard** — a set of counters showing the current run of any notable condition: consecutive days without rain, consecutive days of frost, consecutive hot days (≥30°C), consecutive windy days, etc. Each counter ticks up in real time as the station's daily data comes in.

2. **Today in History** — a sidebar panel that, for today's calendar date, shows what the weather was on this exact day in every previous year the station has been running. Users can see at a glance "was today historically dry? hot? normal?" without navigating the History page.

Together they transform raw archives into an engaging, daily-visit reason that is genuinely different every day.

---

## Motivation

- Streaks are the single most relatable weather statistic for non-meteorologists ("it's been 27 days without rain — is that a record?").
- "Today in history" is a universally engaging daily feature used by major weather services and newspapers.
- Neither feature requires any new sensor data; both are 100% computable from the existing `daily_averages` table.
- The streak counters also double as anomaly detection: a "28 days without rain" banner signals a drought even to a casual visitor.

---

## Streak Definitions

| Streak ID | Condition | Unit |
|-----------|-----------|------|
| `no_rain` | `precipitation < 0.1 mm` | consecutive days |
| `rainy` | `precipitation >= 0.1 mm` | consecutive days |
| `frost` | `temperature_min < 0°C` (approx. `temperature < 2°C` from daily avg) | consecutive days |
| `hot` | `temperature_max >= 30°C` (approx. `temperature >= 28°C`) | consecutive days |
| `windy` | `wind_speed >= 7 m/s` | consecutive days |
| `overcast` | `clouds >= 80%` | consecutive days |
| `clear` | `clouds <= 20%` | consecutive days |

Streaks are computed backward from today (or the last available data date). A streak of 0 means the condition is not currently active.

---

## Scope

### New API Endpoint

**`GET /statistics`**

Returns current streaks, streak records (all-time), and today-in-history data.

#### Query Parameters

None required. The endpoint always uses today's date as the reference point.

#### Response Shape

```json
{
  "streaks": {
    "current": {
      "no_rain":   { "days": 27, "since": "2026-02-17" },
      "rainy":     { "days": 0,  "since": null },
      "frost":     { "days": 0,  "since": null },
      "hot":       { "days": 0,  "since": null },
      "windy":     { "days": 3,  "since": "2026-03-13" },
      "overcast":  { "days": 0,  "since": null },
      "clear":     { "days": 2,  "since": "2026-03-14" }
    },
    "records": {
      "no_rain":   { "days": 41, "start": "2024-07-01", "end": "2024-08-10" },
      "rainy":     { "days": 9,  "start": "2023-09-04", "end": "2023-09-12" },
      "frost":     { "days": 68, "start": "2024-11-20", "end": "2025-01-26" },
      "hot":       { "days": 14, "start": "2023-07-15", "end": "2023-07-28" },
      "windy":     { "days": 5,  "start": "2023-11-01", "end": "2023-11-05" },
      "overcast":  { "days": 11, "start": "2022-11-10", "end": "2022-11-20" },
      "clear":     { "days": 18, "start": "2024-07-04", "end": "2024-07-21" }
    }
  },
  "todayInHistory": [
    {
      "year": 2022,
      "date": "2022-03-16",
      "temperature": 3.4,
      "precipitation": 0.0,
      "clouds": 45,
      "windSpeed": 4.2,
      "weatherId": 801
    },
    {
      "year": 2023,
      "date": "2023-03-16",
      "temperature": 7.1,
      "precipitation": 2.3,
      "clouds": 88,
      "windSpeed": 6.8,
      "weatherId": 500
    },
    {
      "year": 2024,
      "date": "2024-03-16",
      "temperature": 1.2,
      "precipitation": 0.0,
      "clouds": 12,
      "windSpeed": 2.1,
      "weatherId": 800
    }
  ],
  "todayHistoricalAvg": {
    "temperature": 3.9,
    "precipitation": 0.77,
    "clouds": 48.3,
    "windSpeed": 4.4
  }
}
```

---

## Backend Requirements

### Controller: `Statistics` (`server/app/Controllers/Statistics.php`)

- Extends `ResourceController`.
- `index()` → `GET /statistics`.
- Delegates to `StatisticsModel`.

### Model: `StatisticsModel` (`server/app/Models/StatisticsModel.php`)

All queries run against `daily_averages`.

**Current streak computation:**

```php
private function _computeCurrentStreak(string $condition): array {
    // Fetch rows ordered DESC from today
    // Walk rows while condition holds, count days
    // Return ['days' => N, 'since' => date_string | null]
}
```

Fetches only as many rows as needed (stop at first miss, max 365 rows).

**Record streak computation:**

```php
private function _computeRecordStreak(string $condition): array {
    // Fetch all rows ORDER BY date ASC
    // Walk entire history, track max run and its start/end dates
}
```

**Today in history:**

```sql
SELECT DATE(date) as day, temperature, precipitation, clouds, wind_speed, weather_id
FROM daily_averages
WHERE MONTH(date) = MONTH(NOW()) AND DAY(date) = DAY(NOW()) AND YEAR(date) < YEAR(NOW())
ORDER BY date ASC;
```

**Historical average for today's calendar date:**

```sql
SELECT AVG(temperature), AVG(precipitation), AVG(clouds), AVG(wind_speed)
FROM daily_averages
WHERE MONTH(date) = MONTH(NOW()) AND DAY(date) = DAY(NOW());
```

Methods:
- `getCurrentStreaks(): array`
- `getRecordStreaks(): array`
- `getTodayInHistory(): array`
- `getTodayHistoricalAvg(): array`

### Route

```php
$routes->get('statistics', 'Statistics::index');
```

### PHPUnit Tests (`server/tests/unit/StatisticsModelTest.php`)

- Streak of 0 when today's reading does not meet the condition.
- Streak count across month boundary (e.g., 27 days spanning Feb–Mar).
- Record streak finds the correct historical maximum.
- Today-in-history returns only past years, not the current year.

---

## Frontend Requirements

### New Page: `/statistics` (`client/pages/statistics.tsx`)

Layout:

```
[Page Header: "Weather Statistics"]

[Section: Current Streaks]

  Active streaks (days > 0):
  ┌─────────────────────────────────────────────────────┐
  │  ☀️ 27 days without rain · since 17 Feb 2026        │
  │     All-time record: 41 days (Jul–Aug 2024)         │
  ├─────────────────────────────────────────────────────┤
  │  💨 3 consecutive windy days · since 13 Mar 2026    │
  │     All-time record: 5 days (Nov 2023)              │
  └─────────────────────────────────────────────────────┘

  Inactive (all other streak types shown as grey/dormant):
  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │ 🌧 Rainy         │  │ 🌡 Frost         │  │ 🔥 Hot days      │
  │ 0 days           │  │ 0 days           │  │ 0 days           │
  │ Record: 9 days   │  │ Record: 68 days  │  │ Record: 14 days  │
  └──────────────────┘  └──────────────────┘  └──────────────────┘

[Section: Today in History — March 16]

  ┌────────────┬────────────┬────────────┐
  │ 2022       │ 2023       │ 2024       │
  │ +3.4 °C   │ +7.1 °C   │ +1.2 °C   │
  │ 0 mm rain  │ 2.3 mm    │ 0 mm rain  │
  │ ⛅ 45%    │ 🌧 88%    │ ☀️ 12%    │
  │ 4.2 m/s   │ 6.8 m/s   │ 2.1 m/s   │
  └────────────┴────────────┴────────────┘

  Historical average for March 16: +3.9 °C · 0.77 mm · 48% clouds
```

### New Component: `WidgetStreak` (`client/components/widget-streak/`)

Props:
- `streakId: string` — used to look up label and icon
- `current: { days: number; since: string | null }`
- `record: { days: number; start: string; end: string }`
- `active: boolean`

Displays:
- Emoji/icon for the streak type
- Current counter (large, bold if `active`)
- "Since" date when active
- Record days in a smaller, subdued style
- Inactive state: greyed out with record shown

### New Component: `WidgetTodayInHistory` (`client/components/widget-today-in-history/`)

- Card grid — one card per historical year.
- Each card: temperature (large), precipitation, clouds (with WeatherIcon), wind speed.
- Footer row: "Historical average for this day".

### New RTK Query Endpoint (`client/api/endpoints/Statistics.ts`)

```typescript
interface StreakEntry {
  days: number
  since: string | null
}

interface RecordEntry {
  days: number
  start: string
  end: string
}

interface HistoryDayEntry {
  year: number
  date: string
  temperature: number
  precipitation: number
  clouds: number
  windSpeed: number
  weatherId: number
}

interface StatisticsResponse {
  streaks: {
    current: Record<string, StreakEntry>
    records: Record<string, RecordEntry>
  }
  todayInHistory: HistoryDayEntry[]
  todayHistoricalAvg: {
    temperature: number
    precipitation: number
    clouds: number
    windSpeed: number
  }
}
```

Polling interval: `600_000` ms (10 minutes — daily data changes infrequently).

### Navigation

Add "Statistics" to the main navigation menu.

---

## i18n Requirements

```json
"statistics": "Statistics",
"weather-statistics": "Weather Statistics",
"current-streaks": "Current Streaks",
"streak-no-rain": "Days without rain",
"streak-rainy": "Consecutive rainy days",
"streak-frost": "Consecutive frost days",
"streak-hot": "Consecutive hot days",
"streak-windy": "Consecutive windy days",
"streak-overcast": "Consecutive overcast days",
"streak-clear": "Consecutive clear days",
"streak-since": "Since {{date}}",
"streak-record": "Record: {{days}} days",
"streak-record-period": "Record: {{days}} days ({{start}} – {{end}})",
"no-active-streak": "Not active",
"today-in-history": "Today in History",
"today-in-history-date": "{{month}} {{day}} in previous years",
"historical-average": "Historical average for this day",
"statistics-page-description": "Weather streaks and historical comparison for {{location}} — current dry/wet/frost runs and past years on this date"
```

---

## Acceptance Criteria

1. Active streaks (days > 0) are visually prominent; inactive ones are subdued.
2. Each streak correctly reflects the current calendar day's data.
3. Record streaks are computed from all available years of history.
4. "Today in history" shows one card per available past year.
5. The historical average reflects only past years (not the current year).
6. PHPUnit tests cover streak boundary conditions (month crossings, year crossings).
7. Both `en` and `ru` translations present.
8. The page polls every 10 minutes.
