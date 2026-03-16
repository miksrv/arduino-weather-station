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
