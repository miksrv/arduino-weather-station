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

### QC-03 · `showOverlay` state in Redux slice is never dispatched [Medium]

**File:** `api/applicationSlice.ts` — the `showOverlay?: boolean` field exists in `ApplicationStateProps` but there is no `setShowOverlay` action and nothing dispatches it. `AppLayout` reads `application.showOverlay` which is always `undefined` (falsy). Either add the missing action or remove the dead field and the overlay check in `AppLayout`.

---

### QC-08 · `'weather-icon'` i18n key used in Meteogram but not defined in either locale [Medium]

**File:** `components/widget-meteogram/Meteogram.tsx` — line 270

```ts
name: t('weather-icon'),
```

Neither `en/common.json` nor `ru/common.json` defines a `weather-icon` key. The ECharts series name falls back to the raw key string `"weather-icon"`. Add the key to both locale files (e.g. `"Weather icon"` / `"Иконка погоды"`).

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

### PERF-03 · `currentDate` and `yesterdayDate` are module-level constants evaluated once at import time [Medium]

**File:** `tools/date.ts` — lines 10–12

```ts
export const currentDate = dayjs().utc(false).tz(TIME_ZONE)
export const yesterdayDate = currentDate.subtract(1, 'day').toDate()
```

These are computed when the module is first imported and never update. On the SSR pass this is fine, but on long-running sessions or after midnight, the dates become stale. `sensors.tsx` and `index.tsx` pass `currentDate` to RTK Query — the query args do not change, so no re-fetch occurs after midnight.

Fix: convert to functions (`getCurrentDate()`, `getYesterdayDate()`) and call them at query-arg computation time, or store a derived value that includes the current date in component state so it refreshes.

---

### PERF-06 · No RTK Query `keepUnusedDataFor` tuning [Low]

**File:** `api/api.ts`

The default RTK Query `keepUnusedDataFor` is 60 seconds. For a weather station where data changes every 10 minutes, cached data can be served stale for longer. Consider setting `keepUnusedDataFor: 600` (10 minutes) on the `getCurrent` and `getForecast` endpoints to match the polling interval and avoid unnecessary refetches when navigating between pages.

---

## 4. Testing

### TEST-03 · `getWeatherIconUrl` in `WeatherIcon.tsx` has no tests [Medium]

**File:** `components/weather-icon/WeatherIcon.tsx` — exported function `getWeatherIconUrl`

`getWeatherIconUrl` is used in both `WeatherIcon` and `Meteogram`. It has day/night and special-case logic that warrants unit tests: unknown `weatherId`, daytime vs. nighttime URLs, `withoutDayIcon` condition, missing `date`.

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
| FEAT-03 | No error state handling for any RTK Query endpoint |

### Medium (address in regular sprints)

| ID      | Summary                                                   |
| ------- | --------------------------------------------------------- |
| QC-03   | `showOverlay` redux field is never dispatched             |
| QC-08   | `weather-icon` i18n key missing from both locales         |
| QC-13   | `undefined` case after `default` in switch is unreachable |
| PERF-03 | `currentDate` / `yesterdayDate` never refresh             |
| TEST-03 | `getWeatherIconUrl` has no tests                          |
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
| PERF-06 | No `keepUnusedDataFor` tuning on RTK Query          |
| TEST-07 | `useClientOnly` hook has no tests                   |
| FEAT-02 | History page missing humidity / wind charts         |
| FEAT-05 | AppBar duplicate RTK Query subscription awareness   |
| FEAT-07 | No `<noscript>` fallback for chart pages            |
| FEAT-08 | `'??'` fallback not i18n-aware in WidgetSensor      |
