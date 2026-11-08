---
name: frontend-codebase-patterns
description: Key conventions, architectural decisions, and recurring patterns found in the client/ Next.js codebase
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
- `useClientOnly` hook is used to defer client-only rendering (the `ThemeSwitcher` in `AppBar`) past hydration.

## ECharts Patterns

- `getEChartBaseConfig(theme)` in `tools/echart.ts` returns a shared grid/legend config; `getChartTooltipStyle(theme)` styles every tooltip.
- Chart chrome colours come from `getChartTokens(theme)` (`tools/echart.ts`), which mirrors the tokens of `styles/theme.css`.
- The rendering component is the `EChart` wrapper in `components/echart` (tree-shaken `echarts/core` via `registry.ts`, `echarts-for-react/lib/core`); components never import `echarts` / `echarts-for-react` at runtime — see `client/DESIGN.md` section 7.
- **CSS variables must NOT be passed directly to ECharts options** — ECharts renders to `<canvas>` and cannot resolve CSS custom properties (they produce black/invalid). Use `getChartTokens(theme)`, or resolve them at runtime via `resolveCssVar(variable, fallback)` (`tools/colors.ts`, re-exported by `widget-flood-risk/utils.ts`). `resolveCssVar` uses `getComputedStyle(document.documentElement)` and returns the fallback when called server-side (SSR guard via `typeof window === 'undefined'`).

## i18n Conventions

- All translations in a single `public/locales/{en,ru}/common.json`.
- `useTranslation()` (no namespace arg) is used everywhere — defaults to `common`.
- `serverSideTranslations(locale, ['common'])` must be called with the explicit namespace arg on all pages.
- `appWithTranslation(App, i18Config)` in `_app.tsx` gets the imported `next-i18next.config.js` explicitly.
- Default locale fallback in all pages' `getServerSideProps` should be `'ru'` (the configured `defaultLocale`), not `'en'`.
- The language switcher renders real links (`href={router.asPath}`, `hrefLang`) and switches with a full page load (`window.location.href`) after setting the `NEXT_LOCALE` cookie, localStorage and `setLocale`, so every API answer is fetched again with the new `Locale` header. It never calls `i18n.changeLanguage()`.
- Weather condition codes map to `conditions.*` nested keys (e.g. `conditions.clear_sky`).
- Date format strings are translated (e.g. `date-full-format`, `date-only-hour`) to allow locale-specific formats.

## Known Bugs

- `extractRehydrationInfo` in `api/api.ts` uses `: any` return type. The `eslint-disable` is intentional: adding any explicit return-type annotation causes TS to widen the Definitions generic and break all endpoint hook inference. Root cause: circular dependency api.ts ↔ store.ts. Cannot be fixed without extracting store types to a third file.

## Styling

- CSS Modules with `.module.sass` / `.module.scss` — global styles live in `styles/` (`globals.sass`, tokens in `theme.css`, mixins in `mixins.sass` / `typography.sass`); the design system is described in `client/DESIGN.md`.
- Theme via `next-themes`; dark is default (`defaultTheme='dark'`).
- Inline `style={}` is still used for `Skeleton` sizing props (from `simple-react-ui-kit`) and for data-driven colours (e.g. `WidgetPrecipCalendar` cells) — a known exception to the no-inline-styles rule.

## Testing

- Tests are co-located: `tools/*.test.ts`, `hooks/*.test.ts`, `components/**/*.test.tsx`, `widgets/**/*.test.tsx`.
- `jest.config.ts` with `ts-jest` + `jsdom`.
- Jest hooks: only `beforeEach`/`afterEach` allowed — ESLint `jest/no-hooks` forbids `beforeAll`/`afterAll`.
- Use `jest.useFakeTimers()` + `jest.setSystemTime()` in `beforeEach`/`afterEach` for date-dependent tests.
- Standard component mock pattern: ECharts → `jest.mock('@/components/echart', () => () => <div data-testid='echarts' />)`, i18next → `jest.mock('next-i18next/pages', () => ({ useTranslation: () => ({ t: (key) => key }) }))`.

## ESLint Notable Rules

- `eqeqeq: ['error', 'always', { null: 'never' }]` — null comparisons must use `!=` / `==` (not `!==` / `===`).
- `jest/no-hooks` allows only `beforeEach`/`afterEach` — never `beforeAll`/`afterAll`.

## Date Parsing

- Never use `new Date(isoString).getMonth()/.getDate()` for calendar math on ISO date strings — timezone shifts cause off-by-one errors in Node.js test environments.
- Parse ISO date strings manually: `dateStr.split('-')` + `parseInt(parts[n], 10)`.

## Feature 4 Precipitation Calendar (added 2026-03-18)

New page at `pages/precipitation.tsx` + `pages/precipitation.module.sass`. Endpoint: `API.useGetPrecipitationQuery({ year })` → tag `'Precipitation'` → URL `precipitation?year=YYYY`. Types at `api/types/precipitation.ts` (namespace `ApiType.Precipitation`).

Components:
- `widget-precip-calendar/` — full-width calendar grid (12 rows × 31 cols). Uses CSS Grid, inline `backgroundColor` style for cell colours and legend swatches (dynamic colour values).
- `widget-streak-card/`, `widget-precip-stat-card/` — the page's stat cards.

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

Utility helpers for `widget-anomaly-history` live in `components/widget-anomaly-history/utils.ts` (`isActiveToday`, `getRecentAnomalies`, `getAnomalyDays`, `formatAnomalyPeriod`, `getAnomalyMetric`); `anomalyTypeToI18nKey(type)` is re-exported there from `@/tools/conditions` (its canonical location).

## WidgetForecastCards (added 2026-03-19)

Component at `client/components/widget-forecast-cards/` renders both daily and hourly forecast as horizontally scrollable card rows. Full-width (`flex-basis: 100%`), used on the index page. Highlight state for today's card uses `getDate(item.date).format('YYYY-MM-DD') === todayStr`. The forecast page itself uses the `widgets/widget-forecast-*` widgets (`today`, `daily`, `hourly`, `details`).

## Station status in the app bar (replaced StaleDataBanner, 2026-11-05)

The former `components/stale-data-banner` (an orange card above every page) is gone. `AppBar.tsx` now owns the whole outdated-data UI: `getStationStatus(isStale, lastUpdated)` in `tools/helpers.ts` returns `'online' | 'stale' | 'offline'` — `offline` when the last reading is older than `STATION_OFFLINE_MINUTES` (60) or missing (no `/current` answer also reads as offline), `stale` when the backend's `isStale` is true or the reading is older than `STATION_STALE_MINUTES` (15, mirrors the server) — the age check matters because a failed poll keeps the last cached answer with its old `isStale: false` — else `online`. The dot takes `styles.dot` + `styles[status]` (green pulsing / steady `--color-yellow` / red); for `stale`/`offline` a `StatusBadge` (`components/status-badge`, `role="status"`, tone `yellow` / `red`) with the i18n key `stale-data-warning` sits before the theme switch, and on phones becomes a full-width strip under the bar's row (the bar's height grows). `--color-yellow` / `--color-yellow-background` are project tokens in `styles/theme.css`.

`ApiType.Current.Response` (`api/types/current.ts`) carries the backend-driven `lastUpdated` (ISO8601) and `isStale` — on `Response`, NOT on the shared `ApiModel.Weather` model, which is reused as `Weather[]` by `history`, `forecast` and `heatmap`. The freshness threshold (15 min) is decided by the server; the client repeats it only as a fallback for a cached answer, plus the one-hour offline step.

The pre-existing `event-system-stale` i18n key belongs to `widget-event-log`, a different feature — do not reuse it for this UI.

## Canonical String-Conversion Helpers (tools/)

- `anomalyTypeToI18nKey(type)` in `tools/conditions.ts` — converts `snake_case` anomaly IDs to `kebab-case` i18n key segments (e.g. `heat_wave` → `heat-wave`). Used by `widget-anomaly-history/utils.ts` (re-export), `widget-anomaly-calendar/WidgetAnomalyCalendar.tsx` and `widgets/widget-event-log/utils.ts` (direct import), and `widget-anomaly-card/utils.ts` (re-exported as `anomalyIdToI18nKey` for backward compatibility).
