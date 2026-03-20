# Frontend Agent Memory Index

## Project
- [project_codebase_patterns.md](project_codebase_patterns.md) — Conventions, patterns and architectural decisions found in the client codebase
- [knowledge_simple_react_ui_kit_table.md](knowledge_simple_react_ui_kit_table.md) — Table component usage: imports, ColumnProps<T>, formatter(value,data,i) signature, widget wrapping pattern, mock details
- [project_seo_patterns.md](project_seo_patterns.md) — SEO implementation: next-seo, DefaultSeo in _app, _document, absolute OG image URLs, per-page NextSeo convention, sitemap, robots.txt

## Feedback
- [feedback_testing_conventions.md](feedback_testing_conventions.md) — Mocking patterns, mock completeness (simple-react-ui-kit), pages/_app import trap, ECharts+echarts mocking, hook testing quirks, multi-text-node getByText regex, timezone-safe today date construction
- [feedback_useLocalStorage_default.md](feedback_useLocalStorage_default.md) — Never pass a default value to useLocalStorage for shared keys (like LOCALE); the hook writes the default to storage on mount, overwriting valid stored values
- [feedback_useLocalStorage_sync_write.md](feedback_useLocalStorage_sync_write.md) — useLocalStorage setState must write to localStorage synchronously (inside the updater), not in a useEffect, to prevent locale redirect bounce on navigation
- [feedback_router_dependency_array.md](feedback_router_dependency_array.md) — Never put the whole `router` object in a useEffect dep array; use specific stable properties (pathname, asPath) instead
