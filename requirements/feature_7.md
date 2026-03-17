# Feature 7: Meteorological Anomaly Monitor

## Executive Analysis — Viability and Rationale

### The April 2024 Orenburg Flood

The spring 2024 flood on the Ural River was the most severe in the Orenburg region in recorded history. The meteorological preconditions were well-documented and textbook:

- **Winter 2023–2024 produced an exceptional snow pack** — precipitation accumulated over months at sub-zero temperatures, resulting in a snow water equivalent (SWE) significantly above the multi-year average.
- **Spring warming in late March–early April 2024 was unusually rapid**, compressing the snowmelt into a short window rather than the gradual two-to-three week thaw typical of the region.
- **Rain-on-snow events in early April** dramatically accelerated surface runoff: liquid water percolating through a snowpack releases heat, causing melt from within.
- **The ground was frozen to significant depth** after a cold winter, eliminating the soil's capacity to absorb meltwater.

The user correctly identifies that 50% of the flood magnitude was attributable to the controlled (or emergency) release from the upstream reservoir. That component is **not observable from the weather station** and must be clearly disclaimed throughout the feature.

However, the remaining 50% — the meteorological half — is **fully deterministic from the data this station already collects**. Moreover, the meteorological conditions that caused that 50% are precisely the same ones that also determine whether reservoir managers are *forced* to release water in the first place: an overwhelmed watershed with no soil absorption capacity and accelerating melt is what fills the reservoir. The weather data therefore acts as a **leading indicator for both halves** of the flood risk, even if it can only directly model one.

### Is This Technically Viable?

**Yes.** The mathematics required are:

1. **Degree-Day snowmelt modelling** — a technique used operationally by national hydrological services worldwide. It requires only air temperature and precipitation, both of which the station measures. It produces an estimated Snow Water Equivalent (SWE) in millimetres.

2. **Statistical anomaly detection** — Z-score ranking of any parameter against its historical distribution for the same calendar period. No specialised sensor needed.

3. **Compound risk scoring** — a simple weighted sum of contributing factors into a single risk level (Low / Elevated / High / Critical).

The station has data back to at least 2022, meaning it captured winter 2022–2023 and the full winter 2023–2024 preceding the flood. These historical winters serve as both baseline and calibration data.

### Honest Limitations

This feature must be presented as a **meteorological anomaly indicator**, not a flood forecast. The following must be stated explicitly in the UI:

| Limitation | Impact |
|---|---|
| No snow depth sensor | SWE is **estimated** from precipitation + temperature; wind redistribution of snow on the open steppe is not captured |
| Temperature is daily average only, no min/max split | Sub-zero overnight readings that arrest melt are invisible; risk may be slightly overestimated during days when nights are still cold |
| No soil moisture or freeze-depth sensor | Soil absorption capacity cannot be directly measured |
| Reservoir discharge is unobservable | 50% of April 2024 flood magnitude is outside the model |
| Single-point measurement | Orenburg Oblast is large; upstream catchment conditions may differ |

Despite these limitations, the feature provides **genuine early-warning value**: the winter of 2023–2024 would have triggered "Critical" risk indicators at least 3–4 weeks before the April flood, giving meaningful lead time.

---

## Scientific Model

### Snow Water Equivalent (SWE) Accumulation

Computed from `daily_averages` using a simplified temperature-index approach:

```
For each day (Oct 1 → May 31):
  if temperature < T_snow (-1°C):
      swe += precipitation          # All precipitation is snow
  elif temperature < T_rain (+2°C):
      swe += precipitation * 0.5    # Mixed phase: half contributes to pack
  else:
      # No accumulation on warm days
```

### Snowmelt via Degree-Day Factor (DDF)

```
For each day where temperature > T_melt (0°C) AND swe > 0:
  melt = DDF * (temperature - T_melt)
  swe  = max(0, swe - melt)
```

**DDF = 3.5 mm/°C/day** — the midpoint of the empirically validated range (3–5 mm/°C/day) for open, wind-exposed continental steppe. This is the standard value used by Russian state hydrological service (Roshydromet) for Ural River basin snow modelling.

Melt is accelerated during **rain-on-snow events**:
```
if temperature > 0 AND precipitation > 1mm:
  melt += precipitation * 0.8      # Latent heat of liquid water on snow
```

### Flood Risk Score Components

| Component | Metric | Weight |
|---|---|---|
| SWE anomaly | `(current_SWE - historical_avg_SWE) / historical_std_SWE` (Z-score) | 35% |
| Melt rate | Degree-days accumulated in last 14 days | 25% |
| Rain-on-snow events | Count of rain-on-snow days in last 21 days | 20% |
| Precipitation anomaly | Rolling 30-day precipitation vs historical same period | 10% |
| Temperature trend | 14-day linear temperature slope (°C/day) | 10% |

**Risk Levels:**

| Score | Level | Colour |
|---|---|---|
| < 20 | Low | Green |
| 20–45 | Elevated | Yellow |
| 46–70 | High | Orange |
| > 70 | Critical | Red |

### Anomaly Detection (Z-Score Method)

For any parameter `P` on calendar date `D`:

```
anomaly_score = (P_today - mean(P for date D across all historical years))
                / std(P for date D across all historical years ± 7-day window)
```

An **anomaly** is flagged when `|anomaly_score| > 2.0` (outside the 95th percentile of historical distribution for that calendar period).

---

## Detectable Anomalies

Beyond flood risk, the following are detectable from existing sensor data and represent genuine hazard events for the Orenburg region:

| Anomaly | Detection Method | Threshold | Relevance |
|---|---|---|---|
| **Summer heat wave** | Consecutive days with temperature Z-score > 2.0 | ≥ 3 consecutive days | Health risk; Orenburg regularly hits 40°C+ |
| **Severe cold snap** | Consecutive days with temperature Z-score < −2.0 | ≥ 3 consecutive days | Infrastructure/pipe freeze risk |
| **Rapid pressure collapse** | Hourly pressure drop rate from `hourly_averages` | ≥ 5 hPa in 3 hours | Approaching severe storm |
| **Radiation fog risk** | Temperature ≈ dew_point (within 2°C) AND wind_speed < 1.5 m/s AND clouds < 30% | Any day | Traffic/aviation hazard |
| **Ice glazing (freezing rain)** | precipitation > 0 AND temperature between −5°C and +1°C | Any event | Road/infrastructure hazard |
| **Drought (SPI-30/60/90)** | Standardised Precipitation Index below −1.5 | SPI < −1.5 | Agricultural/ecological impact |
| **Extreme UV event** | uv_index Z-score > 2.0 AND uv_index ≥ 7 | Any day | Health risk |
| **Abnormal pressure high** | pressure Z-score > 2.5 | Any reading | Smog/inversion trapping risk |
| **Strong wind event** | wind_speed Z-score > 2.0 AND wind_speed > 10 m/s | ≥ 1 reading | Structural/transport hazard; steppe fire spread |
| **Low humidity / fire risk** | humidity < 20% AND wind_speed > 5 m/s AND 7-day precipitation < 2 mm | Any event | Dry steppe fire conditions |
| **Late spring frost** | temperature < −2°C after 5+ consecutive days with avg > +5°C | Any event | Agricultural damage risk after spring onset |
| **Heat stress (apparent temperature)** | Computed heat index (Steadman formula) > 38°C | Any day | Outdoor work and health risk during Orenburg summers |

---

## Scope

### New API Endpoints

#### `GET /anomaly`

Returns the current anomaly monitor state: flood risk, snowpack, active anomalies, parameter Z-score dashboard, and anomaly calendar.

**Response Shape:**
```json
{
  "floodRisk": {
    "score": 72,
    "level": "critical",
    "components": {
      "sweAnomaly":         { "value": 2.8,  "weight": 0.35, "contribution": 35 },
      "meltRate":           { "value": 18.4, "weight": 0.25, "contribution": 22 },
      "rainOnSnowDays":     { "value": 3,    "weight": 0.20, "contribution": 15 },
      "precipAnomaly":      { "value": 1.4,  "weight": 0.10, "contribution": 8 },
      "temperatureTrend":   { "value": 1.2,  "weight": 0.10, "contribution": 7 }
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
      { "date": "2025-11-15", "swe": 12.4 },
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
    "temperature":   2.3,
    "pressure":     -0.4,
    "precipitation": 1.8,
    "windSpeed":     0.7,
    "humidity":     -1.2,
    "uvIndex":       0.3
  },
  "anomalies": [
    {
      "id": "heat_wave",
      "active": false,
      "lastTriggered": null,
      "currentZScore": 0.3
    },
    {
      "id": "cold_snap",
      "active": false,
      "lastTriggered": "2025-12-18",
      "currentZScore": -0.8
    },
    {
      "id": "pressure_collapse",
      "active": false,
      "lastTriggered": "2025-11-02",
      "currentZScore": 0.1
    },
    {
      "id": "freezing_rain",
      "active": true,
      "triggeredAt": "2026-03-14",
      "currentZScore": null
    },
    {
      "id": "drought_spi30",
      "active": false,
      "spi": 0.8,
      "lastTriggered": "2024-08-15"
    }
  ],
  "anomalyHistory": [
    {
      "id": "uuid",
      "type": "freezing_rain",
      "startDate": "2026-03-14",
      "endDate": null,
      "peakZScore": null,
      "description": "Precipitation during near-freezing temperatures"
    }
  ],
  "anomalyCalendar": [
    { "date": "2026-03-14", "activeCount": 1 },
    { "date": "2026-03-15", "activeCount": 1 },
    { "date": "2026-03-16", "activeCount": 1 }
  ]
}
```

#### `GET /anomaly/history`

Returns the computed SWE series and risk scores for a given winter season (for the comparison chart).

**Query Parameters:** `season` (e.g. `2023-2024`, default: current season)

---

## Backend Requirements

### Controller: `Anomaly` (`server/app/Controllers/Anomaly.php`)

- Extends `ResourceController`.
- `index()` → `GET /anomaly` — current state.
- `history()` → `GET /anomaly/history` — historical SWE series for a given season.
- Both delegate to `AnomalyModel` and `AnomalyLogModel`.

### Library: `SnowpackCalculator` (`server/app/Libraries/SnowpackCalculator.php`)

Responsible for all SWE and melt computations.

**Constants (class properties, not hard-coded literals):**
```php
private float $T_SNOW      = -1.0;   // °C — all precipitation is snow below this
private float $T_RAIN      = 2.0;    // °C — all precipitation is rain above this
private float $T_MELT      = 0.0;    // °C — melt begins above this
private float $DDF         = 3.5;    // mm/°C/day — degree-day factor
private float $RAIN_ON_SNOW_FACTOR = 0.8; // fraction of rain that melts snow
```

**Methods:**
- `computeSWESeries(array $dailyRows): array` — takes sorted `daily_averages` rows, returns array of `[date, swe]`. Iterates from Oct 1, accumulating and melting day by day.
- `computeMeltRateLast14Days(array $sweSeries): float` — total melt (mm SWE) over the last 14 days.
- `countRainOnSnowDays(array $dailyRows, int $lookbackDays = 21): int` — days where `temperature > 0 AND precipitation > 1.0` while SWE > 0.
- `getSeasonRange(\DateTime $referenceDate): array` — returns `[start, end]` for the hydrological season containing `$referenceDate` (Oct 1 – May 31).

### Library: `AnomalyDetector` (`server/app/Libraries/AnomalyDetector.php`)

**Methods:**
- `computeZScore(string $parameter, \DateTime $date, float $currentValue): float`
  - Queries `daily_averages` for all historical readings within ±7 calendar days of `$date->format('m-d')` across all past years.
  - Returns Z-score: `(value - mean) / std`. Returns `null` if fewer than 10 historical data points exist.
- `checkAllAnomalies(\DateTime $today, array $recentHourlyRows): array`
  - Runs all anomaly checks and returns an array of anomaly state objects.
  - `checkPressureCollapse(array $hourlyRows): bool` — scans last 3 hours of `hourly_averages` for ≥ 5 hPa drop.
  - `checkFreezingRain(array $todayRow): bool` — `precipitation > 0 AND temperature BETWEEN -5 AND 1`.
  - `checkFogRisk(array $todayRow): bool` — `(temperature - dew_point) <= 2 AND wind_speed < 1.5 AND clouds < 30`.
  - `checkStrongWind(array $todayRow): bool` — `wind_speed > 10 AND wind_speed Z-score > 2.0`.
  - `checkFireRisk(array $todayRow, float $precip7days): bool` — `humidity < 20 AND wind_speed > 5 AND precip7days < 2.0`.
  - `checkLateFrost(array $recentDailyRows): bool` — temperature < −2°C after 5+ consecutive days with avg > +5°C.
  - `checkHeatStress(array $todayRow): bool` — computed apparent temperature (Steadman heat index) > 38°C.
  - `computeSPI(string $endDate, int $days): float` — Standardised Precipitation Index over rolling window.
- `computeAllParameterZScores(\DateTime $today, array $todayRow): array`
  - Returns associative array of Z-scores for all key parameters: `temperature`, `pressure`, `precipitation`, `windSpeed`, `humidity`, `uvIndex`.

**SPI computation:**
```
accumulated_precip = SUM(precipitation) over last N days
historical_mean    = AVG(SUM(precipitation) for same N-day windows in past years)
historical_std     = STD(SUM(precipitation) for same N-day windows in past years)
SPI = (accumulated_precip - historical_mean) / historical_std
```

### Model: `AnomalyModel` (`server/app/Models/AnomalyModel.php`)

- Fetches daily data for the current hydrological season from `daily_averages`.
- Fetches historical season data (all past seasons) for comparison and Z-score computation.
- Fetches last 3 hours from `hourly_averages` for pressure collapse detection.
- Computes the composite flood risk score by calling `SnowpackCalculator` and assembling components.
- Assembles the `parameterZScores` map and `anomalyCalendar` array.

Methods:
- `getCurrentFloodRisk(): array`
- `getSnowpackComparison(): array` — returns `maxSWE` and `floodOccurred` for each recorded winter. The `floodOccurred` flag for 2023–2024 is **hardcoded as `true`** (it is a historical fact, not derived from sensor data).
- `getParameterZScores(): array` — returns current Z-scores for all key parameters.
- `getAnomalyCalendar(int $days = 365): array` — returns daily active-anomaly counts for the past N days, sourced from `anomaly_log`.
- `getAnomalyHistory(): array`

### Model: `AnomalyLogModel` (`server/app/Models/AnomalyLogModel.php`)

**New database table: `anomaly_log`** (requires migration)

```php
// Migration: CreateAnomalyLogTable
$this->forge->addField([
    'id'          => ['type' => 'INT', 'auto_increment' => true],
    'type'        => ['type' => 'VARCHAR', 'constraint' => 50],
    'start_date'  => ['type' => 'DATE'],
    'end_date'    => ['type' => 'DATE', 'null' => true],
    'peak_value'  => ['type' => 'FLOAT', 'null' => true],
    'description' => ['type' => 'TEXT', 'null' => true],
    'created_at'  => ['type' => 'DATETIME'],
]);
```

Methods:
- `openAnomaly(string $type, string $date, ?float $peakValue): int`
- `closeAnomaly(int $id, string $endDate): void`
- `getActiveAnomalies(): array`
- `getHistory(int $limit = 50): array`

### CLI Command: `system:detectAnomalies` (`server/app/Commands/DetectAnomalies.php`)

A new `spark` command that should run **daily** (via cron, alongside the existing daily average computation):

```bash
php spark system:detectAnomalies
```

Responsibilities:
1. Calls `AnomalyDetector::checkAllAnomalies()` for today.
2. For each anomaly type: if newly active and not already open in `anomaly_log`, calls `AnomalyLogModel::openAnomaly()`.
3. For each open anomaly in `anomaly_log`: if no longer active, calls `AnomalyLogModel::closeAnomaly()`.
4. Logs result with `log_message('info', ...)`.

### Route

```php
$routes->get('anomaly',         'Anomaly::index');
$routes->get('anomaly/history', 'Anomaly::history');
```

### PHPUnit Tests

**`server/tests/unit/SnowpackCalculatorTest.php`:**
- Feed a known sequence of temperature + precipitation records → verify SWE accumulation at each step.
- Verify melt on a warm day reduces SWE by `DDF * (T - 0)`.
- Verify rain-on-snow event adds extra melt.
- Verify SWE never goes below 0.
- Verify season boundary: SWE resets to 0 on Oct 1 each year.

**`server/tests/unit/AnomalyDetectorTest.php`:**
- Z-score of exactly 0 when value equals historical mean.
- Pressure collapse detection triggers at exactly 5 hPa in 3 hours.
- SPI returns negative value under drought conditions (low precipitation).
- Fog risk: does not trigger when dew point spread > 3°C.
- Strong wind: does not trigger below 10 m/s even when Z-score is elevated.
- Late frost: triggers correctly after 5 consecutive days above +5°C followed by sub-zero reading.

---

## Frontend Requirements

### New Page: `/anomaly` (`client/pages/anomaly.tsx`)

The page is divided into four sections. It polls every **5 minutes**.

```
[Page Header: "Meteorological Anomaly Monitor"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: SPRING FLOOD RISK
(Visible year-round; shows "off-season" message Jun–Sep)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────────────────────────────────────┐
│  SPRING FLOOD RISK                          CRITICAL │
│  Score: 72 / 100                     ████████████░░ │
│                                                      │
│  [Component breakdown — horizontal stacked bar]      │
│  Snow anomaly ████████ +35                          │
│  Melt rate    █████    +22                          │
│  Rain-on-snow ████     +15                          │
│  Precip anom  ███      +8                           │
│  Temp trend   ██       +7                           │
│                                                      │
│  ⚠ Reservoir operations are not modelled.           │
│    This reflects meteorological conditions only.     │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  ESTIMATED SNOW WATER EQUIVALENT                     │
│                                                      │
│  [ECharts line chart — current season SWE over time] │
│  [Overlaid: previous seasons as faded reference lines│
│   April 2024 season highlighted in red]              │
│                                                      │
│  Current: 184 mm SWE                                │
│  Historical average for this date: 98 mm            │
│  April 2024 (flood year) peak was: 199 mm           │
│                                                      │
│  [Small table: winter comparison]                   │
│  2022–23  71 mm  No flood                           │
│  2023–24  199 mm ⚠ Flood occurred                   │
│  2024–25  112 mm  No flood                          │
│  2025–26  184 mm  Season in progress                │
└──────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2: PARAMETER Z-SCORE DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Grid of small parameter cards — 3 columns on desktop]
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Temperature  │  │ Pressure     │  │ Precipitation│
│ +2.3 ●●●○○  │  │ −0.4 ●●○○○  │  │ +1.8 ●●●○○  │
│ [sparkline]  │  │ [sparkline]  │  │ [sparkline]  │
└──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Wind Speed   │  │ Humidity     │  │ UV Index     │
│ +0.7 ●●○○○  │  │ −1.2 ●●○○○  │  │ +0.3 ●○○○○  │
│ [sparkline]  │  │ [sparkline]  │  │ [sparkline]  │
└──────────────┘  └──────────────┘  └──────────────┘

Card colour: green (|Z| < 1.5), yellow (1.5–2.0), red (> 2.0)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3: ACTIVE ANOMALIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────┐
│  🔴 ACTIVE: Freezing rain conditions                │
│  Since: 14 Mar 2026                                 │
│  Precipitation detected at near-zero temperatures.  │
│  Risk: ice glazing on roads and surfaces.           │
└─────────────────────────────────────────────────────┘

[Other anomaly types shown as grey "monitoring" cards]
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ✓ Heat wave  │  │ ✓ Cold snap  │  │ ✓ Drought    │
│ Monitoring   │  │ Monitoring   │  │ SPI: +0.8    │
│ Z: +0.3      │  │ Z: −0.8      │  │ Normal       │
└──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ✓ Storm      │  │ ✓ Extreme UV │  │ ✓ Fog risk   │
│ Monitoring   │  │ Monitoring   │  │ Monitoring   │
│ ΔP: −0.2/h   │  │ UV: 2 (Low)  │  │ Spread: 5°C │
└──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ✓ Strong wind│  │ ✓ Fire risk  │  │ ✓ Heat stress│
│ Monitoring   │  │ Monitoring   │  │ Monitoring   │
│ Z: +0.7      │  │ Hum: 45%     │  │ HI: 28°C     │
└──────────────┘  └──────────────┘  └──────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4: ANOMALY HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[12-month calendar heatmap — GitHub-style]
[Colour intensity = number of simultaneously active anomalies per day]

[Table: Type | Start | End | Duration | Peak value]
Freezing rain | 14 Mar 2026 | — | ongoing | —
Cold snap     | 18 Dec 2025 | 22 Dec 2025 | 4 days | Z=−2.8
Heat wave     | 24 Jul 2025 | 01 Aug 2025 | 8 days | Z=+3.1
...
```

### New Component: `WidgetFloodRisk` (`client/components/widget-flood-risk/`)

Props:
- `score: number` — 0–100
- `level: 'low' | 'elevated' | 'high' | 'critical'`
- `components: FloodRiskComponents`
- `season: 'active' | 'offseason'`

Displays:
- Large risk level label with colour coding (green/yellow/orange/red)
- Score gauge (ECharts or CSS)
- Horizontal stacked bar breakdown of contributing components
- Disclaimer text (non-dismissable)
- Off-season message when `season === 'offseason'`

### New Component: `WidgetSnowpackChart` (`client/components/widget-snowpack-chart/`)

- ECharts `line` chart.
- Primary series: current season SWE (thick, coloured by risk level).
- Reference series: each past season as a thin, faded line; 2023–2024 rendered in red with a flood marker.
- X-axis: Oct 1 → May 31 (calendar days within the season).
- Y-axis: SWE in mm.
- Tooltip shows date and SWE for all visible series.

### New Component: `WidgetParameterZScore` (`client/components/widget-parameter-z-score/`)

Props:
- `parameter: string` — used to look up i18n label and icon
- `zScore: number`
- `sparklineData: number[]` — last 30 data points for the mini chart

Displays:
- Parameter label and icon
- Z-score value with colour coding: green (`|Z| < 1.5`), yellow (`1.5–2.0`), red (`> 2.0`)
- 5-dot visual severity indicator (filled dots proportional to `|Z| / 2`)
- Mini ECharts sparkline showing the last 30 days of Z-score evolution

### New Component: `WidgetAnomalyCard` (`client/components/widget-anomaly-card/`)

Props:
- `anomalyId: string` — used to look up icon, label, description
- `active: boolean`
- `triggeredAt?: string`
- `currentZScore?: number`
- `extraMetric?: { label: string; value: string }` — for non-Z-score anomalies (e.g. SPI, pressure rate)

Displays:
- Status dot (red = active, grey = monitoring)
- Anomaly label and icon
- Z-score or extra metric
- Activation date if active

### New Component: `WidgetAnomalyCalendar` (`client/components/widget-anomaly-calendar/`)

Props:
- `data: AnomalyCalendarPoint[]` — `{ date: string; activeCount: number }[]` for 12 months

Displays:
- GitHub-style contribution calendar (52 weeks × 7 days grid)
- Cells shaded by `activeCount`: 0 = neutral, 1 = light, 2 = medium, ≥ 3 = full intensity
- Tooltip on hover: date + number of active anomalies
- Month labels on x-axis, day-of-week labels on y-axis

### New RTK Query Endpoint (`client/api/api.ts`)

```typescript
type RiskLevel = 'low' | 'elevated' | 'high' | 'critical'

interface FloodRiskComponent {
  value: number
  weight: number
  contribution: number
}

interface FloodRisk {
  score: number
  level: RiskLevel
  components: {
    sweAnomaly: FloodRiskComponent
    meltRate: FloodRiskComponent
    rainOnSnowDays: FloodRiskComponent
    precipAnomaly: FloodRiskComponent
    temperatureTrend: FloodRiskComponent
  }
  disclaimer: string
  season: 'active' | 'offseason'
}

interface SnowpackPoint {
  date: string
  swe: number
}

interface SeasonComparison {
  year: string
  maxSWE: number
  floodOccurred: boolean | null
}

interface Snowpack {
  estimatedSWE: number
  historicalAvgSWE: number
  historicalStdSWE: number
  sweZScore: number
  series: SnowpackPoint[]
  comparisonYears: SeasonComparison[]
}

interface ParameterZScores {
  temperature: number
  pressure: number
  precipitation: number
  windSpeed: number
  humidity: number
  uvIndex: number
}

interface AnomalyCalendarPoint {
  date: string
  activeCount: number
}

interface AnomalyState {
  id: string
  active: boolean
  triggeredAt?: string
  lastTriggered?: string
  currentZScore?: number
  extraMetric?: { label: string; value: number }
}

interface AnomalyHistoryEntry {
  id: string
  type: string
  startDate: string
  endDate: string | null
  peakValue: number | null
  description: string
}

interface AnomalyResponse {
  floodRisk: FloodRisk
  snowpack: Snowpack
  parameterZScores: ParameterZScores
  anomalies: AnomalyState[]
  anomalyHistory: AnomalyHistoryEntry[]
  anomalyCalendar: AnomalyCalendarPoint[]
}
```

Polling interval: `300_000` ms (5 minutes).

### Navigation

Add "Anomalies" to the main navigation menu (warning triangle icon). The nav item should show a red dot badge when `floodRisk.level` is `'high'` or `'critical'`, or when any anomaly is `active`.

---

## Database Migration

New file: `server/app/Database/Migrations/[timestamp]_CreateAnomalyLogTable.php`

```php
$this->forge->addField([
    'id'          => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
    'type'        => ['type' => 'VARCHAR', 'constraint' => 50],
    'start_date'  => ['type' => 'DATE'],
    'end_date'    => ['type' => 'DATE',  'null' => true, 'default' => null],
    'peak_value'  => ['type' => 'FLOAT', 'null' => true, 'default' => null],
    'description' => ['type' => 'TEXT',  'null' => true, 'default' => null],
    'created_at'  => ['type' => 'DATETIME'],
    'updated_at'  => ['type' => 'DATETIME', 'null' => true, 'default' => null],
]);
$this->forge->addPrimaryKey('id');
$this->forge->addKey('type');
$this->forge->addKey('start_date');
```

---

## i18n Requirements

```json
"anomaly-monitor": "Anomaly Monitor",
"meteorological-anomaly": "Meteorological Anomaly Monitor",
"flood-risk": "Spring Flood Risk",
"flood-risk-score": "Risk score",
"flood-risk-low": "Low",
"flood-risk-elevated": "Elevated",
"flood-risk-high": "High",
"flood-risk-critical": "Critical",
"flood-risk-offseason": "Outside flood season (June–September)",
"flood-risk-disclaimer": "This indicator reflects meteorological conditions only. Reservoir and dam operations are not modelled and may significantly affect actual flood risk.",
"swe-chart-title": "Estimated Snow Water Equivalent",
"swe-current": "Current SWE",
"swe-historical-avg": "Historical average",
"swe-flood-year": "2023–24 (flood year)",
"swe-unit": "mm",
"winter-comparison": "Winter comparison",
"flood-occurred": "Flood occurred",
"no-flood": "No flood",
"season-in-progress": "In progress",
"risk-component-swe-anomaly": "Snowpack anomaly",
"risk-component-melt-rate": "Melt rate",
"risk-component-rain-on-snow": "Rain-on-snow events",
"risk-component-precip-anomaly": "Precipitation anomaly",
"risk-component-temp-trend": "Temperature trend",
"parameter-z-scores": "Parameter Anomaly Dashboard",
"z-score-label": "Z-score",
"active-anomalies": "Active Anomalies",
"anomaly-monitoring": "Monitoring",
"anomaly-active-since": "Active since {{date}}",
"anomaly-last-triggered": "Last: {{date}}",
"anomaly-history": "Anomaly History",
"anomaly-calendar-title": "Anomaly Frequency (12 months)",
"anomaly-calendar-tooltip": "Active anomaly",
"anomaly-heat-wave": "Heat Wave",
"anomaly-heat-wave-desc": "Abnormally high temperatures for this time of year",
"anomaly-cold-snap": "Cold Snap",
"anomaly-cold-snap-desc": "Abnormally low temperatures for this time of year",
"anomaly-storm-approach": "Approaching Storm",
"anomaly-storm-approach-desc": "Rapid barometric pressure drop detected",
"anomaly-freezing-rain": "Freezing Rain Risk",
"anomaly-freezing-rain-desc": "Precipitation detected at near-freezing temperatures",
"anomaly-fog-risk": "Fog Conditions",
"anomaly-fog-risk-desc": "High probability of fog formation: temperature near dew point with calm winds",
"anomaly-drought": "Drought (SPI)",
"anomaly-drought-desc": "Standardised Precipitation Index indicates drier than normal conditions",
"anomaly-extreme-uv": "Extreme UV",
"anomaly-extreme-uv-desc": "UV index significantly above historical norm for this period",
"anomaly-strong-wind": "Strong Wind Event",
"anomaly-strong-wind-desc": "Wind speed significantly above normal; structural and transport hazard",
"anomaly-fire-risk": "Fire Risk Conditions",
"anomaly-fire-risk-desc": "Low humidity combined with elevated wind and dry recent weather increases fire spread risk",
"anomaly-late-frost": "Late Spring Frost",
"anomaly-late-frost-desc": "Sub-zero temperatures after spring onset; risk of agricultural damage",
"anomaly-heat-stress": "Heat Stress",
"anomaly-heat-stress-desc": "Apparent temperature (heat index) above safe threshold for outdoor activity",
"anomaly-pressure-high": "Abnormal Pressure High",
"anomaly-pressure-high-desc": "Exceptionally high atmospheric pressure; elevated smog and inversion risk",
"anomaly-page-description": "Meteorological anomaly monitor for {{location}} — spring flood risk, active anomalies, and historical anomaly frequency"
```

---

## Acceptance Criteria

1. SWE accumulation correctly increases on days when `temperature < -1°C AND precipitation > 0`.
2. SWE melt at rate `DDF * temperature` on days above 0°C; SWE never goes below 0.
3. Rain-on-snow events add extra melt contribution.
4. The flood risk score uses correct weights; all components sum to 100 points maximum.
5. The snowpack chart shows the current season overlaid against all previous seasons, with the 2023–2024 season visually distinguished.
6. The risk level badge in the navigation shows when `level` is `high` or `critical`.
7. The disclaimer is always visible on the page and cannot be hidden.
8. `system:detectAnomalies` runs without error and creates/closes `anomaly_log` entries correctly.
9. PHPUnit tests for `SnowpackCalculator` cover accumulation, melt, rain-on-snow, and season boundary reset.
10. PHPUnit tests for `AnomalyDetector` cover pressure collapse, freezing rain, fog risk, SPI, strong wind, and late frost.
11. Both `en` and `ru` translations present for all keys including new anomaly types.
12. The feature is in **off-season mode** (no score, informational only) from June 1 through September 30.
13. The parameter Z-score dashboard displays colour-coded cards for all six key parameters.
14. The anomaly calendar renders a 12-month heatmap sourced from `anomaly_log`.
15. `GET /anomaly` and `GET /anomaly/history` respond at the correct routes.
