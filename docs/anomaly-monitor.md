# Meteorological Anomaly Monitor

## Overview

The **Anomaly Monitor** (`/anomaly`) is a dedicated page that analyses historical weather data collected by the station and flags statistically unusual conditions in real time. It was designed in response to the April 2024 Ural River flood — the most severe on record in the Orenburg region — whose meteorological preconditions (exceptional snowpack, rapid spring warming, rain-on-snow events, frozen ground) were fully observable from the station's own sensor data weeks in advance.

The page provides four sections:

| Section | Purpose |
|---|---|
| Spring Flood Risk | Composite flood-risk score with snowpack chart and season comparison |
| Parameter Anomaly Dashboard | Z-score cards for all six key parameters |
| Active Anomalies | Live status of all 12 monitored anomaly types |
| Anomaly History | 12-month calendar heatmap and tabular log |

> **Important disclaimer:** This feature is a meteorological anomaly indicator, not a flood forecast. Reservoir and dam operations are not modelled and can account for a significant portion of actual flood magnitude.

The page polls the API every **5 minutes**.

---

## Detection Methods

### Z-Score (Statistical Anomaly Detection)

The primary method used for temperature, pressure, wind, humidity, UV index, and precipitation anomalies.

For any parameter `P` on calendar date `D`:

```
Z = (P_today − mean(P for date D ± 7 days across all historical years))
    / std(P for date D ± 7 days across all historical years)
```

A reading is flagged as anomalous when `|Z| > 2.0` (outside the 95th percentile of the historical distribution for that calendar period). Z-scores are computed with a minimum of 10 historical data points; the result is `null` when insufficient history exists.

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
| Snowpack anomaly | SWE Z-score | clamp(Z / 4.0, 0, 1) | 35 % |
| Melt rate | Degree-days (last 14 days) | clamp(value / 30.0, 0, 1) | 25 % |
| Rain-on-snow events | Count (last 21 days) | clamp(count / 7.0, 0, 1) | 20 % |
| Precipitation anomaly | Rolling 30-day precipitation Z-score | clamp(Z / 3.0, 0, 1) | 10 % |
| Temperature trend | 14-day linear slope (°C/day) | clamp(slope / 3.0, 0, 1) | 10 % |

**Risk levels:**

| Score | Level | Colour |
|---|---|---|
| < 20 | Low | Green |
| 20–45 | Elevated | Yellow |
| 46–70 | High | Orange |
| > 70 | Critical | Red |

The score is set to 0 and level to "Low" during the off-season (June 1 – September 30).

### Standardised Precipitation Index (SPI)

Used for drought detection. The SPI-30 variant uses a rolling 30-day precipitation window:

```
SPI = (accumulated_precip − historical_mean) / historical_std
```

where `historical_mean` and `historical_std` are computed from the same 30-day windows in all past years. Drought is flagged when `SPI < −1.5`. Returns `null` when fewer than 3 years of historical data exist.

---

## Monitored Anomaly Types

| Anomaly | Detection trigger |
|---|---|
| Heat wave | Temperature Z-score > 2.0 for ≥ 3 consecutive days |
| Cold snap | Temperature Z-score < −2.0 for ≥ 3 consecutive days |
| Rapid pressure drop | Pressure falls ≥ 5 hPa in any 3-hour window (from hourly data) |
| Freezing rain | Precipitation > 0 and temperature between −5 °C and +1 °C |
| Fog conditions | (Temperature − dew point) ≤ 2 °C, wind speed < 1.5 m/s, cloud cover < 30 % |
| Drought (SPI-30) | SPI < −1.5 |
| Extreme UV | UV index Z-score > 2.0 and raw UV index ≥ 7 |
| Abnormal pressure high | Pressure Z-score > 2.5 |
| Strong wind event | Wind speed > 10 m/s and wind speed Z-score > 2.0 |
| Fire risk conditions | Humidity < 20 %, wind speed > 5 m/s, 7-day precipitation < 2 mm |
| Late spring frost | Temperature < −2 °C after ≥ 5 consecutive days with mean > +5 °C |
| Heat stress | Steadman apparent temperature (heat index) > 38 °C |

Anomaly state is persisted in the `anomaly_log` database table. A daily cron command (`php spark system:detectAnomalies`) opens new anomaly records and closes resolved ones.

---

## Visualization

### Section 1 — Spring Flood Risk

- **Risk badge:** large colour-coded label (green / yellow / orange / red) showing the current risk level and score out of 100.
- **Score gauge:** ECharts arc gauge, 0–100, fill colour driven by risk level.
- **Component breakdown:** one horizontal bar per component; fill width proportional to contribution; labels from i18n keys.
- **Disclaimer:** always visible, cannot be hidden — "This indicator reflects meteorological conditions only. Reservoir and dam operations are not modelled."
- **Off-season state** (June–September): the gauge is hidden and replaced by a neutral informational message.

Below the risk widget, a **Snowpack Chart** shows:
- Current-season SWE as a thick line coloured by risk level.
- Each previous season as a thin, faded reference line.
- The 2023–2024 flood season rendered in red at full opacity with a peak marker.
- A dashed horizontal line at the historical average SWE for the current date.

A **winter comparison table** beneath the chart lists each recorded season with its peak SWE and flood outcome.

### Section 2 — Parameter Anomaly Dashboard

Six cards in a responsive 3-column grid, one per parameter (temperature, pressure, precipitation, wind speed, humidity, UV index):

- **Z-score value** colour-coded: green (`|Z| < 1.5`), yellow (`1.5–2.0`), red (`> 2.0`).
- **Five-dot severity indicator:** filled dots scaled to `min(|Z| / 2, 1) × 5`.
- **Mini sparkline:** last 30 days of Z-score evolution (ECharts line, no axes).

### Section 3 — Active Anomalies

- Anomalies with `active = true` are rendered first as full-width banners with a red left border, showing the activation date and a description.
- All other anomaly types appear in a compact 3-column grid as grey "monitoring" cards showing the current Z-score or relevant metric and the last-triggered date if available.

### Section 4 — Anomaly History

- **12-month calendar heatmap** (GitHub-style 52 × 7 grid). Cell intensity is driven by the number of simultaneously active anomalies on each day: 0 = neutral, 1 = light, 2 = medium, ≥ 3 = full intensity. Hover tooltip shows the date and count.
- **History table** below the calendar: Type, Start date, End date (or "ongoing"), Duration (days), Peak value.

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
| GET | `/anomaly` | Current anomaly monitor state (polls every 5 minutes from the UI) |
| GET | `/anomaly/history?season=YYYY-YYYY` | SWE series for a specific hydrological season (min year: 2022) |

### `GET /anomaly` — Response Shape

```json
{
  "floodRisk": {
    "score": 72,
    "level": "critical",
    "components": {
      "sweAnomaly":       { "value": 2.8,  "weight": 0.35, "contribution": 35 },
      "meltRate":         { "value": 18.4, "weight": 0.25, "contribution": 22 },
      "rainOnSnowDays":   { "value": 3,    "weight": 0.20, "contribution": 15 },
      "precipAnomaly":    { "value": 1.4,  "weight": 0.10, "contribution": 8  },
      "temperatureTrend": { "value": 1.2,  "weight": 0.10, "contribution": 7  }
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
    "comparisonYears": [
      { "year": "2022-2023", "maxSWE": 71.2,  "floodOccurred": false },
      { "year": "2023-2024", "maxSWE": 198.7, "floodOccurred": true  },
      { "year": "2024-2025", "maxSWE": 112.1, "floodOccurred": false },
      { "year": "2025-2026", "maxSWE": 184.3, "floodOccurred": null  }
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
      "triggeredAt": "2026-03-14",
      "currentZScore": null
    },
    {
      "id": "cold_snap",
      "active": false,
      "lastTriggered": "2025-12-18",
      "currentZScore": -0.8
    }
  ],
  "anomalyHistory": [
    {
      "id": "uuid",
      "type": "freezing_rain",
      "startDate": "2026-03-14",
      "endDate": null,
      "peakValue": null,
      "description": "Precipitation during near-freezing temperatures"
    }
  ],
  "anomalyCalendar": [
    { "date": "2026-03-14", "activeCount": 1 },
    { "date": "2026-03-15", "activeCount": 1 }
  ]
}
```

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
| `AnomalyDetector` library | `server/app/Libraries/AnomalyDetector.php` | Z-score computation, SPI, and all individual anomaly condition checks |
| `AnomalyModel` | `server/app/Models/AnomalyModel.php` | Orchestrates flood risk score assembly, snowpack comparison, and parameter Z-scores |
| `AnomalyLogModel` | `server/app/Models/AnomalyLogModel.php` | CRUD on `anomaly_log`; calendar data aggregation |
| `DetectAnomalies` CLI command | `server/app/Commands/DetectAnomalies.php` | Daily cron job that opens/closes anomaly records in `anomaly_log` |

### Database Table: `anomaly_log`

| Column | Type | Notes |
|---|---|---|
| `id` | INT UNSIGNED | Primary key, auto-increment |
| `type` | VARCHAR(50) | Anomaly type key (e.g. `freezing_rain`) |
| `start_date` | DATE | Date the anomaly was first detected |
| `end_date` | DATE | Date the anomaly resolved; NULL if ongoing |
| `peak_value` | FLOAT | Peak Z-score or raw value during the event |
| `description` | TEXT | Human-readable summary |
| `created_at` | DATETIME | Row creation timestamp |
| `updated_at` | DATETIME | Last modification timestamp |

Migration file: `server/app/Database/Migrations/2026-03-17-000000_CreateAnomalyLogTable.php`

### Cron Schedule

Add alongside the existing daily average computation in the server crontab:

```
# Daily anomaly detection — runs after daily averages are calculated
0 6 * * *  cd /path/to/server && php spark system:calculateDailyAverages
5 6 * * *  cd /path/to/server && php spark system:detectAnomalies
```

### Frontend Components

| Component | Location | Purpose |
|---|---|---|
| `WidgetFloodRisk` | `client/components/widget-flood-risk/` | Risk gauge, component bars, disclaimer |
| `WidgetSnowpackChart` | `client/components/widget-snowpack-chart/` | Multi-season SWE line chart + comparison table |
| `WidgetParameterZScore` | `client/components/widget-parameter-z-score/` | Per-parameter Z-score card with sparkline |
| `WidgetAnomalyCard` | `client/components/widget-anomaly-card/` | Single anomaly status card (active / monitoring) |
| `WidgetAnomalyCalendar` | `client/components/widget-anomaly-calendar/` | 52-week contribution-calendar heatmap |

RTK Query endpoints: `useGetAnomalyQuery` and `useGetAnomalyHistoryQuery` (defined in `client/api/api.ts`).
TypeScript types: `client/api/types/anomaly.ts`, re-exported as `ApiType.Anomaly.*`.
