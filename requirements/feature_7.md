# Feature 7: Long-Term Climate Change Visualizations

## Overview

Expand the `/climate` page from a single temperature trend line into a **multi-widget climate dashboard** that makes long-term environmental change immediately visible and scientifically compelling.

Five new widgets are added to the page, each targeting a distinct dimension of climate change supported by the station's recorded data:

| Widget | What it shows |
|---|---|
| **Warming Stripes** | Annual mean temperature encoded as color — the most iconic climate graphic |
| **Annual Temperature Anomaly** | Year-by-year deviation from the long-term baseline, red/blue bars |
| **Monthly Climate Normals Band** | Historical envelope (min/avg/max per month) vs. current-year actual |
| **Annual Precipitation Trend** | Total yearly rainfall with a linear regression trend line |
| **Extreme Event Frequency** | Count of frost days, hot days, and heavy-rain days per year |

All five widgets are fed by a single new `GET /climate` API endpoint that returns pre-aggregated statistics computed server-side from `daily_averages`, avoiding the need to ship thousands of raw rows to the browser.

The existing temperature trend chart (`WidgetClimate`) is retained as-is; the new widgets are placed below it.

---

## Motivation

- The current `/climate` page shows only temperature and only as raw daily points. It requires the user to mentally extract trend information from a dense multi-line chart.
- The five proposed visualizations are the standard toolkit used by NOAA, the Met Office, and climate science communicators to make trend data legible to non-specialists.
- **Warming stripes**, invented by Ed Hawkins, are the single most recognized climate graphic in the world — even a casual visitor immediately understands the meaning of a widening red band.
- **Anomaly bars** make warming rate visible: a chart going from blue to red across years is unmistakable even without reading axis labels.
- **Monthly normals bands** answer the question visitors actually ask: "Is this year's weather unusual compared to past years?"
- **Precipitation trend** and **extreme event frequency** document changes beyond temperature — drought risk, flood risk, and agricultural impact.
- All computations use only the already-recorded `daily_averages` table; no new sensors or external data sources are required.

---

## Scope

### New API Endpoint

**`GET /climate`**

Returns pre-aggregated climate statistics across all available years and months.

#### Query Parameters

None. The endpoint always covers the full available history (all years in `daily_averages`).

#### Response Shape

```json
{
  "years": [
    {
      "year": 2022,
      "avgTemp": 9.2,
      "minTemp": -22.3,
      "maxTemp": 38.1,
      "tempAnomaly": -0.4,
      "totalPrecip": 387.2,
      "precipDays": 89,
      "frostDays": 84,
      "hotDays": 12,
      "heavyRainDays": 7,
      "avgPressure": 1015.2,
      "avgHumidity": 68.4,
      "avgWindSpeed": 3.8,
      "avgClouds": 61.3
    }
  ],
  "monthlyNormals": [
    {
      "month": 1,
      "avgTemp": -8.4,
      "minTemp": -22.3,
      "maxTemp": 3.2,
      "avgPrecip": 28.4,
      "avgClouds": 72.1,
      "avgWindSpeed": 4.1
    }
  ],
  "baselineAvgTemp": 9.6,
  "availableYears": [2022, 2023, 2024, 2025, 2026]
}
```

**Field definitions:**

| Field | Definition |
|---|---|
| `avgTemp` | Mean of all daily `temperature` values for the year |
| `minTemp` | Minimum daily `temperature` recorded that year |
| `maxTemp` | Maximum daily `temperature` recorded that year |
| `tempAnomaly` | `avgTemp − baselineAvgTemp` (deviation from the all-years grand mean) |
| `totalPrecip` | Sum of all daily `precipitation` values |
| `precipDays` | Days where `precipitation >= 0.1 mm` |
| `frostDays` | Days where `temperature < 0°C` |
| `hotDays` | Days where `temperature >= 30°C` |
| `heavyRainDays` | Days where `precipitation >= 10 mm` |
| `monthlyNormals[].avgTemp` | Grand mean of `temperature` for that calendar month across all years |
| `monthlyNormals[].minTemp` | Minimum daily temperature ever recorded in that calendar month |
| `monthlyNormals[].maxTemp` | Maximum daily temperature ever recorded in that calendar month |
| `baselineAvgTemp` | Grand mean of annual `avgTemp` across all years — the anomaly zero line |

---

## Backend Requirements

### Controller: `Climate` (`server/app/Controllers/Climate.php`)

- Extends `ResourceController`.
- Single public method `index()` → `GET /climate`.
- Delegates all computation to `ClimateModel`.
- File-based cache: TTL = `0` (indefinite) — this data only changes when a new year's data appears, which at most happens once per year.
- Cache key: `'climate_index'`.

```php
public const CACHE_TTL = 0;

public function index(): ResponseInterface
{
    $cacheKey = 'climate_index';
    $cached   = cache()->get($cacheKey);

    if ($cached !== null) {
        return $this->respond($cached);
    }

    try {
        $model    = new ClimateModel();
        $response = $model->getClimateStats();

        cache()->save($cacheKey, $response, self::CACHE_TTL);

        return $this->respond($response);
    } catch (\Exception $e) {
        log_message('error', 'Climate::index error: ' . $e->getMessage());
        return $this->failServerError('An error occurred while retrieving climate data.');
    }
}
```

### Model: `ClimateModel` (`server/app/Models/ClimateModel.php`)

All queries target `daily_averages`.

**Annual stats query:**

```sql
SELECT
    YEAR(date)                          AS year,
    AVG(temperature)                    AS avg_temp,
    MIN(temperature)                    AS min_temp,
    MAX(temperature)                    AS max_temp,
    SUM(precipitation)                  AS total_precip,
    SUM(precipitation >= 0.1)           AS precip_days,
    SUM(temperature < 0)                AS frost_days,
    SUM(temperature >= 30)              AS hot_days,
    SUM(precipitation >= 10)            AS heavy_rain_days,
    AVG(pressure)                       AS avg_pressure,
    AVG(humidity)                       AS avg_humidity,
    AVG(wind_speed)                     AS avg_wind_speed,
    AVG(clouds)                         AS avg_clouds
FROM daily_averages
GROUP BY YEAR(date)
ORDER BY year ASC;
```

**Monthly normals query (all-time per calendar month):**

```sql
SELECT
    MONTH(date)     AS month,
    AVG(temperature) AS avg_temp,
    MIN(temperature) AS min_temp,
    MAX(temperature) AS max_temp,
    AVG(precipitation) AS avg_precip,
    AVG(clouds)      AS avg_clouds,
    AVG(wind_speed)  AS avg_wind_speed
FROM daily_averages
GROUP BY MONTH(date)
ORDER BY month ASC;
```

**Baseline:** computed in PHP as `array_sum(array_column($years, 'avgTemp')) / count($years)`. Temperature anomaly for each year = `round($year['avgTemp'] - $baseline, 2)`.

**Methods:**

- `getClimateStats(): array` — orchestrates all sub-queries and returns the full response array
- `_getAnnualStats(): array` — runs the annual SQL query
- `_getMonthlyNormals(): array` — runs the monthly normals SQL query

### Route

```php
$routes->get('climate',    'Climate::index');
$routes->options('climate', static function () {});
```

### PHPUnit Tests (`server/tests/unit/ClimateModelTest.php`)

- `testFrostDaysCountIsCorrect` — mock rows with mixed temperatures; assert frost day count.
- `testHotDaysCountIsCorrect` — assert hot day threshold (≥ 30°C).
- `testTempAnomalySignIsCorrect` — year with avgTemp below baseline yields negative anomaly.
- `testMonthlyNormalsHas12Entries` — result always contains exactly 12 months.
- `testTotalPrecipIsSumNotAverage` — verify SUM semantics on aggregation.

---

## Frontend Requirements

### Updated Page: `/climate` (`client/pages/climate.tsx`)

- Keep all existing data-loading logic (year-by-year fetch, session cache, progress bar, `WidgetClimate`).
- Add one new RTK Query call: `API.useGetClimateQuery()` (no arguments).
- Pass the result to the five new widgets below `WidgetClimate`.
- New widgets render immediately on first paint if the RTK cache is warm; otherwise they show a skeleton loader.

Layout after the change:

```
[Existing WidgetClimate — multi-year temperature line chart]

[WidgetWarmingStripes]
[WidgetAnomalyBars]
[WidgetMonthlyNormals]
[WidgetPrecipitationTrend]
[WidgetExtremeEvents]
```

---

### Widget 1: `WidgetWarmingStripes` (`client/components/widget-warming-stripes/`)

**What it shows:** One vertical bar per year. Bar color maps the year's `avgTemp` onto a diverging palette (deep blue = coldest year, deep red = hottest year, white = baseline). No axes, no numbers — pure color. A legend strip below the chart shows the temperature scale.

**Chart type:** ECharts `custom` renderer or a simple CSS flexbox of colored `<div>` elements (the latter is simpler and pixel-perfect).

**Data consumed:** `ClimateResponse.years[].{ year, avgTemp }`

**Interaction:** Hovering a stripe shows a tooltip with the year and `avgTemp`.

**Visual reference:** Ed Hawkins' "Show Your Stripes" — the most widely shared climate graphic.

**Props:**
```typescript
interface WidgetWarmingStripesProps {
  data?: ClimateYearStat[]
  loading?: boolean
}
```

---

### Widget 2: `WidgetAnomalyBars` (`client/components/widget-anomaly-bars/`)

**What it shows:** A bar chart with one bar per year. Bars above zero (warmer than baseline) are rendered in red; bars below zero are in blue. A dashed horizontal line marks zero. A linear trend line (computed on the frontend via simple least-squares) is overlaid as a thin line series to make the warming direction explicit.

**Chart type:** ECharts `bar` + `line` (dual series on the same chart).

**Data consumed:** `ClimateResponse.years[].{ year, tempAnomaly }`, `ClimateResponse.baselineAvgTemp`

**Y-axis label:** `+N.N °C` / `−N.N °C`

**Props:**
```typescript
interface WidgetAnomalyBarsProps {
  data?: ClimateYearStat[]
  baselineAvgTemp?: number
  loading?: boolean
}
```

---

### Widget 3: `WidgetMonthlyNormals` (`client/components/widget-monthly-normals/`)

**What it shows:** A band chart displaying the historical envelope for each calendar month:

- **Grey shaded band:** historical `minTemp` → `maxTemp` (all-time extremes)
- **Dark line:** historical `avgTemp` per month (the climatological normal)
- **Accent color line:** the current year's actual monthly mean (computed client-side from the existing `allData` already loaded on the climate page)

This answers "how does this year compare to every previous year?" at a glance.

**Chart type:** ECharts with three series — two boundary lines forming a shaded area (`areaStyle` on the upper bound), plus two `line` series for the normal and current year.

**Data consumed:**
- `ClimateResponse.monthlyNormals[]` for the historical envelope and normal line
- Current-year monthly averages computed on the frontend from the existing `ClimateType[]` data already loaded by the page (no extra API call)

**X-axis:** 12 month labels (Jan–Dec), locale-aware via `t('month-short-N')`.

**Props:**
```typescript
interface WidgetMonthlyNormalsProps {
  normals?: ClimateMonthlyNormal[]
  currentYearMonthly?: { month: number; avgTemp: number }[]
  loading?: boolean
}
```

---

### Widget 4: `WidgetPrecipitationTrend` (`client/components/widget-precipitation-trend/`)

**What it shows:** A bar chart of total annual precipitation (`totalPrecip`) per year, with a linear regression trend line overlaid. Colors bars by deviation from the mean — years with above-average rainfall in blue, below-average in amber.

**Chart type:** ECharts `bar` + `line`.

**Data consumed:** `ClimateResponse.years[].{ year, totalPrecip }`

**Y-axis label:** mm

**Trend line:** computed client-side using simple linear regression over `(yearIndex, totalPrecip)` pairs.

**Props:**
```typescript
interface WidgetPrecipitationTrendProps {
  data?: ClimateYearStat[]
  loading?: boolean
}
```

---

### Widget 5: `WidgetExtremeEvents` (`client/components/widget-extreme-events/`)

**What it shows:** A grouped bar chart with three bar series per year:
- **Blue:** frost days (`temperature < 0°C`)
- **Red:** hot days (`temperature ≥ 30°C`)
- **Teal:** heavy-rain days (`precipitation ≥ 10 mm`)

Shows whether the frequency of extremes is increasing or decreasing over the years.

**Chart type:** ECharts `bar` with `barGap` and three named series.

**Data consumed:** `ClimateResponse.years[].{ year, frostDays, hotDays, heavyRainDays }`

**Props:**
```typescript
interface WidgetExtremeEventsProps {
  data?: ClimateYearStat[]
  loading?: boolean
}
```

---

### New RTK Query Endpoint (`client/api/endpoints/Climate.ts`)

```typescript
export interface ClimateYearStat {
  year: number
  avgTemp: number
  minTemp: number
  maxTemp: number
  tempAnomaly: number
  totalPrecip: number
  precipDays: number
  frostDays: number
  hotDays: number
  heavyRainDays: number
  avgPressure: number
  avgHumidity: number
  avgWindSpeed: number
  avgClouds: number
}

export interface ClimateMonthlyNormal {
  month: number
  avgTemp: number
  minTemp: number
  maxTemp: number
  avgPrecip: number
  avgClouds: number
  avgWindSpeed: number
}

export interface ClimateResponse {
  years: ClimateYearStat[]
  monthlyNormals: ClimateMonthlyNormal[]
  baselineAvgTemp: number
  availableYears: number[]
}
```

Endpoint registration in `api.ts`:

```typescript
getClimate: builder.query<ClimateResponse, void>({
  query: () => 'climate',
  providesTags: ['Climate']
})
```

No polling — climate statistics change at most daily; standard RTK Query cache (60 s) is sufficient.

---

## i18n Requirements

Add to both `public/locales/en/common.json` and `public/locales/ru/common.json`:

```json
"climate-dashboard":           "Climate Dashboard",
"climate-page-description":    "Long-term climate change charts for {{location}} — warming trends, temperature anomalies, precipitation history, and extreme event frequency",
"warming-stripes":             "Warming Stripes",
"warming-stripes-description": "Annual mean temperature relative to the {{baseline}}°C baseline. Each stripe is one year.",
"temp-anomaly":                "Temperature Anomaly",
"temp-anomaly-description":    "Deviation from the long-term mean ({{baseline}}°C). Red = warmer than average, blue = cooler.",
"monthly-normals":             "Monthly Climate Normals",
"monthly-normals-description": "Grey band: all-time min/max. Dark line: historical average. Colored line: current year.",
"precipitation-trend":         "Annual Precipitation",
"precipitation-trend-description": "Total yearly rainfall in mm with linear trend.",
"extreme-events":              "Extreme Event Days per Year",
"extreme-events-description":  "Frost days (< 0°C), hot days (≥ 30°C), and heavy-rain days (≥ 10 mm).",
"frost-days":                  "Frost days",
"hot-days":                    "Hot days",
"heavy-rain-days":             "Heavy rain days",
"baseline-avg":                "Baseline {{value}}°C",
"trend-warming":               "Trend: warming",
"trend-cooling":               "Trend: cooling",
"trend-neutral":               "Trend: stable",
"current-year":                "This year",
"historical-normal":           "Historical normal",
"historical-range":            "Historical range",
"month-short-1":               "Jan",
"month-short-2":               "Feb",
"month-short-3":               "Mar",
"month-short-4":               "Apr",
"month-short-5":               "May",
"month-short-6":               "Jun",
"month-short-7":               "Jul",
"month-short-8":               "Aug",
"month-short-9":               "Sep",
"month-short-10":              "Oct",
"month-short-11":              "Nov",
"month-short-12":              "Dec"
```

*(Russian translations follow the same keys with Cyrillic values.)*

---

## Acceptance Criteria

1. `GET /climate` returns all five top-level fields (`years`, `monthlyNormals`, `baselineAvgTemp`, `availableYears`).
2. `tempAnomaly` for each year equals `avgTemp − baselineAvgTemp`, rounded to two decimal places.
3. `frostDays`, `hotDays`, and `heavyRainDays` use the thresholds defined in this document (< 0, ≥ 30, ≥ 10).
4. `totalPrecip` is a **sum**, not an average.
5. The response is cached indefinitely (TTL = 0) on the server.
6. **Warming Stripes:** each stripe is colored on a continuous blue→white→red scale anchored to the coldest and hottest recorded annual means; hovering shows the year and mean temperature.
7. **Anomaly Bars:** bars above zero are red, bars below zero are blue; the zero line is visible; a trend line is overlaid.
8. **Monthly Normals:** the grey band correctly represents all-time min/max (not standard deviation); the current-year line uses the data already loaded on the page (no extra request).
9. **Precipitation Trend:** bars are colored relative to the multi-year mean (above = blue, below = amber); the trend line direction is confirmed by a label ("Trend: warming / cooling / stable").
10. **Extreme Events:** three grouped bars per year; all thresholds match the API definition.
11. All five widgets render a skeleton loader while data is loading.
12. Both `en` and `ru` translations are present for all new keys.
13. PHPUnit tests cover all five threshold/aggregation rules listed under `ClimateModelTest`.
