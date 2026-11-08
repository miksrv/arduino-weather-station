# Frontend

## Stack

| Technology          | Version / Details                                         |
|---------------------|-----------------------------------------------------------|
| Next.js             | 16 (Pages Router)                                         |
| React               | 19                                                        |
| TypeScript          | 6.0, strict mode enabled                                  |
| Redux Toolkit       | 2.13 — state management                                   |
| RTK Query           | Data fetching and cache management                        |
| next-redux-wrapper  | Server-side Redux integration with Next.js                |
| SASS / CSS Modules  | Component-scoped styling                                  |
| ECharts             | 6 — interactive charts (tree-shaken, through `components/echart`) |
| next-i18next        | 16 (i18next 26) — internationalisation (Russian and English) |
| next-themes         | Light / dark theme switching                              |
| Yarn                | 4.9 (package manager)                                     |

Read `client/DESIGN.md` before adding or changing any UI.

## Directory Structure

```
client/
├── api/                  # RTK Query API, store, application slice, SSR prefetch, types
├── components/           # Reusable UI components and shared widget building blocks
├── widgets/              # Finished dashboard card widgets, one directory per widget
├── hooks/                # Shared custom React hooks
├── pages/                # Next.js pages (file-based routing)
├── public/
│   ├── locales/
│   │   ├── en/           # English translations (common.json)
│   │   └── ru/           # Russian translations (common.json)
│   └── images/           # Static screenshots and assets
├── styles/               # Global styles, theme tokens (theme.css), mixins, typography
├── tools/                # Pure utility functions and helpers (with tests)
├── ui/                   # Low-level UI primitives
├── env                   # Environment variable template
├── next.config.js
├── tsconfig.json
└── package.json
```

## Pages

| Page            | Route            | Purpose                                                              |
|-----------------|------------------|----------------------------------------------------------------------|
| index           | `/`              | Current weather overview — live readings and summary cards           |
| sensors         | `/sensors`       | Per-sensor cards with current readings, trends and the event log     |
| history         | `/history`       | Historical data browser with interactive charts and date picker      |
| heatmap         | `/heatmap`       | Heatmap visualisation of weather metrics across a time range         |
| forecast        | `/forecast`      | Multi-day and hourly forecast sourced from external APIs             |
| precipitation   | `/precipitation` | Yearly precipitation calendar, statistics and monthly totals         |
| anomaly         | `/anomaly`       | Anomaly monitor: flood risk, snowpack, z-scores, anomaly history     |
| climate         | `/climate`       | Climate statistics and long-term comparisons                         |
| sitemap.xml     | `/sitemap.xml`   | XML sitemap written in `getServerSideProps`                          |
| [...not-found]  | any other path   | Custom not-found page                                                |
| _app            | (layout)         | Root application wrapper — Redux Provider, theme, i18n               |

## RTK Query API

The central API slice is defined in `client/api/api.ts`. It uses `createApi` from Redux Toolkit with `fetchBaseQuery`, pulling the base URL from the `NEXT_PUBLIC_API_HOST` environment variable.

All requests include a custom `Locale` header so the backend can serve locale-aware responses where applicable.

### Endpoints

| Endpoint name       | HTTP | Backend route                      | Used by                          |
|---------------------|------|------------------------------------|----------------------------------|
| `getCurrent`        | GET  | `/current`                         | index, sensors, forecast pages   |
| `getHistory`        | GET  | `/history`                         | index, sensors, history pages    |
| `getHeatmap`        | GET  | `/heatmap`                         | heatmap page                     |
| `getForecast`       | GET  | `/forecast/hourly`, `/forecast/daily` (argument `'hourly' \| 'daily'`) | index, forecast pages |
| `getAnomaly`        | GET  | `/anomaly`                         | index, anomaly pages             |
| `getAnomalyHistory` | GET  | `/anomaly/history`                 | defined, not used by any page yet |
| `getPrecipitation`  | GET  | `/precipitation`                   | precipitation page               |
| `getClimate`        | GET  | `/climate`                         | climate page                     |
| `getEvents`         | GET  | `/events`                          | sensors page (event log widget)  |

RTK Query handles loading states, error states, and caching automatically. All data fetching throughout the application goes through these endpoints — never raw `fetch` or Axios. Data above the fold is prefetched on the server with `prefetchQueries()` (`api/ssr.ts`) using the same query arguments as the client hooks.

## Redux Store

The store is configured in `client/api/store.ts` and wrapped with `next-redux-wrapper` for SSR compatibility.

### Slices

| Slice              | State managed                              |
|--------------------|--------------------------------------------|
| `applicationSlice` | Active locale (`ru` or `en`)              |
| RTK Query cache    | Managed automatically by the API slice    |

## Internationalisation

| Setting           | Value                                    |
|-------------------|------------------------------------------|
| Default locale    | `ru`                                     |
| Supported locales | `ru`, `en`                               |
| Translation files | `client/public/locales/{locale}/common.json` |
| Library           | next-i18next                             |

Every page calls `serverSideTranslations` in `getServerSideProps`, and components access strings via the `useTranslation` hook.

## Theming

Themes are managed by `next-themes`. Light and dark design tokens (CSS custom properties) are defined in `client/styles/theme.css`. Component styles reference these variables so they automatically respond to theme changes without JavaScript; see `client/DESIGN.md`.

## Environment Variables

Copy `client/env` to `client/.env.local` and fill in the values before running the development server.

| Variable                  | Required | Description                                      |
|---------------------------|----------|--------------------------------------------------|
| `NEXT_PUBLIC_API_HOST`    | Yes      | Base URL of the backend API, e.g. `http://localhost:8080/` |
| `NEXT_PUBLIC_SITE_LINK`   | Yes      | Public URL of the frontend, e.g. `http://localhost:3000/`  |
| `NEXT_PUBLIC_STORAGE_KEY` | Yes      | localStorage namespace key, e.g. `meteo`         |

## Code Conventions (ESLint / Prettier)

The project enforces the following rules via ESLint and Prettier:

| Rule                   | Requirement                                                        |
|------------------------|--------------------------------------------------------------------|
| Semicolons             | No semicolons                                                      |
| Quotes                 | Single quotes                                                      |
| TypeScript `any`       | Not allowed — use explicit types or `unknown`                      |
| Import order           | Enforced by `eslint-plugin-simple-import-sort` — react → node → external → `@/*` aliases → relative → styles |
| JSX nesting depth      | Maximum 4 levels                                                   |
| `console.log`          | Not allowed (only `console.warn` / `console.error`)                |
| Styling                | CSS Modules only — no inline styles, no global class name strings  |
| API calls              | RTK Query only — no direct `fetch` or `axios` in components        |

## Setup

```bash
# 1. Navigate to the client directory
cd client

# 2. Install dependencies
yarn install

# 3. Copy environment template and configure
cp env .env.local
# Edit .env.local — set NEXT_PUBLIC_API_HOST, NEXT_PUBLIC_SITE_LINK, NEXT_PUBLIC_STORAGE_KEY

# 4. Start the development server
yarn dev
# Available at http://localhost:3000

# 5. Build for production
yarn build

# 6. Start the production build locally
yarn start
```
