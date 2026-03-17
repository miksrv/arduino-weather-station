# Feature 7 — Meteorological Anomaly Monitor: Task Roadmap

## Overview for Agents

This document is the authoritative task breakdown for implementing Feature 7. It is addressed jointly to the **Backend Agent** and the **Frontend Agent**. Each agent must read `requirements/feature_7.md` in full before beginning any task.

### Ground Rules

- **Backend Agent** owns everything under `server/`. All new PHP must follow CodeIgniter 4 conventions: `ResourceController`, typed properties, DocBlocks on every public method, no raw SQL in controllers, errors via `try-catch` + `log_message`.
- **Frontend Agent** owns everything under `client/`. No semicolons, no `any`, imports sorted by `simple-import-sort`, JSX depth ≤ 4. All new RTK Query endpoints go into `client/api/api.ts` (the single API file — there are no separate endpoint files). All new TypeScript types go into `client/api/types/anomaly.ts`.
- **Neither agent** modifies existing migrations. The new `anomaly_log` migration is a standalone new file.
- **Cross-team contract:** The Backend Agent must complete `BE-06` (routes registered, controller responding) before the Frontend Agent can perform live integration in `FE-08`. The Frontend Agent may develop all components against mock data before that point.

---

## Dependency Graph

```
BE-01 (migration)
  └─► BE-04 (AnomalyLogModel)
        └─► BE-05 (AnomalyModel) ◄── BE-02 (SnowpackCalculator)
              │                   ◄── BE-03 (AnomalyDetector) ──► BE-08 (CLI command)
              └─► BE-06 (Anomaly controller)
                    └─► BE-07 (routes) ◄────────── [API contract freeze]
                                                          │
                          FE-01 (TS types) ───────────────┤
                            └─► FE-02 (api/types/index)   │
                                  └─► FE-03 (RTK Query)   │
                          FE-04 (WidgetFloodRisk)          │
                          FE-05 (WidgetSnowpackChart)      │
                          FE-06 (WidgetAnomalyCard)        │
                          FE-06b (WidgetParameterZScore)   │
                          FE-06c (WidgetAnomalyCalendar)   │
                          FE-07 (i18n keys)                │
                                  └─► FE-08 (page) ◄───────┘
                                        └─► FE-09 (nav badge)

BE-09 (SnowpackCalculator tests) ── depends on BE-02
BE-10 (AnomalyDetector tests)    ── depends on BE-03
```

**Parallel windows:**
- `BE-02`, `BE-03`, `BE-04` can be built in parallel once `BE-01` is merged.
- `FE-01` through `FE-07` can be built in parallel with all backend phases using mock data.
- `BE-09` and `BE-10` can be written alongside the library tasks they test.

---

## Phase 1 — Database Foundation

> **Owner: Backend Agent**
> Must be completed before any model work begins.

---

### BE-01 · Database Migration: `anomaly_log` table ✅

**File to create:**
`server/app/Database/Migrations/[timestamp]_CreateAnomalyLogTable.php`

Use `php spark migrate:create CreateAnomalyLogTable` to generate the file with the correct timestamp, then implement the `up()` and `down()` methods.

**Schema:**
```php
$this->forge->addField([
    'id'          => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
    'type'        => ['type' => 'VARCHAR', 'constraint' => 50],
    'start_date'  => ['type' => 'DATE'],
    'end_date'    => ['type' => 'DATE',     'null' => true, 'default' => null],
    'peak_value'  => ['type' => 'FLOAT',    'null' => true, 'default' => null],
    'description' => ['type' => 'TEXT',     'null' => true, 'default' => null],
    'created_at'  => ['type' => 'DATETIME'],
    'updated_at'  => ['type' => 'DATETIME', 'null' => true, 'default' => null],
]);
$this->forge->addPrimaryKey('id');
$this->forge->addKey('type');
$this->forge->addKey('start_date');
$this->forge->createTable('anomaly_log');
```

**`down()`** must call `$this->forge->dropTable('anomaly_log')`.

**Done when:** `php spark migrate` runs without error; `php spark migrate:rollback` cleanly drops the table.

---

## Phase 2 — Core Computation Libraries

> **Owner: Backend Agent**
> Both libraries are pure computation — no database access. They can be built and unit-tested without any model or controller work.

---

### BE-02 · Library: `SnowpackCalculator` ✅

**File to create:** `server/app/Libraries/SnowpackCalculator.php`

**Namespace:** `App\Libraries`

**Model constants (private float properties, not inline literals):**

| Property | Value | Meaning |
|---|---|---|
| `$T_SNOW` | `-1.0` | °C — precipitation below this is all snow |
| `$T_RAIN` | `2.0` | °C — precipitation above this is all rain |
| `$T_MELT` | `0.0` | °C — snowmelt begins above this |
| `$DDF` | `3.5` | mm/°C/day — degree-day factor (Roshydromet Ural basin value) |
| `$RAIN_ON_SNOW_FACTOR` | `0.8` | fraction of rain that converts to melt when snow is present |

**Public methods to implement:**

```php
/**
 * Returns [start_date, end_date] of the hydrological season (Oct 1 – May 31)
 * that contains the given reference date. If the date is between Jun 1 and
 * Sep 30, returns the upcoming season (next Oct 1 – May 31).
 */
public function getSeasonRange(\DateTime $referenceDate): array

/**
 * Iterates the provided daily rows (must be sorted ASC by date, covering
 * Oct 1 – present) and computes the running SWE at each step.
 * Returns array of ['date' => 'Y-m-d', 'swe' => float].
 * SWE is clamped to 0 — it never goes negative.
 */
public function computeSWESeries(array $dailyRows): array

/**
 * Given a SWE series (output of computeSWESeries), returns the total
 * snow melt (mm SWE) that occurred over the last $days days.
 */
public function computeMeltRateLast14Days(array $sweSeries, int $days = 14): float

/**
 * Counts days in the last $lookbackDays where:
 *   temperature > T_MELT  AND  precipitation > 1.0  AND  swe > 0
 * Requires both the daily rows and the SWE series (to check swe > 0).
 */
public function countRainOnSnowDays(array $dailyRows, array $sweSeries, int $lookbackDays = 21): int
```

**Accumulation logic (implement inside `computeSWESeries`):**
```
for each day in dailyRows (ascending):
  if temperature < T_SNOW:
      swe += precipitation
  elif temperature < T_RAIN:
      swe += precipitation * 0.5
  // else: no accumulation

  if temperature > T_MELT and swe > 0:
      melt = DDF * (temperature - T_MELT)
      if precipitation > 1.0 and temperature > T_MELT:
          melt += precipitation * RAIN_ON_SNOW_FACTOR
      swe = max(0, swe - melt)

  append ['date' => date, 'swe' => swe]
```

**Done when:** BE-09 (unit tests) pass.

---

### BE-03 · Library: `AnomalyDetector` ✅

**File to create:** `server/app/Libraries/AnomalyDetector.php`

**Namespace:** `App\Libraries`

**Constructor:** Accepts `DailyAveragesModel` and `HourlyAveragesModel` as injected dependencies (do not instantiate models inside the library — pass them in).

**Public methods to implement:**

```php
/**
 * Computes the Z-score for $parameter on $date against all historical
 * readings for the same calendar day ±7 days across all past years.
 * Returns null if fewer than 10 data points exist.
 */
public function computeZScore(string $parameter, \DateTime $date, float $currentValue): ?float

/**
 * Checks whether the last 3 rows of $hourlyRows show a pressure drop
 * of >= 5 hPa. Rows must be sorted DESC (newest first).
 */
public function checkPressureCollapse(array $hourlyRows): bool

/**
 * Returns true if precipitation > 0 AND temperature is between -5 and +1 °C.
 */
public function checkFreezingRain(array $todayRow): bool

/**
 * Returns true if (temperature - dew_point) <= 2 AND wind_speed < 1.5
 * AND clouds < 30.
 */
public function checkFogRisk(array $todayRow): bool

/**
 * Returns true if wind_speed > 10 m/s AND wind_speed Z-score > 2.0.
 */
public function checkStrongWind(array $todayRow, float $windZScore): bool

/**
 * Returns true if humidity < 20 AND wind_speed > 5 AND 7-day accumulated
 * precipitation < 2.0 mm.
 */
public function checkFireRisk(array $todayRow, float $precip7days): bool

/**
 * Returns true if today's temperature < -2°C AND the preceding 5+
 * consecutive daily rows all had average temperature > +5°C.
 */
public function checkLateFrost(array $recentDailyRows): bool

/**
 * Returns true if the Steadman apparent temperature (heat index) computed
 * from temperature and humidity exceeds 38°C.
 */
public function checkHeatStress(array $todayRow): bool

/**
 * Computes the Standardised Precipitation Index over a rolling window of
 * $days days ending on $endDate.
 * Returns null if insufficient historical windows exist (< 3 years).
 */
public function computeSPI(string $endDate, int $days): ?float

/**
 * Returns an associative array of current Z-scores for all key parameters:
 * temperature, pressure, precipitation, windSpeed, humidity, uvIndex.
 * Uses computeZScore() for each.
 */
public function computeAllParameterZScores(\DateTime $today, array $todayRow): array

/**
 * Runs all anomaly checks for today and returns an array keyed by
 * anomaly type string. Each value is ['active' => bool, 'zScore' => ?float,
 * 'extraMetric' => ?array].
 */
public function checkAllAnomalies(\DateTime $today, array $recentHourlyRows, array $todayRow): array
```

**Anomaly types checked by `checkAllAnomalies`:**

| Key | Method used | Active condition |
|---|---|---|
| `heat_wave` | `computeZScore('temperature', ...)` | Z-score > 2.0 for 3+ consecutive days |
| `cold_snap` | `computeZScore('temperature', ...)` | Z-score < −2.0 for 3+ consecutive days |
| `pressure_collapse` | `checkPressureCollapse(...)` | true |
| `freezing_rain` | `checkFreezingRain(...)` | true |
| `fog_risk` | `checkFogRisk(...)` | true |
| `drought_spi30` | `computeSPI(..., 30)` | SPI < −1.5 |
| `extreme_uv` | `computeZScore('uv_index', ...)` + raw check | Z > 2.0 AND uv_index >= 7 |
| `pressure_high` | `computeZScore('pressure', ...)` | Z > 2.5 |
| `strong_wind` | `checkStrongWind(...)` | true |
| `fire_risk` | `checkFireRisk(...)` | true |
| `late_frost` | `checkLateFrost(...)` | true |
| `heat_stress` | `checkHeatStress(...)` | true |

For `heat_wave` and `cold_snap`, the 3-consecutive-day check requires querying the last 3 daily rows — `checkAllAnomalies` must accept or fetch these.

**Done when:** BE-10 (unit tests) pass.

---

## Phase 3 — Data Access Layer (Models)

> **Owner: Backend Agent**
> Depends on: BE-01, BE-02, BE-03.

---

### BE-04 · Model: `AnomalyLogModel` ✅

**File to create:** `server/app/Models/AnomalyLogModel.php`

**Namespace:** `App\Models`

Extends `\CodeIgniter\Model`. Table: `anomaly_log`.

```php
protected $table         = 'anomaly_log';
protected $primaryKey    = 'id';
protected $allowedFields = ['type', 'start_date', 'end_date', 'peak_value', 'description', 'created_at', 'updated_at'];
protected $useTimestamps = true;
```

**Methods:**

```php
/** Inserts a new open anomaly. Returns the inserted row id. */
public function openAnomaly(string $type, string $date, ?float $peakValue = null): int

/** Sets end_date on an open anomaly row identified by $id. */
public function closeAnomaly(int $id, string $endDate): void

/** Returns all rows where end_date IS NULL, ordered by start_date DESC. */
public function getActiveAnomalies(): array

/**
 * Returns the most recent $limit rows ordered by start_date DESC.
 * Includes both open and closed anomalies.
 */
public function getHistory(int $limit = 50): array

/**
 * Returns the currently open row for $type, or null if none exists.
 * Used by the CLI command to avoid duplicate open entries.
 */
public function getOpenByType(string $type): ?array

/**
 * Returns daily active-anomaly counts for the past $days days.
 * Queries anomaly_log to count overlapping open anomalies per calendar date.
 * Returns array of ['date' => 'Y-m-d', 'activeCount' => int].
 */
public function getCalendarData(int $days = 365): array
```

**Done when:** All methods work against a real database in a test run.

---

### BE-05 · Model: `AnomalyModel` ✅

**File to create:** `server/app/Models/AnomalyModel.php`

**Namespace:** `App\Models`

Does **not** extend `\CodeIgniter\Model` directly (it orchestrates multiple models and libraries — use a plain class with constructor injection).

**Constructor accepts:**
- `DailyAveragesModel $dailyModel`
- `HourlyAveragesModel $hourlyModel`
- `SnowpackCalculator $snowpack`
- `AnomalyDetector $detector`
- `AnomalyLogModel $anomalyLogModel`

**Methods:**

```php
/**
 * Fetches daily rows for the current hydrological season, runs
 * SnowpackCalculator, computes all score components, and returns
 * the full flood risk array matching the API response shape.
 */
public function getCurrentFloodRisk(): array

/**
 * For each recorded hydrological season (Oct–May), computes the
 * peak SWE. Sets floodOccurred=true for season '2023-2024' (hardcoded
 * historical fact), null for the current in-progress season,
 * false for all others.
 */
public function getSnowpackComparison(): array

/**
 * Returns current Z-scores for all key parameters by calling
 * AnomalyDetector::computeAllParameterZScores().
 */
public function getParameterZScores(): array

/**
 * Delegates to AnomalyLogModel::getCalendarData().
 */
public function getAnomalyCalendar(int $days = 365): array

/** Delegates directly to AnomalyLogModel::getHistory(). */
public function getAnomalyHistory(): array
```

**Flood risk score assembly (inside `getCurrentFloodRisk`):**

The method must produce a `score` (0–100) from five components using the weights defined in `feature_7.md`. Each component is normalised to its maximum possible contribution before weighting:

| Component | Raw metric | Normalisation to 0–1 | Weight |
|---|---|---|---|
| `sweAnomaly` | Z-score of current SWE vs historical | `clamp(zScore / 4.0, 0, 1)` | 35 |
| `meltRate` | Degree-days in last 14 days | `clamp(meltDays / 30.0, 0, 1)` | 25 |
| `rainOnSnowDays` | Count in last 21 days | `clamp(count / 7.0, 0, 1)` | 20 |
| `precipAnomaly` | Z-score of rolling 30-day precipitation | `clamp(zScore / 3.0, 0, 1)` | 10 |
| `temperatureTrend` | 14-day linear slope °C/day | `clamp(slope / 3.0, 0, 1)` | 10 |

`score = Σ (normalised_component * weight)`, max = 100.

**Season detection:** If today is between June 1 and September 30, set `season = 'offseason'` and return `score = 0` with `level = 'low'` — no computation needed.

**Done when:** `getCurrentFloodRisk()` returns a correctly shaped array for a date in the active season and correctly returns off-season state for a date in July.

---

## Phase 4 — API Layer

> **Owner: Backend Agent**
> Depends on: BE-05.

---

### BE-06 · Controller: `Anomaly` ✅

**File to create:** `server/app/Controllers/Anomaly.php`

**Namespace:** `App\Controllers`

Extends `ResourceController`. Constructor instantiates all dependencies and injects them into `AnomalyModel`.

```php
class Anomaly extends ResourceController
{
    protected AnomalyModel    $anomalyModel;
    protected AnomalyLogModel $anomalyLogModel;
    protected AnomalyDetector $detector;

    public function __construct()
    {
        // instantiate DailyAveragesModel, HourlyAveragesModel,
        // SnowpackCalculator, AnomalyDetector, AnomalyLogModel,
        // then pass them all into new AnomalyModel(...)
    }

    /**
     * GET /anomaly
     * Returns current flood risk state, snowpack data, parameter Z-scores,
     * active anomalies, anomaly history, and anomaly calendar.
     */
    public function index(): ResponseInterface

    /**
     * GET /anomaly/history?season=2023-2024
     * Returns the SWE series for a specific hydrological season.
     * Validates season format (YYYY-YYYY) and that start year >= 2022.
     */
    public function history(): ResponseInterface
}
```

`index()` must assemble the full response from `AnomalyModel::getCurrentFloodRisk()`, `AnomalyModel::getParameterZScores()`, `AnomalyDetector::checkAllAnomalies()`, `AnomalyLogModel::getActiveAnomalies()`, `AnomalyLogModel::getHistory()`, and `AnomalyModel::getAnomalyCalendar()`, combining them into the shape documented in `feature_7.md`.

**Done when:** `GET /anomaly` returns a valid JSON response matching the documented shape.

---

### BE-07 · Routes Registration ✅

**File to modify:** `server/app/Config/Routes.php`

Add alongside existing route definitions:

```php
$routes->get('anomaly',         'Anomaly::index');
$routes->get('anomaly/history', 'Anomaly::history');
```

**Done when:** Both routes resolve correctly (verify with `php spark routes`).

---

### BE-08 · CLI Command: `system:detectAnomalies` ✅

**File to create:** `server/app/Commands/DetectAnomalies.php`

**Namespace:** `App\Commands`

Extends `\CodeIgniter\CLI\BaseCommand`.

```php
protected $group   = 'system';
protected $name    = 'system:detectAnomalies';
protected $description = 'Checks all meteorological anomaly conditions and updates the anomaly_log table.';
```

**`run()` logic:**

1. Instantiate `DailyAveragesModel`, `HourlyAveragesModel`, `AnomalyDetector`, `AnomalyLogModel`.
2. Fetch today's daily row and last 3 hourly rows.
3. Call `AnomalyDetector::checkAllAnomalies(today, hourlyRows, todayRow)`.
4. For each anomaly type:
   - If `active = true`: check `AnomalyLogModel::getOpenByType($type)`. If `null`, call `openAnomaly()`.
   - If `active = false`: if an open row exists for this type, call `closeAnomaly($id, today)`.
5. Log a summary line with `CLI::write()` and `log_message('info', ...)`.

**Cron registration note (for documentation only — not a code task):** This command should be added to the server's crontab to run daily at 06:00, after `system:calculateDailyAverages`.

**Done when:** `php spark system:detectAnomalies` runs without error and produces at least one `log_message` output entry.

---

## Phase 5 — Backend Tests

> **Owner: Backend Agent**
> Can be written in parallel with the library tasks they cover.

---

### BE-09 · PHPUnit: `SnowpackCalculatorTest` ✅

**File to create:** `server/tests/unit/SnowpackCalculatorTest.php`

Required test cases:

| Test method | What it verifies |
|---|---|
| `testSnowAccumulationBelowTSnow` | A cold day (−5°C) with 10mm precipitation adds exactly 10mm to SWE |
| `testMixedPhaseHalfContribution` | A day at 0°C with 10mm precipitation adds exactly 5mm to SWE |
| `testNoAccumulationAboveTRain` | A warm day (+5°C) with 10mm precipitation adds 0mm to SWE |
| `testMeltReducesSWE` | A +4°C day reduces SWE by `3.5 * 4 = 14mm` |
| `testSWENeverGoesNegative` | Melt applied to a 5mm SWE pack at +10°C clamps to 0, not −X |
| `testRainOnSnowAcceleratesMelt` | +3°C day with 5mm rain on a 50mm pack: extra melt = `5 * 0.8 = 4mm` on top of DDF melt |
| `testCountRainOnSnowDays` | Known sequence → correct count |
| `testSeasonRangeActiveMonth` | Date of 2026-03-15 → season `[2025-10-01, 2026-05-31]` |
| `testSeasonRangeOffseason` | Date of 2026-07-15 → season `[2026-10-01, 2027-05-31]` |

---

### BE-10 · PHPUnit: `AnomalyDetectorTest` ✅

**File to create:** `server/tests/unit/AnomalyDetectorTest.php`

Required test cases:

| Test method | What it verifies |
|---|---|
| `testZScoreZeroAtMean` | Value == historical mean → Z-score = 0.0 |
| `testZScorePositiveAboveMean` | Value 2 std above mean → Z-score ≈ 2.0 |
| `testZScoreNullInsufficientData` | Fewer than 10 data points → returns null |
| `testPressureCollapseTriggersAt5hPa` | Pressure drop of exactly 5 hPa over 3 hours → true |
| `testPressureCollapseNoTriggerBelow5hPa` | Drop of 4.9 hPa → false |
| `testFreezingRainAtBoundaryTemp` | temp = 1°C, precip = 0.5 → true; temp = 1.1°C → false |
| `testFogRiskSpreadExactly2` | temp − dew_point = 2.0, wind < 1.5, clouds < 30 → true |
| `testFogRiskNoTriggerWideSpread` | temp − dew_point = 2.1 → false |
| `testSPINegativeUnderDrought` | Accumulated precip << historical mean → SPI < 0 |
| `testSPINullInsufficientHistory` | Only 2 years of data → returns null |
| `testStrongWindNoTriggerBelowThreshold` | wind_speed = 9.9 m/s even with high Z-score → false |
| `testLateFrostTriggersAfterSpringOnset` | 5 days above +5°C followed by −3°C day → true |
| `testLateFrostNoTriggerWithoutSpringOnset` | Sub-zero day without prior warm stretch → false |
| `testHeatStressTriggersAbove38C` | temp = 35°C, humidity = 70% (HI ≈ 40°C) → true |

---

## Phase 6 — Frontend: Types & API Client

> **Owner: Frontend Agent**
> Can be started immediately — no backend dependency. Use mock data for all component development.

---

### ✅ FE-01 · TypeScript Types

**File to create:** `client/api/types/anomaly.ts`

Define all interfaces exactly as specified in `feature_7.md`. Key types:

```typescript
export type RiskLevel = 'low' | 'elevated' | 'high' | 'critical'
export type RiskSeason = 'active' | 'offseason'

export interface FloodRiskComponent {
  value: number
  weight: number
  contribution: number
}

export interface FloodRisk { ... }
export interface SnowpackPoint { ... }
export interface SeasonComparison { ... }
export interface Snowpack { ... }
export interface ParameterZScores { ... }
export interface AnomalyCalendarPoint { ... }
export interface AnomalyState { ... }
export interface AnomalyHistoryEntry { ... }

export interface AnomalyResponse {
  floodRisk: FloodRisk
  snowpack: Snowpack
  parameterZScores: ParameterZScores
  anomalies: AnomalyState[]
  anomalyHistory: AnomalyHistoryEntry[]
  anomalyCalendar: AnomalyCalendarPoint[]
}

export interface AnomalyHistoryRequest {
  season: string
}

export interface AnomalyHistoryResponse {
  season: string
  series: SnowpackPoint[]
}
```

Full interface bodies must match the JSON shapes in `feature_7.md` exactly.

**Done when:** File compiles with zero TypeScript errors.

---

### ✅ FE-02 · Export from `client/api/types/index.ts`

**File to modify:** `client/api/types/index.ts`

Add:
```typescript
export * as Anomaly from './anomaly'
```

**Done when:** `import { ApiType } from '@/api'` exposes `ApiType.Anomaly.AnomalyResponse` etc.

---

### ✅ FE-03 · RTK Query Endpoints

**File to modify:** `client/api/api.ts`

Add `'Anomaly'` to the `tagTypes` array:
```typescript
tagTypes: ['Current', 'History', 'Heatmap', 'Forecast', 'Anomaly']
```

Add two endpoints inside the `endpoints` builder:

```typescript
getAnomaly: builder.query<ApiType.Anomaly.AnomalyResponse, void>({
    providesTags: ['Anomaly'],
    query: () => 'anomaly',
    transformErrorResponse: (response) => (response.data as APIErrorType).messages.error
}),
getAnomalyHistory: builder.query<ApiType.Anomaly.AnomalyHistoryResponse, ApiType.Anomaly.AnomalyHistoryRequest>({
    providesTags: ['Anomaly'],
    query: (params) => `anomaly/history${encodeQueryData<ApiType.Anomaly.AnomalyHistoryRequest>(params)}`,
    transformErrorResponse: (response) => (response.data as APIErrorType).messages.error
}),
```

**Done when:** `useGetAnomalyQuery` and `useGetAnomalyHistoryQuery` hooks are available and TypeScript resolves their return types without errors.

---

## Phase 7 — Frontend: Components

> **Owner: Frontend Agent**
> Depends on: FE-01. Develop against inline mock data constants; do not call the API hooks during component development.

---

### ✅ FE-04 · Component: `WidgetFloodRisk`

**Directory to create:** `client/components/widget-flood-risk/`

**Files:** `index.tsx`, `WidgetFloodRisk.module.sass`

**Props interface:**
```typescript
interface Props {
  score: number
  level: RiskLevel
  components: FloodRisk['components']
  season: RiskSeason
}
```

**Rendering rules:**
- When `season === 'offseason'`: render a neutral card with the `flood-risk-offseason` i18n string. No score, no gauge, no component bars.
- When `season === 'active'`:
  - Risk level label: colour-coded (green/yellow/orange/red) matching the four levels.
  - Score gauge: an ECharts `gauge` series, 0–100, arc fills to the score value, coloured by level.
  - Component breakdown: one horizontal bar per component, label on left, fill width proportional to `contribution`, value on right. Labels come from i18n keys `risk-component-*`.
  - Disclaimer: a `<p>` with the `flood-risk-disclaimer` i18n string, styled as a small warning note. It must always be rendered — never conditionally hidden.

**JSX depth constraint:** The component hierarchy must not exceed 4 levels. If the gauge and breakdown bars push this limit, extract them into local sub-components within the same file (not exported).

---

### ✅ FE-05 · Component: `WidgetSnowpackChart`

**Directory to create:** `client/components/widget-snowpack-chart/`

**Files:** `index.tsx`, `WidgetSnowpackChart.module.sass`

**Props interface:**
```typescript
interface Props {
  currentSeries: SnowpackPoint[]
  comparisonYears: SeasonComparison[]
  estimatedSWE: number
  historicalAvgSWE: number
}
```

**Chart requirements:**
- ECharts `line` chart.
- X-axis: day-of-season (Oct 1 = day 0 through May 31 = day ~242). Display as abbreviated month labels ("Oct", "Nov", …, "May").
- Y-axis: SWE in mm, label unit from `swe-unit` i18n key.
- Series:
  - Current season: thick solid line, colour driven by the current risk level (green/yellow/orange/red). Series name from `swe-current` i18n key.
  - Each `comparisonYears` entry: thin line, opacity 0.35. The entry where `floodOccurred === true` (season `"2023-2024"`) must be rendered in red at full opacity with a distinct dash pattern and a `markPoint` at its peak labelled with `flood-occurred` i18n key.
  - A horizontal `markLine` at `historicalAvgSWE`, dashed, labelled `swe-historical-avg`.
- Tooltip: shows date and mm SWE for all series at the hovered x-position.

**Winter comparison table** (below chart): a small `<table>` with one row per `comparisonYears` entry. Columns: season label, peak SWE, flood status (`flood-occurred` / `no-flood` / `season-in-progress`).

---

### ✅ FE-06 · Component: `WidgetAnomalyCard`

**Directory to create:** `client/components/widget-anomaly-card/`

**Files:** `index.tsx`, `WidgetAnomalyCard.module.sass`

**Props interface:**
```typescript
interface Props {
  anomalyId: string
  active: boolean
  triggeredAt?: string
  lastTriggered?: string
  currentZScore?: number
  extraMetric?: { label: string; value: number }
}
```

**Rendering rules:**
- Active state: card border and status dot in red (`#d32f2f`). Shows `anomaly-active-since` with `triggeredAt` date. Label and description from i18n keys `anomaly-{anomalyId}` and `anomaly-{anomalyId}-desc`.
- Inactive state: card border in `var(--color-border)`, status dot grey. Shows Z-score or `extraMetric` if present. Shows `anomaly-last-triggered` with `lastTriggered` date if available.
- The `anomalyId` value maps directly to i18n key suffixes: e.g., `anomalyId = 'heat_wave'` → keys `anomaly-heat-wave` and `anomaly-heat-wave-desc` (replace `_` with `-`).

---

### ✅ FE-06b · Component: `WidgetParameterZScore`

**Directory to create:** `client/components/widget-parameter-z-score/`

**Files:** `index.tsx`, `WidgetParameterZScore.module.sass`

**Props interface:**
```typescript
interface Props {
  parameter: string        // 'temperature' | 'pressure' | 'precipitation' | 'windSpeed' | 'humidity' | 'uvIndex'
  zScore: number
  sparklineData: number[]  // last 30 daily Z-score values
}
```

**Rendering rules:**
- Parameter label and icon (icon selected by `parameter` value).
- Z-score displayed as a number, colour-coded: green (`|zScore| < 1.5`), yellow (`1.5–2.0`), red (`> 2.0`).
- Five-dot severity indicator: filled dots proportional to `Math.min(Math.abs(zScore) / 2, 1) * 5`, rounded to nearest integer.
- Mini ECharts `line` sparkline (no axes, no tooltip) of the last 30 daily Z-score values. Line colour matches the Z-score colour.

**Done when:** Component renders correctly in all three colour states with mock data.

---

### ✅ FE-06c · Component: `WidgetAnomalyCalendar`

**Directory to create:** `client/components/widget-anomaly-calendar/`

**Files:** `index.tsx`, `WidgetAnomalyCalendar.module.sass`

**Props interface:**
```typescript
interface Props {
  data: AnomalyCalendarPoint[]  // { date: string; activeCount: number }[]
}
```

**Rendering rules:**
- 52-week × 7-day cell grid (GitHub contribution calendar layout).
- Cell fill intensity driven by `activeCount`: 0 = neutral grey, 1 = light, 2 = medium, ≥ 3 = full intensity (use the theme's accent colour at opacity levels 0.2 / 0.5 / 0.8 / 1.0).
- Month labels rendered above the corresponding columns on the x-axis.
- Tooltip on hover: date + `anomaly-calendar-tooltip` i18n string.
- Days in the future (after today) are rendered as neutral without tooltip.

**Done when:** Component renders correctly with a 365-day mock dataset.

---

## Phase 8 — Frontend: i18n

> **Owner: Frontend Agent**
> Can be done in parallel with component work. All strings must appear in both locales before the page is assembled.

---

### ✅ FE-07 · i18n Translation Keys

**Files to modify:**
- `client/public/locales/en/common.json`
- `client/public/locales/ru/common.json`

Add all keys listed in the `i18n Requirements` section of `feature_7.md`. The Russian translations must be genuine translations, not placeholders. Preserve the existing JSON key ordering style of the file (append to end of object, inside the closing `}`).

**Key count:** 52 new keys across both files.

**Done when:** Both files parse as valid JSON and every key referenced in FE-04, FE-05, FE-06, FE-06b, FE-06c, and FE-08 resolves at runtime.

---

## Phase 9 — Frontend: Page Assembly

> **Owner: Frontend Agent**
> Depends on: FE-03, FE-04, FE-05, FE-06, FE-06b, FE-06c, FE-07.
> For live API data: depends on BE-07 being deployed.

---

### ✅ FE-08 · Page: `/anomaly`

**File to create:** `client/pages/anomaly.tsx`

**Structure:**

```
<AppLayout>
  <PageHeader title={t('meteorological-anomaly')} description={t('anomaly-page-description')} />

  {/* Section 1: Flood Risk */}
  <WidgetFloodRisk ... />
  <WidgetSnowpackChart ... />

  {/* Section 2: Parameter Z-Score Dashboard */}
  <SectionHeader title={t('parameter-z-scores')} />
  {/* Grid of WidgetParameterZScore cards for all six parameters */}

  {/* Section 3: Active Anomalies */}
  <SectionHeader title={t('active-anomalies')} />
  {/* Active anomalies rendered first, full-width banner style */}
  {/* Inactive anomalies in a responsive grid, 3 columns on desktop */}
  {anomalies.map((a) => <WidgetAnomalyCard key={a.id} ... />)}

  {/* Section 4: Anomaly History */}
  <SectionHeader title={t('anomaly-history')} />
  <WidgetAnomalyCalendar data={anomalyCalendar} />
  <AnomalyHistoryTable rows={anomalyHistory} />
</AppLayout>
```

**Data fetching:**
```typescript
const { data, isLoading } = useGetAnomalyQuery(undefined, {
    pollingInterval: 300_000   // 5 minutes
})
```

**Parameter Z-score section:** Render one `WidgetParameterZScore` card per key in `data.parameterZScores`. Pass a 30-day sparkline of that parameter's Z-score history — this data is computed client-side from the existing parameter series or fetched as a separate lightweight call if needed.

**Active anomaly banner:** Anomalies where `active === true` must be rendered before inactive ones and with a visually prominent full-width card (red left border, larger font for the label). Inactive anomalies use the compact `WidgetAnomalyCard` grid layout.

**Anomaly history table:** Inline — no separate component needed. Columns: Type (i18n label), Start date, End date (or "—" if ongoing), Duration (days), Peak Z-score or `extraMetric` (or "—").

**Off-season page state:** When `data.floodRisk.season === 'offseason'`, the `WidgetFloodRisk` displays its off-season variant and `WidgetSnowpackChart` still renders (showing the most recent completed season for reference). All other sections remain active year-round.

**SSR:** Use `getServerSideProps` consistent with existing pages.

**Done when:** Page renders without errors against the live API and all four sections are visible.

---

## Phase 10 — Frontend: Navigation

> **Owner: Frontend Agent**
> Depends on: FE-08.

---

### ✅ FE-09 · Navigation Entry & Anomaly Badge

**Files to modify:** Navigation component(s) in `client/components/app-bar/` (read them first to identify the exact file and pattern).

**Tasks:**
1. Add an "Anomalies" navigation item using the `anomaly-monitor` i18n key, pointing to `/anomaly`.
2. Subscribe to the `useGetAnomalyQuery` hook within the navigation component (or pass down the relevant state as props from `_app.tsx` — choose whichever fits the existing data-flow pattern).
3. Render a small red dot badge on the "Anomalies" nav item when:
   - `floodRisk.level === 'high' || floodRisk.level === 'critical'`, **or**
   - `anomalies.some((a) => a.active === true)`
4. The badge must not render during off-season unless an anomaly is active.

**Note:** Read the existing nav structure carefully before modifying. Match the existing pattern for adding menu items exactly — do not restructure the navigation component.

---

## API Contract (Interface Between Teams)

The following is the agreed contract. Backend Agent must not change field names or types after FE-03 is started without coordinating with the Frontend Agent.

### `GET /anomaly` — Response envelope

```
{
  floodRisk: {
    score: number (0–100)
    level: 'low' | 'elevated' | 'high' | 'critical'
    components: {
      sweAnomaly, meltRate, rainOnSnowDays, precipAnomaly, temperatureTrend:
        { value: number, weight: number, contribution: number }
    }
    disclaimer: string
    season: 'active' | 'offseason'
    dataQuality: 'good' | 'insufficient'
  }
  snowpack: {
    estimatedSWE: number
    historicalAvgSWE: number
    historicalStdSWE: number
    sweZScore: number
    series: [{ date: 'YYYY-MM-DD', swe: number }]
    comparisonYears: [{ year: 'YYYY-YYYY', maxSWE: number, floodOccurred: boolean|null }]
  }
  parameterZScores: {
    temperature: number
    pressure: number
    precipitation: number
    windSpeed: number
    humidity: number
    uvIndex: number
  }
  anomalies: [{
    id: string
    active: boolean
    triggeredAt?: string
    lastTriggered?: string
    currentZScore?: number
    extraMetric?: { label: string, value: number }
  }]
  anomalyHistory: [{
    id: string
    type: string
    startDate: 'YYYY-MM-DD'
    endDate: 'YYYY-MM-DD' | null
    peakValue: number | null
    description: string
  }]
  anomalyCalendar: [{
    date: 'YYYY-MM-DD'
    activeCount: number
  }]
}
```

**Error shape** (matching existing convention):
```json
{ "messages": { "error": "string" } }
```

---

## Acceptance Checklist

Before either agent marks their work complete, verify every item in this list.

### Backend

- [x] `php spark migrate` runs cleanly; `anomaly_log` table exists with correct schema
- [x] `php spark migrate:rollback` drops `anomaly_log` without error
- [x] `GET /anomaly` returns valid JSON matching the contract shape above
- [x] `GET /anomaly?season=offseason-month` returns `season: 'offseason'` between June–September
- [x] `GET /anomaly/history?season=2023-2024` returns a `series` array
- [x] `GET /anomaly/history?season=invalid` returns a 4xx error with `messages.error`
- [x] `php spark system:detectAnomalies` runs without exception
- [x] After running `detectAnomalies` twice on the same active anomaly, no duplicate rows appear in `anomaly_log`
- [x] All BE-09 PHPUnit test cases pass
- [x] All BE-10 PHPUnit test cases pass
- [x] `php spark routes` lists both `/anomaly` and `/anomaly/history`
- [x] `AnomalyLogModel::getCalendarData()` returns correct daily active counts sourced from `anomaly_log`

### Frontend

- [x] `client/api/types/anomaly.ts` compiles with zero TypeScript errors
- [x] `useGetAnomalyQuery` and `useGetAnomalyHistoryQuery` hooks are importable and typed
- [x] `WidgetFloodRisk` renders correctly in both `active` and `offseason` states with mock data
- [x] `WidgetFloodRisk` disclaimer is visible in all states and cannot be dismissed
- [x] `WidgetSnowpackChart` renders all series; the 2023–2024 series is visually distinct
- [x] `WidgetAnomalyCard` renders both active (red) and inactive (grey) states
- [x] `WidgetParameterZScore` renders in all three colour states (green/yellow/red)
- [x] `WidgetAnomalyCalendar` renders a 52-week grid with correct intensity colours
- [x] `/anomaly` page assembles all four sections without layout overflow
- [x] All 52 i18n keys resolve in both `en` and `ru` without missing-key warnings
- [x] Navigation "Anomalies" entry appears; badge appears when `level >= 'high'` or an anomaly is active
- [x] Page polls every 5 minutes (`pollingInterval: 300_000`)
- [x] `yarn build` completes without TypeScript or ESLint errors
- [x] `yarn test` passes (no regressions in existing tests)
