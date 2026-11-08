# Meteorological Anomaly Monitor

## Overview

The **Anomaly Monitor** (`/anomaly`) is a dedicated page that analyses historical weather data collected by the station and flags statistically unusual conditions. It was designed in response to the April 2024 Ural River flood — the most severe on record in the Orenburg region — whose meteorological preconditions (exceptional snowpack, rapid spring warming, rain-on-snow events, frozen ground) were fully observable from the station's own data weeks in advance.

The page provides four sections:

| Section | Purpose |
|---|---|
| Spring Flood Risk | Composite flood-risk score next to the six parameter z-score cards, then the snowpack chart and season comparison |
| Parameter Anomaly Dashboard | Z-score cards for six key parameters |
| Active Anomalies | Status of all 12 monitored anomaly types |
| Anomaly History | 52-week calendar heatmap and a table of recent episodes |

> **Important disclaimer:** This feature is a meteorological anomaly indicator, not a flood forecast. Reservoir and dam operations are not modelled and can account for a significant portion of actual flood magnitude.

The page polls the API every **5 minutes**; the server caches the `/anomaly` response for 15 minutes, and `system:detectAnomalies` / `system:backfillAnomalyLog` drop that cache when they finish.

---

## Detection Methods

### Z-Score (Statistical Anomaly Detection)

Used for the parameter cards (temperature, pressure, precipitation, wind speed, humidity, UV index) and for the z-score based anomaly types (heat wave, cold snap, pressure high).

For any parameter `P` on calendar date `D` (values from `daily_averages`):

```
Z = (P_today − mean(P for date D ± 7 days across all previous years))
    / std(P for date D ± 7 days across all previous years)
```

The standard deviation is the population one. Z-scores need at least 10 historical data points; the result is `null` when there is less history. Each anomaly type has its own threshold (see the table below).

### Snow Water Equivalent (SWE) — Temperature-Index Model

SWE is estimated from `daily_averages` using a simplified degree-day approach calibrated to the Ural River basin (Roshydromet standard DDF = 3.5 mm/°C/day).

**Accumulation rules (per day, Oct 1 → May 31):**

| Condition | Effect |
|---|---|
| Temperature < −1 °C | All precipitation added to snowpack |
| −1 °C ≤ Temperature < +2 °C | 50 % of precipitation added (mixed phase) |
| Temperature ≥ +2 °C | No accumulation |

**Melt rules (applied on the same day, after accumulation):**

| Condition | Effect |
|---|---|
| Temperature > 0 °C and SWE > 0 | Melt = DDF × (Temperature − 0) |
| Rain-on-snow event (precipitation > 1 mm while Temperature > 0 °C and SWE > 0) | Additional melt = precipitation × 0.8 |

SWE is clamped at 0 — it never goes negative.

### Composite Flood Risk Score

Five components are combined into a single 0–100 score:

| Component | Raw metric | Normalisation | Weight |
|---|---|---|---|
| Snowpack anomaly | Z-score of today's SWE against the same-day SWE of past seasons (since 2022; needs ≥ 2 seasons) | clamp(Z / 4.0, 0, 1) | 35 % |
| Melt rate | Total SWE decrease (mm) over the last 14 days of the model | clamp(value / 30.0, 0, 1) | 25 % |
| Rain-on-snow events | Count (last 21 days) | clamp(count / 7.0, 0, 1) | 20 % |
| Precipitation anomaly | Z-score of the last complete day's precipitation | clamp(Z / 3.0, 0, 1) | 10 % |
| Temperature trend | Least-squares slope of the last 14 daily temperatures (°C/day) | clamp(slope / 3.0, 0, 1) | 10 % |

**Risk levels:**

| Score | Level | Colour |
|---|---|---|
| < 20 | Low | Green |
| 20–45 | Elevated | Orange |
| 46–70 | High | Orange |
| > 70 | Critical | Red |

The score is set to 0 and level to "Low" during the off-season (June 1 – September 30); the response then has `season: "offseason"`.

### Standardised Precipitation Index (SPI)

Used for drought detection. The SPI-30 variant uses a rolling 30-day precipitation window:

```
SPI = (accumulated_precip − historical_mean) / historical_std
```

where `historical_mean` and `historical_std` are computed from the same 30-day windows in all past years, starting with the first year that has precipitation data. A window only counts when at least 90 % of its days have data — both the current one and the historical ones — so a partly recorded window never looks like a drought. Drought is flagged when `SPI < −1.5`. Returns `null` when the current window is incomplete or fewer than 3 historical windows qualify.

---

## Monitored Anomaly Types

The hourly checks look at every `hourly_averages` row of the evaluated day.

| Anomaly | Key | Detection trigger |
|---|---|---|
| Heat wave | `heat_wave` | Temperature Z-score > 1.5 on 2 consecutive days (the day and the one before, no gap) |
| Cold snap | `cold_snap` | Temperature Z-score < −1.5 on 2 consecutive days |
| Rapid pressure drop | `pressure_collapse` | Pressure falls ≥ 5 hPa between two hourly readings at most 3 hours apart (the previous evening counts, so a drop can straddle midnight) |
| Freezing rain | `freezing_rain` | An hour with precipitation ≥ 0.1 mm and mean temperature between −4 °C and +1 °C; when the weather code is known it must be drizzle/rain (3xx, 5xx), not snow |
| Fog conditions | `fog_risk` | An hour with (temperature − dew point) ≤ 2.5 °C, wind speed < 2.0 m/s and cloud cover < 40 % |
| Drought (SPI-30) | `drought_spi30` | SPI-30 < −1.5 |
| Extreme UV | `extreme_uv` | Highest hourly UV index of the day ≥ 7 |
| Abnormal pressure high | `pressure_high` | Pressure Z-score > 1.8 |
| Strong wind event | `strong_wind` | An hour with mean wind speed > 12 m/s |
| Fire risk conditions | `fire_risk` | An hour with humidity < 28 % and wind speed > 4 m/s, and 7-day precipitation < 3 mm |
| Late spring frost | `late_frost` | Daily mean temperature < −2 °C after ≥ 5 consecutive days with mean > +5 °C |
| Heat stress | `heat_stress` | An hour with heat index > 36 °C (checked only when T ≥ 25 °C and RH ≥ 35 %) |

Anomaly episodes are persisted in the `anomaly_log` table. The daily cron command `php spark system:detectAnomalies` evaluates the last **complete** UTC days — yesterday and the two days before it, so a skipped run is caught up; today is never evaluated, since its partial averages would be compared with full-day climatology. Each day is applied idempotently (`AnomalyLogModel::applyDayState()`): an active day opens an episode or extends the open one (re-opening an episode that ended the day before instead of adding a duplicate) and keeps the peak value with the largest magnitude; an inactive day closes the open episode with `end_date` = the last active day.

`php spark system:backfillAnomalyLog` replays the same evaluation over every complete day in `daily_averages`; it refuses to run when `anomaly_log` is not empty unless `--force` is given, which deletes the existing rows in the same transaction as the replay.

On the page, an anomaly is shown as active when the detector finds it active on today's (partial) data **or** an `anomaly_log` episode covers today.

---

## Visualization

### Section 1 — Spring Flood Risk

- **Risk badge:** colour-coded status badge with the current risk level.
- **Score gauge:** ECharts arc gauge, 0–100, fill colour driven by risk level.
- **Component breakdown:** one horizontal bar per component; fill width proportional to contribution; labels from i18n keys.
- **Disclaimer:** always visible — "This indicator reflects meteorological conditions only. Reservoir and dam operations are not modelled."
- **Off-season state** (June–September): the gauge and bars are hidden and replaced by a neutral informational message.

Below the risk widget, a **Snowpack Chart** shows:
- Current-season SWE as a thick line.
- Each previous season as a thin, faded reference line.
- The 2023–2024 flood season as a red dashed line at full opacity with a peak marker.
- A dashed horizontal line at the historical average SWE for the current date.
- A temperature chart of the same seasons.

A **winter comparison table** beneath the chart lists each recorded season with its peak SWE and flood outcome.

### Section 2 — Parameter Anomaly Dashboard

Six cards, one per parameter (temperature, pressure, precipitation, wind speed, humidity, UV index), placed next to the flood-risk widget:

- **Z-score value** colour-coded: green (`|Z| < 1.5`), orange (`1.5–2.0`), red (`> 2.0`).
- **Five-dot severity indicator:** filled dots = `round(min(|Z| / 2, 1) × 5)`.
- **Mini sparkline:** supported by the card, but the page passes no series yet, so it is not drawn.

### Section 3 — Active Anomalies

- One card per anomaly type in a grid. Active cards are highlighted and show the activation date and the measured metric; inactive cards show the current Z-score or the relevant metric.

### Section 4 — Anomaly History

- **Calendar heatmap** (GitHub-style, 52 weeks × 7 days, ending on the station's current date). Cell intensity is driven by the number of simultaneously active anomalies on each day: 0 = neutral, 1 = light, 2 = medium, ≥ 3 = full intensity. Hover tooltip shows the date, the count and the active anomaly types.
- **History table** below the calendar: episodes of the last month plus every open one, newest first — Type, Period (or "ongoing"), Duration (days), and the peak metric (a z-score or the measured quantity, depending on the type).

---

## Known Limitations

| Limitation | Impact |
|---|---|
| No snow depth sensor | SWE is estimated from precipitation + temperature; wind redistribution is not captured |
| Daily temperature averages only | Sub-zero overnight readings that arrest melt are invisible |
| No soil moisture or freeze-depth sensor | Soil absorption capacity cannot be directly measured |
| Reservoir discharge is unobservable | A significant fraction of flood magnitude lies outside the model |
| Single-point measurement | Upstream catchment conditions may differ from the station location |

Despite these constraints, the winter of 2023–2024 would have triggered "Critical" risk indicators 3–4 weeks before the April flood.

---

## Developer Reference

### API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/anomaly` | Current anomaly monitor state (polled every 5 minutes by the UI) |
| GET | `/anomaly/history?season=YYYY-YYYY` | SWE series for a specific hydrological season (start year ≥ 2022, end year = start + 1) |

### `GET /anomaly` — Response Shape

```json
{
  "floodRisk": {
    "score": 57,
    "level": "high",
    "components": {
      "sweAnomaly":       { "value": 2.8,  "weight": 0.35, "contribution": 24.5 },
      "meltRate":         { "value": 18.4, "weight": 0.25, "contribution": 15.3 },
      "rainOnSnowDays":   { "value": 3,    "weight": 0.2,  "contribution": 8.6 },
      "precipAnomaly":    { "value": 1.4,  "weight": 0.1,  "contribution": 4.7 },
      "temperatureTrend": { "value": 1.2,  "weight": 0.1,  "contribution": 4 }
    },
    "disclaimer": "This is a meteorological indicator only. Reservoir operations are not modelled.",
    "season": "active",
    "dataQuality": "good"
  },
  "snowpack": {
    "estimatedSWE": 184.3,
    "historicalAvgSWE": 98.2,
    "historicalStdSWE": 31.4,
    "sweZScore": 2.75,
    "series": [
      { "date": "2025-11-01", "swe": 0.0 },
      { "date": "2026-03-16", "swe": 184.3 }
    ],
    "temperatureSeries": [
      { "date": "2026-03-16", "temperature": 1.4 }
    ],
    "comparisonYears": [
      {
        "year": "2023-2024",
        "maxSWE": 198.7,
        "floodOccurred": true,
        "series": [{ "date": "2023-10-01", "swe": 0.0 }],
        "peakDate": "2024-03-20",
        "temperatureSeries": [{ "date": "2023-10-01", "temperature": 8.2 }]
      }
    ]
  },
  "parameterZScores": {
    "temperature": 2.3,
    "pressure": -0.4,
    "precipitation": 1.8,
    "windSpeed": 0.7,
    "humidity": -1.2,
    "uvIndex": 0.3
  },
  "anomalies": [
    {
      "id": "freezing_rain",
      "active": true,
      "currentZScore": null,
      "extraMetric": { "label": "temperature_c", "value": -1.2 },
      "triggeredAt": "2026-03-14"
    },
    {
      "id": "cold_snap",
      "active": false,
      "currentZScore": -0.8,
      "extraMetric": null,
      "triggeredAt": null
    }
  ],
  "anomalyHistory": [
    {
      "id": 42,
      "type": "freezing_rain",
      "startDate": "2026-03-14",
      "endDate": null,
      "peakValue": -1.2,
      "description": "Freezing rain (precipitation with temperature between -4°C and +1°C)"
    }
  ],
  "anomalyCalendar": [
    { "date": "2026-03-14", "activeCount": 1, "types": ["freezing_rain"] },
    { "date": "2026-03-15", "activeCount": 1, "types": ["freezing_rain"] }
  ]
}
```

`floodOccurred` is `true` for 2023–2024 (hard-coded historical fact), `null` for the season in progress and `false` otherwise. `anomalyHistory` holds the 50 most recent episodes; `anomalyCalendar` covers the last 365 days.

**Error shape** (consistent with all other endpoints):
```json
{ "messages": { "error": "Descriptive error string" } }
```

### `GET /anomaly/history` — Response Shape

```json
{
  "season": "2023-2024",
  "series": [
    { "date": "2023-10-01", "swe": 0.0 },
    { "date": "2024-04-15", "swe": 198.7 }
  ]
}
```

### Backend Components

| Component | File | Role |
|---|---|---|
| `Anomaly` controller | `server/app/Controllers/Anomaly.php` | Handles `GET /anomaly` and `GET /anomaly/history`; assembles the full response from models and libraries |
| `SnowpackCalculator` library | `server/app/Libraries/SnowpackCalculator.php` | Temperature-index SWE accumulation and melt; melt rate and rain-on-snow counts |
| `AnomalyDetector` library | `server/app/Libraries/AnomalyDetector.php` | Z-score computation, SPI, all individual anomaly condition checks; `evaluateDay()` shared by the cron and the backfill |
| `AnomalyModel` | `server/app/Models/AnomalyModel.php` | Orchestrates flood risk score assembly, snowpack comparison, and parameter Z-scores |
| `AnomalyLogModel` | `server/app/Models/AnomalyLogModel.php` | Episodes in `anomaly_log` (`applyDayState()`), history and calendar data |
| `DetectAnomalies` CLI command | `server/app/Commands/DetectAnomalies.php` | Daily cron job: evaluates the last 3 complete UTC days and updates `anomaly_log` |
| `BackfillAnomalyLog` CLI command | `server/app/Commands/BackfillAnomalyLog.php` | One-off replay of all complete days (`--force` wipes the table first) |

### Database Table: `anomaly_log`

| Column | Type | Notes |
|---|---|---|
| `id` | INT UNSIGNED | Primary key, auto-increment |
| `type` | VARCHAR(50) | Anomaly type key (e.g. `freezing_rain`) |
| `start_date` | DATE | First active day of the episode |
| `end_date` | DATE | Last active day; NULL while still active at the last evaluated day |
| `peak_value` | FLOAT | Z-score when the type has one, otherwise the measured metric; the value with the largest magnitude is kept |
| `description` | TEXT | Human-readable summary |
| `created_at` | DATETIME | Row creation timestamp |
| `updated_at` | DATETIME | Last modification timestamp |

Migration file: `server/app/Database/Migrations/2026-03-17-000000_CreateAnomalyLogTable.php`

### Cron Schedule

Daily averages are recalculated by `system:getCurrentWeather` (hourly), so detection only has to run once after midnight UTC:

```
30 1 * * *  cd /path/to/server && php spark system:detectAnomalies
```

### Frontend Components

| Component | Location | Purpose |
|---|---|---|
| `WidgetFloodRisk` | `client/components/widget-flood-risk/` | Risk badge, gauge, component bars, disclaimer |
| `WidgetSnowpackChart` | `client/components/widget-snowpack-chart/` | Multi-season SWE and temperature charts + comparison table |
| `WidgetParameterZScore` | `client/components/widget-parameter-z-score/` | Per-parameter Z-score card |
| `WidgetAnomalyCard` | `client/components/widget-anomaly-card/` | Single anomaly status card (active / monitoring) |
| `WidgetAnomalyCalendar` | `client/components/widget-anomaly-calendar/` | 52-week contribution-calendar heatmap |
| `WidgetAnomalyHistory` | `client/components/widget-anomaly-history/` | Table of recent and open episodes |

RTK Query endpoints: `useGetAnomalyQuery` and `useGetAnomalyHistoryQuery` (defined in `client/api/api.ts`; the page uses only the first).
TypeScript types: `client/api/types/anomaly.ts`, re-exported as `ApiType.Anomaly.*`.
