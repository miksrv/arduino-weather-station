# Feature 2: Astronomical Observation Planner

## Overview

Since the weather station operates from a **DIY observatory**, this feature answers the most important question for any amateur astronomer: *"Is tonight good for observing?"*

The **Observation Planner** page combines the station's live sensor data with an astronomical index to produce a real-time and 48-hour outlook of sky conditions — clear sky percentage, atmospheric transparency, seeing estimate, and a composite "observability score." It also shows the current Moon phase (with age and illumination), and highlights the next predicted window of good observing conditions.

This feature is unique to this station's context and cannot be replicated from generic weather services.

---

## Motivation

- The station is physically located at an observatory — this is the single most relevant use case for its operator.
- Existing weather services provide cloud cover, but not an astronomer-friendly summary that integrates humidity, wind stability, and transparency into one actionable score.
- Moon phase data is a hard dependency for any observing plan — bright full moons wash out deep-sky targets.
- The station already collects all needed raw inputs: clouds, humidity, wind_speed, wind_gust, uv_index, sol_radiation, visibility.

---

## Astronomical Indices (Computed on Backend)

### 1. Transparency Index (0–5 scale)

Estimates how well light passes through the atmosphere. Derived from:
- `humidity` (lower = more transparent)
- `clouds` (%)
- `visibility` (km)
- `pressure` (stability proxy)

Formula (simplified example):
```
transparency = 5
  - (humidity / 100) * 1.5
  - (clouds / 100) * 2.5
  - max(0, (10 - visibility_km) / 10) * 1.0
```
Clamp to [0, 5].

### 2. Seeing Index (0–5 scale, Antoniadi scale analog)

Estimates atmospheric steadiness (important for planetary viewing). Derived from:
- `wind_speed` (lower = steadier)
- `wind_gust - wind_speed` differential (turbulence indicator)
- `temperature` stability (compare last 3 readings)

Formula (simplified):
```
seeing = 5
  - min(wind_speed / 5, 2.0)
  - min((wind_gust - wind_speed) / 5, 1.5)
  - temperature_variance_penalty (0–1.5 based on std dev of last 3 readings)
```
Clamp to [0, 5].

### 3. Observability Score (0–10 composite)

```
score = (transparency / 5) * 5 + (seeing / 5) * 3 + (clouds == 0 ? 2 : 0)
```
Labels:
- 0–2: Poor
- 3–4: Below Average
- 5–6: Average
- 7–8: Good
- 9–10: Excellent

### 4. Moon Phase

Calculated purely from the current date using the standard synodic cycle formula (no external API needed):

```
age_days = (julian_day - 2451550.1) mod 29.530588853
illumination = (1 - cos(2π * age_days / 29.53)) / 2 * 100  [%]
phase_name = new | waxing_crescent | first_quarter | waxing_gibbous |
             full | waning_gibbous | last_quarter | waning_crescent
```

---

## Backend Requirements

### Controller: `Astronomy` (`server/app/Controllers/Astronomy.php`)

- Extends `ResourceController`.
- `index()` → `GET /astronomy` — returns current conditions + 48-hour outlook.
- `moon()` → `GET /astronomy/moon` — returns moon phase for a given date (optional `date` query param, defaults to today).

### Library: `AstronomyCalculator` (`server/app/Libraries/AstronomyCalculator.php`)

Methods:
- `getMoonPhase(DateTime $date): array` — returns `age_days`, `illumination`, `phase_name`, `next_new_moon` (DateTime), `next_full_moon` (DateTime).
- `getTransparency(array $weatherData): float` — 0–5.
- `getSeeing(array $currentReading, array $recentReadings): float` — 0–5, uses last 3 raw readings for temperature variance.
- `getObservabilityScore(float $transparency, float $seeing, int $clouds): float` — 0–10.
- `getScoreLabel(float $score): string` — returns `'poor'|'below_average'|'average'|'good'|'excellent'`.

### Response Shape (`GET /astronomy`)

```json
{
  "current": {
    "transparency": 3.8,
    "seeing": 4.1,
    "score": 7.5,
    "scoreLabel": "good",
    "clouds": 12,
    "humidity": 45,
    "windSpeed": 2.3,
    "visibility": 18.0
  },
  "moon": {
    "ageDays": 5.3,
    "illumination": 28.4,
    "phaseName": "waxing_crescent",
    "nextNewMoon": "2026-04-01",
    "nextFullMoon": "2026-03-29"
  },
  "forecast": [
    {
      "time": "2026-03-16T21:00:00Z",
      "score": 7.5,
      "scoreLabel": "good",
      "clouds": 12,
      "transparency": 3.8,
      "seeing": 4.1
    },
    ...
  ],
  "bestWindowStart": "2026-03-16T22:00:00Z",
  "bestWindowEnd":   "2026-03-17T04:00:00Z"
}
```

The `forecast` array is derived by applying the index formulas to the existing `forecast_weather_data` rows for the next 48 hours. `bestWindow` is the longest contiguous stretch where `score >= 7`.

### Route

```php
$routes->get('astronomy',       'Astronomy::index');
$routes->get('astronomy/moon',  'Astronomy::moon');
```

### PHPUnit Tests (`server/tests/unit/AstronomyCalculatorTest.php`)

- Known moon phase test: verify illumination and phase name for a specific historical date.
- Transparency: verify score drops when humidity/clouds increase.
- Seeing: verify score drops when wind_gust significantly exceeds wind_speed.
- Score label thresholds.

---

## Frontend Requirements

### New Page: `/astronomy` (`client/pages/astronomy.tsx`)

Layout:

```
[Page Header: "Observation Planner"]
[Live refresh: every 5 minutes]

┌──────────────────────────────────────────────────────┐
│  TONIGHT'S FORECAST                                   │
│  Observability Score: 7.5 / 10   ★★★★☆  GOOD        │
│  Best window: 22:00 – 04:00                          │
└──────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐
│  Transparency    │  │  Seeing          │
│  ████████░░ 3.8  │  │  ████████░░ 4.1  │
│  /5 Good         │  │  /5 Good         │
└──────────────────┘  └──────────────────┘

┌──────────────────────────────────────────────────────┐
│  MOON                                                 │
│  [Moon phase SVG diagram]                             │
│  Waxing Crescent · 5.3 days old · 28% illuminated    │
│  Next New Moon: 1 Apr 2026 · Next Full: 29 Mar 2026  │
└──────────────────┘

┌──────────────────────────────────────────────────────┐
│  48-HOUR OBSERVABILITY CHART                          │
│  [ECharts line chart: score over time, color bands]  │
│  [Color zones: red=poor, yellow=average, green=good] │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  CURRENT CONDITIONS (contributing factors)            │
│  Clouds: 12%  Humidity: 45%  Wind: 2.3 m/s  Vis: 18km│
└──────────────────────────────────────────────────────┘
```

### New Component: `WidgetObservabilityScore` (`client/components/widget-observability-score/`)

- Circular gauge (0–10) rendered in ECharts.
- Color: red (0–4), yellow (5–6), green (7–10).
- Shows score number and label ("Good", "Excellent", etc.).

### New Component: `WidgetMoonPhase` (`client/components/widget-moon-phase/`)

- Renders a CSS/SVG moon phase diagram based on `illumination` and `phaseName`.
- Shows age, illumination %, phase name.
- Shows next new moon and full moon dates.

### New Component: `WidgetObservabilityChart` (`client/components/widget-observability-chart/`)

- ECharts `line` chart of `score` over the 48-hour forecast array.
- Time axis with hour labels.
- Colored background bands (thresholds at 5 and 7).
- Tooltip shows all contributing values on hover.

### New RTK Query Endpoint (`client/api/endpoints/Astronomy.ts`)

```typescript
interface AstronomyForecastItem {
  time: string
  score: number
  scoreLabel: 'poor' | 'below_average' | 'average' | 'good' | 'excellent'
  clouds: number
  transparency: number
  seeing: number
}

interface MoonData {
  ageDays: number
  illumination: number
  phaseName: string
  nextNewMoon: string
  nextFullMoon: string
}

interface AstronomyResponse {
  current: {
    transparency: number
    seeing: number
    score: number
    scoreLabel: string
    clouds: number
    humidity: number
    windSpeed: number
    visibility: number
  }
  moon: MoonData
  forecast: AstronomyForecastItem[]
  bestWindowStart: string | null
  bestWindowEnd: string | null
}
```

Polling interval: `300_000` ms (5 minutes).

### Navigation

Add "Astronomy" (with a telescope icon) to the main navigation menu.

---

## i18n Requirements

```json
"astronomy": "Astronomy",
"observation-planner": "Observation Planner",
"observability-score": "Observability Score",
"transparency": "Transparency",
"seeing": "Seeing",
"moon-phase": "Moon Phase",
"moon-age": "Moon age",
"moon-illumination": "Illumination",
"next-new-moon": "Next new moon",
"next-full-moon": "Next full moon",
"best-observing-window": "Best observing window",
"no-good-window": "No good window forecast in next 48 hours",
"score-poor": "Poor",
"score-below-average": "Below average",
"score-average": "Average",
"score-good": "Good",
"score-excellent": "Excellent",
"48h-observability": "48-hour observability forecast",
"phase-new": "New Moon",
"phase-waxing_crescent": "Waxing Crescent",
"phase-first_quarter": "First Quarter",
"phase-waxing_gibbous": "Waxing Gibbous",
"phase-full": "Full Moon",
"phase-waning_gibbous": "Waning Gibbous",
"phase-last_quarter": "Last Quarter",
"phase-waning_crescent": "Waning Crescent",
"astronomy-page-description": "Real-time astronomical observing conditions from the station — sky transparency, atmospheric seeing, and moon phase"
```

---

## Acceptance Criteria

1. `/astronomy` page loads and displays current transparency, seeing, and composite score.
2. The moon phase widget correctly identifies phase and illumination for today's date.
3. The 48-hour chart renders with color-coded quality zones.
4. The "best window" banner shows the longest consecutive period with score ≥ 7, or a "no good window" message.
5. `AstronomyCalculator::getMoonPhase()` passes a known-date unit test.
6. Both `en` and `ru` translations are complete.
7. The page polls every 5 minutes for fresh data.
