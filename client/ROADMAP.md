# Frontend Roadmap — Arduino Weather Station Client

Generated: 2026-03-14
Scope: `/client` directory (Next.js 16, React 19, TypeScript 5.9, RTK Query, ECharts, i18next)

---

## Legend

| Priority   | Meaning                                                                           |
| ---------- | --------------------------------------------------------------------------------- |
| **High**   | Bug or convention violation that affects correctness, SEO, or user experience now |
| **Medium** | Quality issue, missing coverage, or UX gap with clear value                       |
| **Low**    | Nice-to-have improvement or cleanup with low urgency                              |

---

## 1. Bugs

## 2. Code Quality

### QC-01 · `any` types in ECharts tooltip formatters — 4 files [High]

**Files:**

- `components/widget-chart/Chart.tsx` lines 54, 67 — `formatter: (params: any)`, `params.forEach((item: any)`
- `components/widget-meteogram/Meteogram.tsx` lines 121, 134 — same pattern
- `components/widget-climate/Chart.tsx` lines 45, 58 — same pattern
- `components/widget-heatmap/Heatmap.tsx` line 151 — same pattern

All four have `// eslint-disable-next-line @typescript-eslint/no-explicit-any` or `// TODO` comments acknowledging the problem. ECharts exports `TopLevelFormatterParams` from `echarts/types/dist/shared` which is the correct type. Replace `any` with the proper ECharts type to eliminate the escape hatches.

---

### QC-02 · Inline styles in many components violate CSS Modules convention [High]

**Convention:** CSS Modules only — no inline styles.

Inline `style={{ ... }}` props exist in:

- `components/widget-sensor/WidgetSensor.tsx` — 7 occurrences (all `Skeleton` props)
- `components/widget-summary/WidgetSummary.tsx` — 6 occurrences (all `Skeleton` props)
- `components/widget-chart/WidgetChart.tsx` — 1 occurrence (`Skeleton`)
- `components/widget-heatmap/WidgetHeatmap.tsx` — 1 occurrence (`Skeleton`)
- `components/widget-meteogram/WidgetMeteogram.tsx` — 1 occurrence (`Skeleton`)
- `components/widget-climate/WidgetClimate.tsx` — 1 occurrence (`Skeleton`)
- `components/app-layout/AppLayout.tsx` — 2 occurrences (overlay/sidebar height)
- `components/wind-direction-icon/WindDirectionIcon.tsx` — 1 (`transform: rotate`)
- `pages/heatmap.tsx` line 91 — `<Select style={{ width: 170 }}>`
- `ui/theme-switcher/Stars.tsx` — 5 occurrences (star positions)

The `Skeleton` occurrences are the most widespread. Extract them to CSS Module classes. The `transform: rotate` in `WindDirectionIcon` and star positions in `Stars` are dynamic values that need CSS custom properties.

---

### QC-03 · `showOverlay` state in Redux slice is never dispatched [Medium]

**File:** `api/applicationSlice.ts` — the `showOverlay?: boolean` field exists in `ApplicationStateProps` but there is no `setShowOverlay` action and nothing dispatches it. `AppLayout` reads `application.showOverlay` which is always `undefined` (falsy). Either add the missing action or remove the dead field and the overlay check in `AppLayout`.

---

### QC-04 · `'Min'` and `'Max'` labels are hardcoded strings, not translated [Medium]

**File:** `components/widget-sensor/WidgetSensor.tsx` — lines 71, 91

```tsx
<span className={styles.title}>Min</span>
<span className={styles.title}>Max</span>
```

These are user-facing strings that should use `useTranslation()`. Add `min` and `max` keys to both locale files.

---

### QC-05 · `'Eng'` and `'Rus'` language labels are hardcoded strings [Medium]

**File:** `components/language-switcher/LanguageSwitcher.tsx` — lines 49, 55

```tsx
{
    ;('Eng')
}
{
    ;('Rus')
}
```

These short labels are intentional abbreviations and effectively language-agnostic, but they still bypass i18n conventions. Add `lang-en` and `lang-ru` keys to both locale files so they can be changed without touching component code.

---

### QC-06 · `'(GMT+5)'` hardcoded in `WidgetSummary` [Medium]

**File:** `components/widget-summary/WidgetSummary.tsx` — line 29

The timezone offset string `'(GMT+5)'` is hardcoded. If the server timezone changes or users in a different region see this widget, the label will be misleading. Derive the offset from `TIME_ZONE` in `tools/date.ts` at runtime, or add a `timezone-label` i18n key.

---

### QC-07 · `'date-only-hour'` key is missing from English locale [High]

**File:** `public/locales/en/common.json`

The key `date-only-hour` is present in `ru/common.json` (`"HH a"`) but absent from `en/common.json`. The English locale uses `"date-full-format": "D MMMM YYYY, h:mm a"` and similar patterns, but `date-only-hour` used in `Chart.tsx` and `Meteogram.tsx` will silently fall back to the key string itself (`"date-only-hour"`) in English. Add `"date-only-hour": "h a"` to `en/common.json`.

---

### QC-08 · `'weather-icon'` i18n key used in Meteogram but not defined in either locale [Medium]

**File:** `components/widget-meteogram/Meteogram.tsx` — line 270

```ts
name: t('weather-icon'),
```

Neither `en/common.json` nor `ru/common.json` defines a `weather-icon` key. The ECharts series name falls back to the raw key string `"weather-icon"`. Add the key to both locale files (e.g. `"Weather icon"` / `"Иконка погоды"`).

---

### QC-09 · Climate page `canonical` URL uses `/history` path [Medium]

See BUG-06 above — tracked separately here as a code quality / SEO issue.

---

### QC-10 · `isValidJSON` is duplicated — exists in both `tools/helpers.ts` and `tools/hooks/useLocalStorage.ts` [Medium]

**Files:** `tools/helpers.ts` (exported), `tools/hooks/useLocalStorage.ts` (local, private copy)

The same function is implemented twice. `useLocalStorage` should import from `tools/helpers` to eliminate the duplication.

---

### QC-11 · `encodeQueryData` uses `for...in` loop which iterates inherited properties [Low]

**File:** `tools/helpers.ts` — lines 14–19

```ts
for (const key in data) {
```

`for...in` iterates all enumerable properties, including prototype-inherited ones. For plain objects this is safe, but it is an anti-pattern. Replace with `Object.keys(data)` or `Object.entries(data)`.

---

### QC-12 · `normalizeDateToBaseYear` is defined after it is used in `widget-climate/Chart.tsx` [Low]

**File:** `components/widget-climate/Chart.tsx` — line 141 calls `normalizeDateToBaseYear`, but the function is defined at line 154. While JavaScript hoisting works for function declarations, this is a named `const` arrow function — the linter or TypeScript `noUndeclaredVars` should catch this. Move the helper to the top of the file.

---

### QC-13 · Switch `case` order in `colors.ts` — `undefined` case appears after `default` [Medium]

**File:** `tools/colors.ts` — lines 75–78

```ts
default:
    return 'grey'
case undefined: {
    throw new Error('Not implemented yet: undefined case')
}
```

The `undefined` case is unreachable because `default` matches first. In TypeScript the union `keyof ApiModel.Sensors | undefined` means `undefined` is a valid argument, but the `default` branch returns before reaching the `undefined` case. Either move `case undefined` above `default`, or handle it with a runtime guard before the switch.

---

### QC-14 · `dangerouslySetInnerHTML` in `_app.tsx` inlines Yandex Metrika script [Low]

**File:** `pages/_app.tsx` — lines 115–120

The analytics snippet is injected via `dangerouslySetInnerHTML`, which bypasses React's XSS protections. While the content is hardcoded and not user-controlled, the pattern is considered poor practice. A `next/script` component with `strategy="afterInteractive"` is the correct approach for third-party scripts in Next.js.

---

## 3. Performance

### PERF-01 · `tableConfig` array in `WidgetForecastTable` is recreated on every render [Medium]

**File:** `components/widget-forecast-table/WidgetForecastTable.tsx` — lines 48–151

`tableConfig` is a plain array literal inside the component function body, not wrapped in `useMemo`. Every parent re-render creates a new array reference and passes it to `<Table>`. Wrap `tableConfig` in `useMemo` (with `[t]` as dependency) to stabilise the reference and prevent `Table` from re-rendering unnecessarily.

---

### PERF-02 · `dayjs.extend()` is called on every render in `_app.tsx` [Medium]

**File:** `pages/_app.tsx` — lines 48–51

```ts
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.locale(...)
```

`dayjs.extend` is idempotent but each call still does a hash-map lookup. These calls belong at module level outside the component, not inside the render cycle.

---

### PERF-03 · `currentDate` and `yesterdayDate` are module-level constants evaluated once at import time [Medium]

**File:** `tools/date.ts` — lines 10–12

```ts
export const currentDate = dayjs().utc(false).tz(TIME_ZONE)
export const yesterdayDate = currentDate.subtract(1, 'day').toDate()
```

These are computed when the module is first imported and never update. On the SSR pass this is fine, but on long-running sessions or after midnight, the dates become stale. `sensors.tsx` and `index.tsx` pass `currentDate` to RTK Query — the query args do not change, so no re-fetch occurs after midnight.

Fix: convert to functions (`getCurrentDate()`, `getYesterdayDate()`) and call them at query-arg computation time, or store a derived value that includes the current date in component state so it refreshes.

---

### PERF-04 · `widgets` array in sensors and index pages is recreated on every render [Low]

**Files:** `pages/sensors.tsx` — lines 42–138, `pages/index.tsx` — lines 53–66

Both pages define a `widgets: WidgetType[]` array inside the component function, but it depends only on `t`. Wrapping in `useMemo` with `[t]` as dependency prevents recreation on every re-render triggered by polling updates.

---

### PERF-05 · ECharts config `baseConfig` in `widget-chart/Chart.tsx` is not memoised [Low]

**File:** `components/widget-chart/Chart.tsx` — lines 35–139

`baseConfig` is a large `EChartsOption` object created inline on every render. It is a dependency of the memoised `config` but is itself not memoised — so `config` recalculates on every render regardless of whether `type`, `data`, or translations changed.

---

### PERF-06 · No RTK Query `keepUnusedDataFor` tuning [Low]

**File:** `api/api.ts`

The default RTK Query `keepUnusedDataFor` is 60 seconds. For a weather station where data changes every 10 minutes, cached data can be served stale for longer. Consider setting `keepUnusedDataFor: 600` (10 minutes) on the `getCurrent` and `getForecast` endpoints to match the polling interval and avoid unnecessary refetches when navigating between pages.

---

## 4. Testing

### TEST-02 · `invertData`, `getTemperatureColor`, `convertHpaToMmHg`, `findMinValue`, `findMaxValue` have no tests [High]

**File:** `tools/weather.ts`

Five exported functions used in chart rendering lack test coverage:

- `invertData` — transforms temperature data; edge cases include all-positive, all-negative, mixed arrays
- `getTemperatureColor` — large lookup table; test boundary values and `undefined` input
- `convertHpaToMmHg` — unit conversion; test zero, typical range, string input
- `findMinValue` / `findMaxValue` — used to set chart Y-axis bounds; test `undefined` data, missing key

---

### TEST-03 · `getWeatherIconUrl` in `WeatherIcon.tsx` has no tests [Medium]

**File:** `components/weather-icon/WeatherIcon.tsx` — exported function `getWeatherIconUrl`

`getWeatherIconUrl` is used in both `WeatherIcon` and `Meteogram`. It has day/night and special-case logic that warrants unit tests: unknown `weatherId`, daytime vs. nighttime URLs, `withoutDayIcon` condition, missing `date`.

---

### TEST-04 · `formatDateFromUTC`, `timeAgo` in `tools/date.ts` have no tests [Medium]

**File:** `tools/date.ts`

`formatDateFromUTC` (used in chart formatters) and `timeAgo` (used in `AppBar`) are not covered by `date.test.ts`. Add tests covering `undefined` input, valid timestamps, and zero values.

---

### TEST-05 · `encodeQueryData` edge case: falsy non-null values (`0`, `false`) [Medium]

**File:** `tools/helpers.ts` — line 17

```ts
if (data[key] !== undefined && data[key] != null) {
```

The current test suite does not cover numeric `0` or boolean `false` values. Both are valid query parameters but are currently included (correctly) — however there is no regression test to guard against accidentally changing the check to a truthiness test.

---

### TEST-06 · `useLocalStorage` hook has no tests [Medium]

**File:** `tools/hooks/useLocalStorage.ts`

This hook handles localStorage read/write/remove with JSON parsing, initial state functions, and SSR guards (`typeof window === 'undefined'`). It is used in both `_app.tsx` and `LanguageSwitcher`. Add tests using `jest.spyOn(window, 'localStorage', 'get')` or a localStorage mock.

---

### TEST-07 · `useClientOnly` hook has no tests [Low]

**File:** `tools/hooks/useClientOnly.ts`

Simple hook but worth a one-case test: returns `false` on first render, `true` after mount. This guards `ThemeSwitcher` visibility and `window.innerWidth` access.

---

### TEST-08 · `WidgetSensor`, `WidgetSummary`, `WidgetForecastTable` have no component tests [Medium]

These three components are the most user-visible output on every page. Basic rendering tests covering loading state vs. populated state would guard against regressions in the `formatter`, `minMax`, and table column rendering paths.

---

## 5. Features / Enhancements

### FEAT-01 · Climate page has no deduplication or loading state while fetching years sequentially [Medium]

**File:** `pages/climate.tsx`

The sequential-fetch pattern (fetch year 0 → set index 1 → fetch year 1 → …) works but has UX gaps:

- While loading subsequent years the chart shows partial data with no progress indicator
- Fast navigation away and back resets all accumulated state and re-fetches from year 0
- The `loading` prop passed to `WidgetClimate` is only `true` for the first year

Add a progress indicator (e.g. "Loading 2/3 years…") and consider caching accumulated results in `sessionStorage` or RTK Query with manual cache updates.

---

### FEAT-02 · History page has no chart for humidity, wind, or UV index [Low]

**File:** `pages/history.tsx`

Only `temperature`, `clouds`, and `pressure` charts are shown. The `WidgetChart` component supports only these three types (`ChartTypes = 'temperature' | 'clouds' | 'pressure'`). Extending `ChartTypes` and adding chart configs for `humidity` and `windSpeed` would make the history page more useful.

---

### FEAT-03 · No error state handling for any RTK Query endpoint [High]

**Files:** All pages using `API.useGetCurrentQuery`, `useGetHistoryQuery`, `useGetForecastQuery`, `useGetHeatmapQuery`

None of the pages or widgets check `isError` from RTK Query. If the API is unreachable, the component silently shows the loading skeleton forever. Add an error UI (e.g. a banner or empty state with retry) for at least the main page and history page.

---

### FEAT-04 · `WeatherIcon` renders a broken image when `weatherId` is not in the mapping [Medium]

**File:** `components/weather-icon/WeatherIcon.tsx` — lines 85–88

```ts
const name = weatherIconsMapping[weatherId]
```

If `weatherId` has no entry in `weatherIconsMapping`, `name` is `undefined` and the URL becomes `/icons/undefined.svg`, which results in a 404 and a broken image. Add a fallback (e.g. map to `'unknown'` or show nothing).

---

### FEAT-05 · `AppBar` always fetches current data, even on pages that also fetch it [Low]

**File:** `components/app-bar/AppBar.tsx` — line 26

`AppBar` calls `API.useGetCurrentQuery` with `pollingInterval`. Every page that also calls `useGetCurrentQuery` (index, sensors) fires the same query. RTK Query deduplicates this at the network level, but the component still subscribes, creating an additional active subscription. This is acceptable but worth being aware of — if `AppBar` is removed or the polling interval changes, the AppBar and page subscriptions must be updated together.

---

### FEAT-06 · `heatmap.tsx` `isMobile` uses synchronous `window.innerWidth` without resize listener [Medium]

**File:** `components/widget-heatmap/Heatmap.tsx` — line 33

```ts
const isMobile = isClient && !!(window?.innerWidth && window?.innerWidth < 500)
```

`isMobile` is computed once when `isClient` becomes `true` and never updates on window resize. The heatmap title visibility (`show: !isMobile`) therefore becomes stale after orientation changes. Add a resize listener or use a CSS media query approach.

---

### FEAT-07 · No `<noscript>` fallback for chart-heavy pages [Low]

**Files:** `pages/history.tsx`, `pages/heatmap.tsx`, `pages/forecast.tsx`

All meaningful content on these pages is rendered by ECharts inside `<canvas>`. Users with JavaScript disabled (or crawlers that do not execute JS) see nothing. Adding `<noscript>` messages or a server-side rendered table summary would improve accessibility and SEO.

---

### FEAT-08 · `WidgetSensor` `'??'` fallback is not i18n-aware [Low]

**File:** `components/widget-sensor/WidgetSensor.tsx` — lines 62–64

```tsx
formatter(currentValue ?? '??')(currentValue ?? '??')
```

The `'??'` placeholder is a hardcoded non-localised string. It could be replaced with `t('no-data')` or an em-dash if a consistent "no data" pattern is desired across the application.

---

## 6. Summary by Priority

### High (fix first)

| ID      | Summary                                            |
| ------- | -------------------------------------------------- |
| QC-01   | `any` types in ECharts tooltip formatters          |
| QC-02   | Inline styles violate CSS Modules convention       |
| QC-07   | `date-only-hour` key missing from English locale   |
| TEST-02 | 5 weather utility functions have no tests          |
| FEAT-03 | No error state handling for any RTK Query endpoint |

### Medium (address in regular sprints)

| ID      | Summary                                                   |
| ------- | --------------------------------------------------------- |
| QC-03   | `showOverlay` redux field is never dispatched             |
| QC-04   | `Min`/`Max` labels not translated                         |
| QC-05   | `Eng`/`Rus` labels not translated                         |
| QC-06   | `(GMT+5)` hardcoded in WidgetSummary                      |
| QC-08   | `weather-icon` i18n key missing from both locales         |
| QC-10   | `isValidJSON` duplicated in two files                     |
| QC-13   | `undefined` case after `default` in switch is unreachable |
| PERF-01 | `tableConfig` recreated on every render                   |
| PERF-02 | `dayjs.extend` called inside render cycle                 |
| PERF-03 | `currentDate` / `yesterdayDate` never refresh             |
| TEST-03 | `getWeatherIconUrl` has no tests                          |
| TEST-04 | `formatDateFromUTC` / `timeAgo` have no tests             |
| TEST-05 | `encodeQueryData` missing falsy-value edge case           |
| TEST-06 | `useLocalStorage` hook has no tests                       |
| TEST-08 | Key widgets have no component tests                       |
| FEAT-04 | `WeatherIcon` renders broken image for unknown IDs        |
| FEAT-06 | Heatmap `isMobile` stale after window resize              |

### Low (backlog)

| ID      | Summary                                             |
| ------- | --------------------------------------------------- |
| QC-11   | `for...in` in `encodeQueryData` — use `Object.keys` |
| QC-12   | `normalizeDateToBaseYear` defined after first use   |
| QC-14   | Yandex Metrika should use `next/script`             |
| PERF-04 | `widgets` array recreated on every render in pages  |
| PERF-05 | `baseConfig` in Chart.tsx not memoised              |
| PERF-06 | No `keepUnusedDataFor` tuning on RTK Query          |
| TEST-07 | `useClientOnly` hook has no tests                   |
| FEAT-01 | Climate page loading progress UX                    |
| FEAT-02 | History page missing humidity / wind charts         |
| FEAT-05 | AppBar duplicate RTK Query subscription awareness   |
| FEAT-07 | No `<noscript>` fallback for chart pages            |
| FEAT-08 | `'??'` fallback not i18n-aware in WidgetSensor      |
