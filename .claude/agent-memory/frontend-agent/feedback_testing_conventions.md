---
name: Testing conventions and patterns
description: How tests are structured in the client — mocking, component patterns, what to skip
type: feedback
---

The `simple-react-ui-kit` mock at `client/__mocks__/simple-react-ui-kit.js` must export `Skeleton`, `Spinner`, and `Badge` in addition to `Icon`, `cn`, `Button`, `Table`. When adding new components that use these, make sure the mock is updated.

**Why:** The mock was initially incomplete (missing Skeleton/Spinner/Badge), causing new widget tests to fail with "Element type is invalid" errors.

**How to apply:** Before writing widget component tests, check whether any imported components from `simple-react-ui-kit` are missing from the mock file.

---

Components that import from `@/pages/_app` (e.g. `AppBar.tsx` imports `POLING_INTERVAL_CURRENT`) must mock that module in their test:
```ts
jest.mock('@/pages/_app', () => ({ POLING_INTERVAL_CURRENT: 600000 }))
```
**Why:** `pages/_app.tsx` imports `appWithTranslation` from `next-i18next` and creates a Redux store, causing test suite failure if not mocked.

Preferred alternative: avoid importing constants from `@/pages/_app` in components entirely. Define polling interval constants inline or in a dedicated constants file. Only `AppBar.tsx` has this pattern — do not replicate it in new components.

---

ECharts components (`Chart.tsx`, `Heatmap.tsx`, `Meteogram.tsx`) use `ReactECharts` from `echarts-for-react`. Mock it with a simple div:
```ts
jest.mock('echarts-for-react', () => (props) => <div data-testid='echarts' />)
```
Also mock `echarts` if `graphic.LinearGradient` is used:
```ts
jest.mock('echarts', () => ({ graphic: { LinearGradient: jest.fn((_,_,_,_, stops) => ({ stops })) } }))
```

---

`useLocalStorage` hook: After calling `remove()`, the state resets to `initialState` but `useEffect` will write `initialState` back to localStorage (not delete the key). Test the state value, not the localStorage key existence after removal.

---

`useClientOnly` hook: In Testing Library's `renderHook`, the `useEffect` that sets `isClient=true` runs before the first result check, so `result.current` is always `true` in tests. Test the final state (true) rather than an initial false state.

---

ESLint enforces `eqeqeq` in "smart" mode: use `!= null` (not `!== null` and not `!== undefined`) to check for both `null` and `undefined`. The linter will error on `!== null` when you mean a nullish check — use `!= null` throughout JSX conditions that guard optional props.

**Why:** Codebase ESLint config uses `"eqeqeq": ["error", "smart"]` which specifically prefers `!= null` for nullish comparisons.

**How to apply:** In any JSX conditional like `{prop !== undefined && prop !== null && (...)}`, simplify to `{prop != null && (...)}`. This applies to optional component props in render guards.

---

When testing elements whose text is split across multiple sibling text nodes in a single DOM element (e.g. `{sign}{value}{'σ'}` in a `<span>`), `screen.getByText('value')` will fail because Testing Library matches against full textContent. Use a regex: `screen.getByText(/value/)`.

**Why:** React renders JSX expressions as separate text nodes. `getByText('2.50')` fails when the span also contains `−` and `σ` as sibling nodes — the element's textContent is `−2.50σ`.

**How to apply:** Use regex patterns (`/2\.50σ/`, `/anomaly-calendar-tooltip/`) when matching elements with mixed-content text. Use exact string only when the element contains a single text child.

---

`isActiveToday()` in `widget-anomaly-history/utils.ts` compares dates using local-time getters (`getFullYear/getMonth/getDate`) but `new Date('YYYY-MM-DD')` parses as UTC midnight. In UTC+ timezones the date shifts to the previous local day. To test "today" reliably, pass `'YYYY-MM-DDT12:00:00'` (no Z) so the date is parsed as local time.

**Why:** A test using the bare date string `2026-03-17` fails in UTC+5 because it parses to 2026-03-16 local time.

**How to apply:** In any test that builds a "today" date string for a function that uses local-time getters, append `T12:00:00` (noon, no Z suffix) to ensure the parsed Date lands on the correct local day across all timezones.

---

When mocking `echarts-for-react` for components that also use `echarts.connect()` (e.g. `WidgetSnowpackChart`), also mock the `echarts` module:
```ts
jest.mock('echarts', () => ({ connect: jest.fn(), ECharts: {} }))
```
**Why:** `WidgetSnowpackChart` calls `echarts.connect('snowpack')` inside `onChartReady` callbacks. Without the mock the import succeeds but the function call may cause issues in jsdom.

**How to apply:** For any chart component that imports directly from `echarts` (not just `echarts-for-react`), add an `echarts` mock alongside the `echarts-for-react` mock.
