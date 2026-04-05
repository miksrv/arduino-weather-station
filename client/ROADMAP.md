# Frontend Roadmap — Arduino Weather Station Client

Generated: 2026-03-14
Updated: 2026-04-05
Scope: `/client` directory (Next.js 16, React 19, TypeScript 5.9, RTK Query, ECharts, i18next)

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

**File:** `tools/helpers.ts` — lines 15–19

```ts
for (const key in data) {
```

`for...in` iterates all enumerable properties, including prototype-inherited ones. For plain objects this is safe, but it is an anti-pattern. Replace with `Object.keys(data)` or `Object.entries(data)`.

---

### QC-13 · Switch `case` order in `colors.ts` — `undefined` case appears after `default` [Medium]

**File:** `tools/colors.ts` — lines 68–72

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

### PERF-03 · `currentDate` and `yesterdayDate` are module-level constants evaluated once at import time [Medium]

**File:** `tools/date.ts` — lines 10–12

```ts
export const currentDate = dayjs().utc(false).tz(TIME_ZONE)
export const yesterdayDate = currentDate.subtract(1, 'day').toDate()
```

These are computed when the module is first imported and never update. On long-running sessions or after midnight, the dates become stale. Query args using these values do not change, so no re-fetch occurs after midnight.

Fix: convert to functions (`getCurrentDate()`, `getYesterdayDate()`) and call them at query-arg computation time, or store a derived value that includes the current date in component state so it refreshes.

---

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

### FEAT-06 · `heatmap.tsx` `isMobile` uses synchronous `window.innerWidth` without resize listener [Medium]

**File:** `components/widget-heatmap/Heatmap.tsx` — line 33

```ts
const isMobile = isClient && !!(window?.innerWidth && window?.innerWidth < 500)
```

`isMobile` is computed once when `isClient` becomes `true` and never updates on window resize. The heatmap title visibility (`show: !isMobile`) therefore becomes stale after orientation changes. Add a resize listener or use a CSS media query approach.

---

## 5. Security

> All items below were identified during a security audit. Severity levels: **CRITICAL** · **HIGH** · **MEDIUM** · **LOW**

---

### SEC-01 · Missing HTTP security headers — no CSP, X-Frame-Options, HSTS, or X-Content-Type-Options [HIGH]

**File:** `next.config.js`

The `next.config.js` exports no `headers()` function, so every page is served without any protective HTTP headers:

- **Content-Security-Policy** — no restriction on which scripts, styles, or frames may load.
- **X-Frame-Options / CSP `frame-ancestors`** — the application can be embedded in a third-party `<iframe>`, enabling clickjacking attacks.
- **X-Content-Type-Options: nosniff** — browsers may sniff response MIME types.
- **Strict-Transport-Security** — no HSTS; downgrade attacks are possible.
- **Referrer-Policy** — referrer data leaks to third-party domains.
- **Permissions-Policy** — no restrictions on camera, microphone, or geolocation access.

Add a `headers()` export to `next.config.js` setting at minimum `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive `Content-Security-Policy`.

---

### SEC-03 · ECharts tooltip formatters render unescaped API data as raw HTML [MEDIUM]

**Files:** `components/widget-chart/Chart.tsx`, `components/widget-heatmap/Heatmap.tsx`, `components/widget-meteogram/Meteogram.tsx`, `components/widget-precip-chart/WidgetPrecipChart.tsx`, `components/widget-climate/Chart.tsx`

All chart tooltip formatters build HTML strings by concatenating values received directly from the API, then pass the resulting string to ECharts which renders it as `innerHTML` without escaping. If the backend were to return a malicious string, it would execute as JavaScript.

Sanitize or numeric-coerce all values before inserting them into formatter strings (e.g., `Number(value).toFixed(1)` for numeric fields).

---

### SEC-05 · `NEXT_LOCALE` cookie set without `Secure` or `SameSite` flags [LOW]

**File:** `components/language-switcher/LanguageSwitcher.tsx`, line 31

```ts
void setCookie('NEXT_LOCALE', locale)
```

The `setCookie` call passes no options, so the cookie is written without `Secure`, without `SameSite`, and without `HttpOnly`. Pass `{ secure: true, sameSite: 'lax' }` to all `setCookie` calls.

---

### SEC-06 · Application version number exposed in the footer [LOW]

**File:** `components/footer/Footer.tsx`, lines 31–32

The exact `package.json` version string is rendered on every page. This gives any visitor instant visibility into the precise software version. Consider removing the version from the rendered HTML or showing it only in dev mode.

---

### SEC-07 · `ecosystem.config.js` exposes production hostname and internal service port [LOW]

**File:** `client/ecosystem.config.js`

The PM2 deployment config commits the production service name (`meteo.miksoft.pro`) and internal port (`3007`) to the repository. Move deployment-specific config out of the repository or into a secrets-management system.

---

### SEC-08 · `sessionStorage` and `localStorage` data deserialised without runtime schema validation [LOW]

**Files:** `pages/climate.tsx`, `tools/hooks/useLocalStorage.ts`

Both files parse JSON from browser storage and immediately cast the result to a typed interface with no runtime field validation. Add a lightweight runtime validator (e.g., a shape-check function) before casting.

---

## 6. Summary by Priority

### High (fix first)

| ID      | Summary                                                    |
| ------- | ---------------------------------------------------------- |
| SEC-01  | Missing HTTP security headers (CSP, X-Frame-Options, HSTS) |
| FEAT-03 | No error state handling for any RTK Query endpoint         |

### Medium (address in regular sprints)

| ID      | Summary                                                   |
| ------- | --------------------------------------------------------- |
| SEC-03  | ECharts tooltip renders unescaped API data as HTML        |
| QC-03   | `showOverlay` redux field is never dispatched             |
| QC-13   | `undefined` case after `default` in switch is unreachable |
| PERF-03 | `currentDate` / `yesterdayDate` never refresh             |
| FEAT-06 | Heatmap `isMobile` stale after window resize              |

### Low (backlog)

| ID      | Summary                                             |
| ------- | --------------------------------------------------- |
| SEC-05  | `NEXT_LOCALE` cookie missing `Secure`/`SameSite`    |
| SEC-06  | App version number exposed in footer                |
| SEC-07  | `ecosystem.config.js` exposes production port       |
| SEC-08  | Storage deserialisation without schema validation   |
| QC-11   | `for...in` in `encodeQueryData` — use `Object.keys` |
| PERF-06 | No `keepUnusedDataFor` tuning on RTK Query          |
| TEST-05 | `encodeQueryData` missing falsy-value edge case     |
| FEAT-02 | History page missing humidity / wind charts         |
