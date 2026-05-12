# Frontend Agent Memory Index

## Project
- [project_codebase_patterns.md](project_codebase_patterns.md) — Conventions, patterns and architectural decisions found in the client codebase
- [knowledge_simple_react_ui_kit_table.md](knowledge_simple_react_ui_kit_table.md) — Table component usage: imports, TableColumnProps<T>, formatter(value,data,i) signature, widget wrapping pattern, mock details
- [project_seo_patterns.md](project_seo_patterns.md) — SEO with next-seo v7: generateNextSeo/generateDefaultSeo from next-seo/pages inside Head (not component-based)
- [project_tooltip_css_pattern.md](project_tooltip_css_pattern.md) — ECharts tooltip HTML uses styles.value/label/icon via string interpolation — these must be explicitly defined in SASS even though they don't appear as JSX class references
- [project_dependency_upgrade_notes.md](project_dependency_upgrade_notes.md) — Breaking changes from 2026-05 upgrade: next-i18next v16 subpaths, next-seo v7 function API, TS6 rootDir fix, ESLint pinned to v9

## Feedback
- [feedback_testing_conventions.md](feedback_testing_conventions.md) — Mocking patterns, mock completeness (simple-react-ui-kit), pages/_app import trap, ECharts+echarts mocking, hook testing quirks, multi-text-node getByText regex, timezone-safe today date construction
- [feedback_useLocalStorage_default.md](feedback_useLocalStorage_default.md) — Never pass a default value to useLocalStorage for shared keys (like LOCALE); the hook writes the default to storage on mount, overwriting valid stored values
- [feedback_useLocalStorage_sync_write.md](feedback_useLocalStorage_sync_write.md) — useLocalStorage setState must write to localStorage synchronously (inside the updater), not in a useEffect, to prevent locale redirect bounce on navigation
- [feedback_router_dependency_array.md](feedback_router_dependency_array.md) — Never put the whole `router` object in a useEffect dep array; use specific stable properties (pathname, asPath) instead
