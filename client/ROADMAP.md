# Frontend Roadmap — Arduino Weather Station Client

Generated: 2026-03-14
Updated: 2026-11-05
Scope: `/client` directory (Next.js 16, React 19, TypeScript 6.0, RTK Query, ECharts, i18next)

---

## Legend

| Priority   | Meaning                                                                           |
| ---------- | --------------------------------------------------------------------------------- |
| **High**   | Bug or convention violation that affects correctness, SEO, or user experience now |
| **Medium** | Quality issue, missing coverage, or UX gap with clear value                       |
| **Low**    | Nice-to-have improvement or cleanup with low urgency                              |

---

## 1. Code Quality

### QC-03 · `showOverlay` state in Redux slice is never dispatched [Medium]

**File:** `api/applicationSlice.ts` — the `showOverlay?: boolean` field exists in `ApplicationStateProps` but there is no `setShowOverlay` action and nothing dispatches it. Either add the missing action or remove the dead field.

---

### QC-11 · `encodeQueryData` uses `for...in` loop which iterates inherited properties [Low]

**File:** `tools/helpers.ts` — lines 18–22

```ts
for (const key in data) {
```

`for...in` iterates all enumerable properties, including prototype-inherited ones. For plain objects this is safe, but it is an anti-pattern. Replace with `Object.keys(data)` or `Object.entries(data)`.

---

### QC-13 · Switch `case` order in `colors.ts` — `undefined` case appears after `default` [Medium]

**File:** `tools/colors.ts` — lines 105–109

```ts
default:
    return 'grey'
case undefined: {
    throw new Error('Not implemented yet: undefined case')
}
```

The `undefined` case is unreachable because `default` matches first. Either move `case undefined` above `default`, or handle it with a runtime guard before the switch.

---

## 2. Performance

### PERF-06 · No RTK Query `keepUnusedDataFor` tuning [Low]

**File:** `api/api.ts`

The default RTK Query `keepUnusedDataFor` is 60 seconds. For a weather station where data changes every 10 minutes, cached data can be served stale for longer. Consider setting `keepUnusedDataFor: 600` (10 minutes) on the endpoints to match the polling interval and avoid unnecessary refetches when navigating between pages.

---

## 3. Testing

### TEST-05 · `encodeQueryData` edge case: falsy non-null values (`0`, `false`) [Low]

**File:** `tools/helpers.test.ts`

The current test suite does not cover numeric `0` or boolean `false` values. Both are valid query parameters and are currently included (correctly) — however there is no regression test to guard against accidentally changing the check to a truthiness test. Add tests like:

```ts
it('includes numeric 0 as valid value', () => {
    expect(encodeQueryData({ count: 0 })).toBe('?count=0')
})

it('includes boolean false as valid value', () => {
    expect(encodeQueryData({ active: false })).toBe('?active=false')
})
```

---

## 4. Features / Enhancements

### FEAT-02 · History page has no chart for humidity, wind, or UV index [Low]

**File:** `pages/history.tsx`

Only `temperature`, `clouds`, and `pressure` charts are shown. The `WidgetChart` component supports only these three types (`ChartTypes = 'temperature' | 'clouds' | 'pressure'`). Extending `ChartTypes` and adding chart configs for `humidity` and `windSpeed` would make the history page more useful.

---

### FEAT-03 · No error state handling for any RTK Query endpoint [High]

**Files:** All pages using `API.useGetCurrentQuery`, `useGetHistoryQuery`, `useGetForecastQuery`, `useGetHeatmapQuery`

None of the pages or widgets check `isError` from RTK Query. If the API is unreachable, the component silently shows the loading skeleton forever. Add an error UI (e.g. a banner or empty state with retry) for at least the main page and history page.

---

## 5. Security

> All items below were identified during a security audit. Severity levels: **CRITICAL** · **HIGH** · **MEDIUM** · **LOW**

---

### SEC-01 · Content-Security-Policy is report-only [HIGH]

**File:** `next.config.js`

`headers()` already sends `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` and (in production) `Strict-Transport-Security`, but the CSP is only sent as `Content-Security-Policy-Report-Only`, so nothing is actually blocked. Once the reports are clean, switch it to an enforcing `Content-Security-Policy` header.

---

### SEC-03 · ECharts tooltip formatters render unescaped API data as raw HTML [MEDIUM]

**Files:** `components/widget-chart/Chart.tsx`, `components/widget-heatmap/Heatmap.tsx`, `components/widget-precip-chart/WidgetPrecipChart.tsx`, `components/widget-climate/Chart.tsx`

All chart tooltip formatters build HTML strings by concatenating values received directly from the API, then pass the resulting string to ECharts which renders it as `innerHTML` without escaping. If the backend were to return a malicious string, it would execute as JavaScript.

Sanitize or numeric-coerce all values before inserting them into formatter strings (e.g., `Number(value).toFixed(1)` for numeric fields).

---

### SEC-05 · `NEXT_LOCALE` cookie set without the `Secure` flag [LOW]

**File:** `components/language-switcher/LanguageSwitcher.tsx`, line 42

```ts
void setCookie('NEXT_LOCALE', locale, { maxAge: LOCALE_COOKIE_MAX_AGE, path: '/', sameSite: 'lax' })
```

`sameSite: 'lax'` is already set, but the cookie is still written without `Secure`. Add `secure: true`.

---

### SEC-06 · Application version number exposed in the footer [LOW]

**File:** `components/footer/Footer.tsx`, line 40

The exact `package.json` version string is rendered on every page. This gives any visitor instant visibility into the precise software version. Consider removing the version from the rendered HTML or showing it only in dev mode.

---

### SEC-07 · `ecosystem.config.js` exposes production hostname and internal service port [LOW]

**File:** `client/ecosystem.config.js`

The PM2 deployment config commits the production service name (`meteo.miksoft.pro`) and internal port (`3007`) to the repository. Move deployment-specific config out of the repository or into a secrets-management system.

---

### SEC-08 · `localStorage` data deserialised without runtime schema validation [LOW]

**Files:** `hooks/useLocalStorage.ts`, `tools/localstorage.ts`

Both files parse JSON from `localStorage` and immediately cast the result to a typed interface with no runtime field validation. Add a lightweight runtime validator (e.g., a shape-check function) before casting.

---

## 6. Summary by Priority

### High (fix first)

| ID      | Summary                                            |
| ------- | -------------------------------------------------- |
| SEC-01  | CSP is report-only — switch to enforcing           |
| FEAT-03 | No error state handling for any RTK Query endpoint |

### Medium (address in regular sprints)

| ID     | Summary                                                   |
| ------ | --------------------------------------------------------- |
| SEC-03 | ECharts tooltip renders unescaped API data as HTML        |
| QC-03  | `showOverlay` redux field is never dispatched             |
| QC-13  | `undefined` case after `default` in switch is unreachable |

### Low (backlog)

| ID      | Summary                                             |
| ------- | --------------------------------------------------- |
| SEC-05  | `NEXT_LOCALE` cookie missing `Secure`               |
| SEC-06  | App version number exposed in footer                |
| SEC-07  | `ecosystem.config.js` exposes production port       |
| SEC-08  | Storage deserialisation without schema validation   |
| QC-11   | `for...in` in `encodeQueryData` — use `Object.keys` |
| PERF-06 | No `keepUnusedDataFor` tuning on RTK Query          |
| TEST-05 | `encodeQueryData` missing falsy-value edge case     |
| FEAT-02 | History page missing humidity / wind charts         |
