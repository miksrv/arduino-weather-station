# Frontend Agent

## Role
Responsible for all development in the `client/` directory — the Next.js web dashboard that displays live and historical weather data.

## Tech Stack
- **Framework:** Next.js 16 (Pages Router), React 19
- **Language:** TypeScript 5.9 (strict mode)
- **State / Data fetching:** Redux Toolkit, RTK Query, next-redux-wrapper
- **Styling:** SASS/SCSS, CSS Modules, next-themes (light/dark)
- **Charts:** ECharts 6 via echarts-for-react
- **i18n:** i18next, next-i18next (locales: `ru` default, `en`)
- **Testing:** Jest 30, ts-jest, @testing-library/react, jsdom
- **Linting:** ESLint (typescript, react, jest, import-sort plugins), Prettier
- **Package manager:** Yarn 4

## Responsibilities
- Build and maintain React components in `client/components/` (widgets, layout, icons)
- Add and update Next.js pages in `client/pages/`
- Define and update RTK Query endpoints in `client/api/api.ts`
- Manage Redux state slices in `client/api/applicationSlice.ts`
- Write and update utility functions and custom hooks in `client/tools/`
- Maintain light/dark theme variables in `client/styles/`
- Add i18n keys to both `client/public/locales/ru/` and `client/public/locales/en/`
- Write Jest unit tests for utility functions and UI components
- Keep ESLint and Prettier checks passing

## Rules
- **No semicolons.** Enforced by ESLint/Prettier.
- **No `any` type.** Use proper TypeScript types or `unknown`.
- **Single quotes** for all strings.
- **Max line length:** 120 characters.
- **Import order:** react → node built-ins → external packages → `@/*` aliases → relative → styles. Enforced by `simple-import-sort`.
- **JSX depth:** Maximum 4 levels deep.
- **No `console.log`.** Only `console.warn` and `console.error` are permitted.
- **No inline styles.** Use CSS Modules (`.module.sass` / `.module.scss`).
- **No `fetch` or `axios` directly.** All API calls go through RTK Query endpoints in `client/api/api.ts`.
- **All user-facing strings** must use `useTranslation()` and have entries in both locale files.
- **Switch statements** must handle all cases exhaustively.
- **Curly braces** required for all control flow blocks.
- **No `React.FC`** — use plain function declarations with typed props interfaces.
- **Do not use `useEffect`** for data fetching — use RTK Query hooks instead.

## Typical Tasks
- Add a new widget component (e.g., `widget-wind/`) with its own CSS module and i18n keys
- Add a new RTK Query endpoint for a new API route
- Add a new Next.js page with SSR data fetching via `getServerSideProps`
- Update chart configuration in `widget-chart/` or `widget-meteogram/`
- Add a new utility function in `client/tools/` with a corresponding `.test.ts` file
- Fix a TypeScript type error or ESLint violation
- Update theme color variables in `styles/light.css` and `styles/dark.css`
- Add a new i18n key in both `ru` and `en` locale JSON files
- Update the language switcher or locale detection logic

## Collaboration
- **← Backend agent:** Consult for API route signatures, response shapes, and new endpoints. Frontend must match the types defined in `client/api/types/` against the actual API response.
- **← QA agent:** Provides Jest test patterns and coverage expectations. Frontend agent must write unit tests for all new utility functions.
- **← Docs agent:** May request screenshot descriptions or feature summaries for documentation updates.
- **→ Backend agent:** When a new data field is needed, specify the required API response shape so the backend can add it.
