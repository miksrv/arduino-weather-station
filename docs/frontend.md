# Frontend

## Stack

| Technology          | Version / Details                                         |
|---------------------|-----------------------------------------------------------|
| Next.js             | 16 (Pages Router)                                         |
| React               | 19                                                        |
| TypeScript          | 5.9, strict mode enabled                                  |
| Redux Toolkit       | State management                                          |
| RTK Query           | Data fetching and cache management                        |
| next-redux-wrapper  | Server-side Redux integration with Next.js                |
| SASS / CSS Modules  | Component-scoped styling                                  |
| ECharts             | 6 — interactive charts for weather data                   |
| next-i18next        | Internationalisation (Russian and English)                |
| next-themes         | Light / dark theme switching                              |
| Yarn                | 4 (package manager)                                       |

## Directory Structure

```
client/
├── api/                  # RTK Query API slice definitions
├── components/           # Reusable UI components (each with CSS Module)
├── pages/                # Next.js pages (file-based routing)
├── public/
│   ├── locales/
│   │   ├── en/           # English translation JSON files
│   │   └── ru/           # Russian translation JSON files
│   └── images/           # Static screenshots and assets
├── styles/               # Global styles, CSS variables, theme definitions
├── tools/                # Pure utility functions and helpers
├── ui/                   # Low-level UI primitives
├── env                   # Environment variable template
├── next.config.js
├── tsconfig.json
└── package.json
```

## Pages

| Page       | Route         | Purpose                                                              |
|------------|---------------|----------------------------------------------------------------------|
| index      | `/`           | Current weather overview — live readings and summary cards           |
| climate    | `/climate`    | Climate statistics and seasonal comparisons                          |
| sensors    | `/sensors`    | List of all connected sensors with current status and readings       |
| history    | `/history`    | Historical data browser with interactive charts and date picker      |
| heatmap    | `/heatmap`    | Heatmap visualisation of weather metrics across a time range         |
| forecast   | `/forecast`   | Multi-day and hourly forecast sourced from external APIs             |
| 404        | `/404`        | Custom not-found page                                                |
| _app       | (layout)      | Root application wrapper — Redux Provider, theme, i18n               |

## RTK Query API

The central API slice is defined in `client/api/api.ts`. It uses `createApi` from Redux Toolkit with `fetchBaseQuery`, pulling the base URL from the `NEXT_PUBLIC_API_HOST` environment variable.

All requests include a custom `Locale` header so the backend can serve locale-aware responses where applicable.

### Endpoints

| Endpoint name    | HTTP            | Backend route       | Used by              |
|------------------|-----------------|---------------------|----------------------|
| `getCurrent`     | GET             | `/current`          | index, sensors pages |
| `getHistory`     | GET             | `/history`          | history page         |
| `getHeatmap`     | GET             | `/heatmap`          | heatmap page         |
| `getForecast`    | GET             | `/forecast/daily`   | forecast page        |
| `getForecastHourly` | GET          | `/forecast/hourly`  | forecast page        |

RTK Query handles loading states, error states, and caching automatically. All data fetching throughout the application goes through these endpoints — never raw `fetch` or Axios.

## Redux Store

The store is configured in `client/store.ts` (or `client/store/`) and wrapped with `next-redux-wrapper` for SSR compatibility.

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
| Translation files | `client/public/locales/{locale}/*.json`  |
| Library           | next-i18next                             |

Pages that require translations call `serverSideTranslations` in `getStaticProps` or `getServerSideProps`, and components access strings via the `useTranslation` hook.

## Theming

Themes are managed by `next-themes`. Light and dark mode CSS custom properties (variables) are defined in `client/styles/`. Component styles reference these variables so they automatically respond to theme changes without JavaScript.

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
| Import order           | Enforced by `eslint-plugin-import` — groups: external, internal, relative |
| JSX nesting depth      | Maximum 4 levels                                                   |
| `console.log`          | Not allowed in committed code                                      |
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
