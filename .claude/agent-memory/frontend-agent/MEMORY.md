# Frontend Agent Memory Index

## Project
- [project_codebase_patterns.md](project_codebase_patterns.md) — Conventions, patterns and architectural decisions found in the client codebase
- [knowledge_simple_react_ui_kit_table.md](knowledge_simple_react_ui_kit_table.md) — Table component usage: imports, TableColumnProps<T>, formatter(value,data,i) signature, widget wrapping pattern, mock details
- [project_seo_patterns.md](project_seo_patterns.md) — SEO: getPageSeo() (tools/seo.ts) passed to next-seo v7 generateNextSeo inside Head; OG images in public/images/og; sitemap from tools/sitemap.ts
- [project_tooltip_css_pattern.md](project_tooltip_css_pattern.md) — ECharts tooltip HTML uses styles.value/label/icon via string interpolation — these must be defined in SASS (include +mixins.chartTooltip) even though they don't appear as JSX class references
- [project_dependency_upgrade_notes.md](project_dependency_upgrade_notes.md) — Breaking changes from 2026-05 upgrade: next-i18next v16 subpaths, next-seo v7 function API, TS6 rootDir fix, ESLint pinned to v9; simple-react-ui-kit 2.2.0 DatePicker `today`

## Feedback
- [feedback_testing_conventions.md](feedback_testing_conventions.md) — Mocking patterns, mock completeness (simple-react-ui-kit), next-i18next/pages mock, EChart wrapper + echarts mocking, hook testing quirks, multi-text-node getByText regex, jsdom hex→rgb, jest.mock hoisting, coverage ceiling
