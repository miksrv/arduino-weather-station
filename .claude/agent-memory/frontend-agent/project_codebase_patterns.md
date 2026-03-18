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
- **CSS variables must NOT be passed directly to ECharts options** — ECharts renders to `<canvas>` and cannot resolve CSS custom properties (they produce black/invalid). Resolve them at runtime via `resolveCssVar(variable, fallback)` (see `widget-flood-risk/utils.ts`) or by comparing `theme === 'dark'` inline. `resolveCssVar` uses `getComputedStyle(document.documentElement)` and returns the fallback when called server-side (SSR guard via `typeof window === 'undefined'`).

## i18n Conventions

- All translations in a single `public/locales/{en,ru}/common.json`.
- `useTranslation()` (no namespace arg) is used everywhere — defaults to `common`.
- Weather condition codes map to `conditions.*` nested keys (e.g. `conditions.clear_sky`).
- Date format strings are translated (e.g. `date-full-format`, `date-only-hour`) to allow locale-specific formats.
- **I18n audit 2026-03-17:** `toggle-sidebar` (aria-label) and `weather-icon` (Meteogram series name) added to both locales. Dead keys removed: `direction`, `anomaly-monitoring`, `anomaly-calendar-title`, `z-score-label`, `swe-flood-year`. Both locale files are now fully symmetric at 137 top-level + 56 `conditions` keys = 193 entries each.

## Known Bugs (as of 2026-03-14 audit — see ROADMAP.md)

- `getMinMaxValues` does not guard against `undefined` sensor values. (BUG-07 — fixed 2026-03-14)
- `round(0)` returns `undefined` due to falsy check — FIXED 2026-03-15 (BUG-08).
- `extractRehydrationInfo` in `api/api.ts` uses `: any` return type. The `eslint-disable` is intentional: adding any explicit return-type annotation causes TS to widen the Definitions generic and break all endpoint hook inference. Root cause: circular dependency api.ts ↔ store.ts. Cannot be fixed without extracting store types to a third file. (BUG-09)
- `heatmap.tsx` / `history.tsx` historyDateParam was always a non-null object before useEffect ran — FIXED 2026-03-15 by returning undefined when period is unset (BUG-10).
- Climate page: dedup guard added, setTimeout cleared, sessionStorage cache added, loading progress fixed (FEAT-01 completed 2026-03-15).
- Canonical URLs wrong on `/climate` (→ `/history`), `/heatmap` (→ `/history`), `/forecast` (→ `/`) — FIXED 2026-03-14 (BUG-06), QC-09 removed from ROADMAP 2026-03-15.

## Styling

- CSS Modules with `.module.sass` / `.module.scss` — no global CSS except `styles/globals.sass`, `styles/dark.css`, `styles/light.css`.
- Theme via `next-themes`; dark is default (`defaultTheme='dark'`).
- Inline `style={}` is used extensively for `Skeleton` sizing props (from `simple-react-ui-kit`) — this is a known convention violation documented in ROADMAP QC-02.

## Testing

- Tests are co-located: `tools/*.test.ts` and `components/**/*.test.tsx`.
- `jest.config.ts` with `ts-jest` + `jsdom`.
- Well-covered: `helpers`, `date`, `conditions`, `colors`, `filterRecentData`, `getSampledData`, `getCloudinessColor`.
- **Not covered:** `getMinMaxValues`, `invertData`, `getTemperatureColor`, `convertHpaToMmHg`, `findMinValue`, `findMaxValue`, `getWeatherIconUrl`, `useLocalStorage`, `useClientOnly`.
- Jest hooks: only `beforeEach`/`afterEach` allowed — ESLint `jest/no-hooks` forbids `beforeAll`/`afterAll`.
- Use `jest.useFakeTimers()` + `jest.setSystemTime()` in `beforeEach`/`afterEach` for date-dependent tests.
- Standard component mock pattern: ECharts → `jest.mock('echarts-for-react', () => (props) => <div data-testid='echarts' />)`, i18next → `{ useTranslation: () => ({ t: (key) => key }) }`.

## ESLint Notable Rules

- `eqeqeq: ['error', 'always', { null: 'never' }]` — null comparisons must use `!=` / `==` (not `!==` / `===`).
- `jest/no-hooks` allows only `beforeEach`/`afterEach` — never `beforeAll`/`afterAll`.

## Date Parsing

- Never use `new Date(isoString).getMonth()/.getDate()` for calendar math on ISO date strings — timezone shifts cause off-by-one errors in Node.js test environments.
- Parse ISO date strings manually: `dateStr.split('-')` + `parseInt(parts[n], 10)`.

## Feature 4 Precipitation Calendar (added 2026-03-18)

New page at `pages/precipitation.tsx` + `pages/precipitation.module.sass`. Endpoint: `API.useGetPrecipitationQuery({ year })` → tag `'Precipitation'` → URL `precipitation?year=YYYY`. Types at `api/types/precipitation.ts` (namespace `ApiType.Precipitation`).

Components:
- `widget-precip-calendar/` — full-width calendar grid (12 rows × 31 cols). Uses CSS Grid, `useMemo` Map for O(1) day lookup, inline `backgroundColor` style for cell colours (no CSS vars — see ECharts note). Inline `style` used on `legendSwatch` too for the same reason (dynamic colour values, not ECharts-specific).
- `widget-streak-card/` — card styled like `WidgetAnomalyCard` at `width: calc(50% - 5px)`, `100%` on mobile.

Page-level helper component pattern: `StatCard` is defined as a `React.FC` above the page component in the same file to stay under JSX depth 4 and DRY up repeated card markup.

Locale labels for month names are generated at runtime with `new Date(2000, idx, 1).toLocaleString(i18n.language, { month: 'short' })` — no translation keys needed.

## Feature 7 Anomaly Components (added 2026-03-16)

Six components in `client/components/`:
- `widget-flood-risk/` — gauge + bar chart; risk levels: low/elevated/high/critical
- `widget-snowpack-chart/` — seasonal SWE line chart + comparison table; 2023-2024 is designated flood year
- `widget-anomaly-card/` — active/inactive anomaly card with dot indicator
- `widget-parameter-z-score/` — parameter Z-score with severity dots + sparkline
- `widget-anomaly-calendar/` — GitHub-style heatmap (52 weeks × 7 days = 364 cells, `grid-auto-flow: column`)
- `widget-anomaly-history/` — Table widget showing anomaly history rows; uses `simple-react-ui-kit` Table with 5 columns; logic extracted from inline component in `pages/anomaly.tsx`

All used in `pages/anomaly.tsx` via `API.useGetAnomalyQuery`.

Utility helpers for `widget-anomaly-history` live in `components/widget-anomaly-history/utils.ts`:
- `getDuration(startDate, endDate)` — returns `'${days}d'` or `''` when endDate is null (component renders `t('in-progress')` for empty string)
- `anomalyTypeToI18nKey(type)` — re-exported from `@/tools/conditions` (canonical location after 2026-03-17 refactor)

## Canonical String-Conversion Helpers (tools/)

- `anomalyTypeToI18nKey(type)` in `tools/conditions.ts` — converts `snake_case` anomaly IDs to `kebab-case` i18n key segments (e.g. `heat_wave` → `heat-wave`). Used by `widget-anomaly-history/utils.ts` (re-export), `widget-anomaly-calendar/WidgetAnomalyCalendar.tsx` (direct import), and `widget-anomaly-card/utils.ts` (re-exported as `anomalyIdToI18nKey` for backward compatibility).
