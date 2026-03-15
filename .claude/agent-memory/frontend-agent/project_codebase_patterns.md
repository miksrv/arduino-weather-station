---
name: frontend-codebase-patterns
description: Key conventions, architectural decisions, and recurring patterns found in the client/ Next.js codebase during the 2026-03-14 audit
type: project
---

## Architecture

RTK Query is the exclusive API layer. All endpoints live in `api/api.ts`. The `Locale` header is injected via `prepareHeaders` using the `application.locale` Redux state. `next-redux-wrapper` wraps the store for SSR; every page's `getServerSideProps` dispatches `setLocale(locale)` before rendering so the correct locale header is sent on SSR prefetches.

## API Type Conventions

- `api/types/` holds per-endpoint request/response types namespaced as `ApiType.Current`, `ApiType.History`, etc.
- `api/models/` holds shared model shapes (`ApiModel.Weather`, `ApiModel.Sensors`).
- `Maybe<T> = T | void` is used as the RTK Query arg type when the query is optionally skipped.

## Component Patterns

- Widget components follow a two-layer pattern: a thin wrapper (`WidgetXxx`) that handles loading state (Skeleton) and a separate `Chart` / inner component with the actual logic.
- Props are typed via `interface` in the same file.
- Named exports for feature files; `export default` from barrel `index.ts`.
- `useClientOnly` hook is used to defer client-only rendering (ECharts, ThemeSwitcher) past hydration.

## ECharts Patterns

- `getEChartBaseConfig(theme)` in `tools/echart.ts` returns a shared grid/legend/backgroundColor config.
- Theme colors are derived inline in each chart component by comparing `theme === 'dark'`.
- Tooltip formatters currently use `any` types (known tech debt — see ROADMAP BUG QC-01).
- `ReactECharts` from `echarts-for-react` 3.0.6 is the rendering component.

## i18n Conventions

- All translations in a single `public/locales/{en,ru}/common.json`.
- `useTranslation()` (no namespace arg) is used everywhere — defaults to `common`.
- Weather condition codes map to `conditions.*` nested keys (e.g. `conditions.clear_sky`).
- Date format strings are translated (e.g. `date-full-format`, `date-only-hour`) to allow locale-specific formats.
- **Known gaps (as of 2026-03-14):** `date-only-hour` missing from `en/common.json`; `weather-icon` missing from both locales.

## Known Bugs (as of 2026-03-14 audit — see ROADMAP.md)

- `round(0)` returns `undefined` due to falsy check — affects temperature display.
- `getMinMaxValues` does not guard against `undefined` sensor values.
- Climate page accumulates duplicate year entries without dedup guard.
- `setTimeout` in climate page is never cleared (memory leak risk).
- Canonical URLs wrong on `/climate` (→ `/history`), `/heatmap` (→ `/history`), `/forecast` (→ `/`).
- `date-only-hour` i18n key missing from English locale.

## Styling

- CSS Modules with `.module.sass` / `.module.scss` — no global CSS except `styles/globals.sass`, `styles/dark.css`, `styles/light.css`.
- Theme via `next-themes`; dark is default (`defaultTheme='dark'`).
- Inline `style={}` is used extensively for `Skeleton` sizing props (from `simple-react-ui-kit`) — this is a known convention violation documented in ROADMAP QC-02.

## Testing

- Tests are co-located: `tools/*.test.ts` and `components/**/*.test.tsx`.
- `jest.config.ts` with `ts-jest` + `jsdom`.
- Well-covered: `helpers`, `date`, `conditions`, `colors`, `filterRecentData`, `getSampledData`, `getCloudinessColor`.
- **Not covered:** `getMinMaxValues`, `invertData`, `getTemperatureColor`, `convertHpaToMmHg`, `findMinValue`, `findMaxValue`, `getWeatherIconUrl`, `useLocalStorage`, `useClientOnly`.
