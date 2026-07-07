# Arduino Weather Station — Claude Code Workspace

## Project Overview

Full-stack DIY weather monitoring system that collects real environmental data from Arduino/ESP32 hardware and exposes it via a PHP REST API with a Next.js web dashboard.

- **Live demo:** https://meteo.miksoft.pro
- **License:** MIT
- **Default locale:** Russian (`ru`), also supports English (`en`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Firmware | C++ (Arduino / ESP32), Arduino IDE |
| Backend | PHP 8.2+, CodeIgniter 4.6, MySQL |
| Frontend | Next.js 16.2, React 19.2, TypeScript 6.0 |
| State management | Redux Toolkit 2.12 + RTK Query, next-redux-wrapper |
| Styling | SASS/SCSS, CSS Modules, next-themes |
| Charts | ECharts 6 (echarts-for-react) |
| i18n | i18next 26 (next-i18next 16, locales: `ru`, `en`) |
| HTTP client | Guzzle 7 (PHP), RTK Query (TS) |
| Package manager | Yarn 4.9 (client), Composer (server) |
| Testing | PHPUnit 11.5 (server), Jest 30 + ts-jest + Testing Library (client) |
| Quality | SonarCloud, ESLint 9, Prettier |
| CI/CD | GitHub Actions → FTP deploy |

---

## Team Agents

| Agent | Code Location | Instructions |
|-------|----------------|--------------|
| **Backend Agent** | `/server` | `.claude/agents/backend-agent.md` |
| **Frontend Agent** | `/client` | `.claude/agents/frontend-agent.md` |

Agents must read their instruction file before starting. Each agent reports completion to Team Lead.

> Note: only backend-agent and frontend-agent currently exist under `.claude/agents/`. There is no separate QA or Doc agent — testing and docs work is handled by whichever of the two agents owns the affected code.

---

## High-Level Architecture

```
Arduino/ESP32 Hardware
  │  POST /sensors (every 60 s)
  ▼
CodeIgniter 4 REST API  ──► MySQL Database
  │                              ▲
  │  CLI cron commands           │
  └─► External Weather APIs ─────┘
        (OpenWeatherMap, WeatherAPI, VisualCrossing)
        (NarodMon — data push)

Next.js Frontend (SSR)
  └─► RTK Query ──► PHP API
```

### Data Flow
1. Arduino POSTs sensor readings to `POST /sensors`
2. `spark system:getCurrentWeather` periodically fetches from external APIs, ingests raw data, and recalculates hourly/daily averages (no separate averaging commands)
3. `spark system:detectAnomalies` scans recent data for statistically unusual conditions (z-score + composite flood-risk scoring) and writes to `anomaly_log`
4. Next.js pages fetch data via RTK Query endpoints; locale is sent as a custom `Locale` HTTP header
5. `spark system:sendNarodmonData` pushes data to narodmon.ru

---

## Directory Structure

```
arduino-weather-station/
├── arduino/               # Firmware
│   ├── main/              # Production sketch (main.ino + sensor modules)
│   ├── i2c_scanner/       # I2C device discovery utility
│   └── test_*/            # Individual sensor test sketches
├── client/                # Next.js frontend
│   ├── api/               # RTK Query store, slices, endpoint definitions, types
│   ├── components/        # Reusable React components (widgets, layout, icons)
│   ├── pages/             # Next.js pages (index, climate, sensors, history, heatmap, forecast, precipitation, anomaly)
│   ├── public/locales/    # i18n translation files (en/, ru/)
│   ├── styles/            # Global SASS + light/dark theme CSS
│   ├── tools/             # Utility functions, custom hooks, unit tests
│   └── ui/                # Small UI primitives (theme-switcher, comparison-icon, carousel)
├── server/                # CodeIgniter 4 backend
│   ├── app/
│   │   ├── Commands/      # spark CLI commands (system:* — see Development Commands)
│   │   ├── Controllers/   # REST controllers (Current, Forecast, Heatmap, History, Sensors, Precipitation, Anomaly, Climate)
│   │   ├── Database/      # Migrations + Seeds
│   │   ├── Entities/      # Data entities (WeatherData, WeatherDataEntity, WeatherForecastEntity)
│   │   ├── Libraries/     # External API clients (OpenWeather, WeatherAPI, VisualCrossing, NarodMon) + AnomalyDetector, SnowpackCalculator
│   │   ├── Models/        # DB models (RawWeatherDataModel, Hourly/DailyAveragesModel, ForecastWeatherDataModel, ClimateModel, PrecipitationModel, AnomalyModel, AnomalyLogModel)
│   │   └── Config/        # Routes.php, app configuration
│   └── tests/             # PHPUnit test suites (unit/, database/, session/)
├── models/                # 3D-printable STL/CAD files for enclosure
├── docs/                  # Documentation assets and screenshots
├── config/                # Shared configuration files (docker-compose.yml, nginx.conf)
└── .github/workflows/     # GitHub Actions (sonarcloud, ui-checks, ui-deploy, api-checks, api-deploy, arduino-code-check)
```

---

## Development Commands

### Client (Next.js) — run from `client/`

```bash
yarn install              # Install dependencies
yarn dev                  # Start dev server (http://localhost:3000)
yarn build                # Production build
yarn start                # Start production server
yarn test                 # Run Jest unit tests
yarn test:coverage        # Run tests with coverage report
yarn eslint:check         # ESLint check
yarn eslint:fix           # ESLint auto-fix
yarn prettier:check       # Prettier check
yarn prettier:fix         # Prettier auto-fix
```

### Server (PHP) — run from `server/`

```bash
composer install                    # Install PHP dependencies
php spark migrate                   # Run database migrations
php spark db:seed                   # Run database seeds
php spark serve                     # Start local dev server (port 8080)
vendor/bin/phpunit                  # Run PHPUnit tests
vendor/bin/phpunit --coverage-html  # With HTML coverage report

# CLI commands (cron jobs)
php spark system:getCurrentWeather      # Fetches current weather from external APIs, recalculates hourly/daily averages
php spark system:getForecastWeather     # Fetches forecast weather from external APIs, upserts forecast_weather_data
php spark system:detectAnomalies        # Checks meteorological anomaly conditions, updates anomaly_log
php spark system:backfillAnomalyLog     # One-off backfill of anomaly_log from historical daily records
php spark system:sendNarodmonData       # Sends current sensor reading to narodmon.ru
```

### Arduino — use Arduino IDE

Load `arduino/main/main.ino` in Arduino IDE and upload to the board.

---

## Code Conventions

### PHP / CodeIgniter 4

- **Namespaces:** `App\Controllers`, `App\Models`, `App\Libraries`, `App\Entities`
- **Class names:** PascalCase
- **Method names:** camelCase; private methods prefixed with underscore (`_methodName`)
- **Constants:** UPPER_SNAKE_CASE
- **Properties:** camelCase with explicit visibility (`public`, `protected`, `private`)
- **Type hints:** Always present on parameters and return types
- **DocBlocks:** Required for all classes and public methods
- **Error handling:** `try-catch` with `log_message('error', ...)` — never suppress exceptions silently
- **Validation:** Use CodeIgniter validation rules (defined in `Validation/` or inline in controllers)
- **Controllers** extend `ResourceController`
- **Database access** through Model classes only — no raw queries in controllers

### TypeScript / React

- **No semicolons** (enforced by ESLint + Prettier)
- **Single quotes** for strings
- **Max line length:** 120 characters
- **Strict TypeScript** (`strict: true`) — no `any` types
- **Imports:** Sorted in groups by `simple-import-sort` — react → node → external → `@/*` aliases → relative → styles
- **Components:** Functional components only; props typed via `interface` or `type` in same file
- **Custom hooks:** Prefixed with `use`
- **Exports:** Named exports from feature files; `export default` from `index.ts` barrels
- **Switch statements:** Must be exhaustive
- **No `console.log`** — only `console.warn` / `console.error` permitted
- **JSX max depth:** 4 levels
- **CSS:** CSS Modules (`.module.sass` / `.module.scss`), no inline styles

### Arduino / C++

- **Configuration:** `#define` constants at the top of the file
- **Debug logging:** Conditional `DEBUG` macro (no-op in production)
- **Sensor objects:** Global, initialized in `setup()`
- **Interrupts:** Used for anemometer (wind speed)

---

## Environment Variables

### Client (`client/env` or `.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_HOST` | `http://localhost:8080/` | Backend API base URL |
| `NEXT_PUBLIC_SITE_LINK` | `http://localhost:3000/` | Public site URL (used for SEO/canonical links) |
| `NEXT_PUBLIC_STORAGE_KEY` | `meteo` | localStorage key prefix |

### Server (`server/.env`)

CodeIgniter dotted-key env vars — database (`database.production.*`), app coordinates (`app.lat`, `app.lon`), external API keys (`app.openweather.key`, `app.weatherapi.key`, `app.visualcrossing.key`), and NarodMon settings (`app.narodmon.mac`, `.lat`, `.lon`, `.alt`).

---

## Database Tables

| Table | Description |
|---|---|
| `raw_weather_data` | Raw sensor readings (Arduino + external API ingestion) |
| `hourly_averages` | Hourly-aggregated weather data |
| `daily_averages` | Daily-aggregated weather data |
| `forecast_weather_data` | Forecast data from external APIs |
| `anomaly_log` | Detected meteorological anomalies (z-score / flood-risk scoring) |

---

## API Routes

| Method | Path | Controller::Method |
|---|---|---|
| GET | `/` | API info (name/version/status) |
| GET | `/current` | Current::getCurrentWeather |
| GET | `/current/text` | Current::getCurrentTextWeather |
| GET | `/forecast/daily` | Forecast::getForecastDaily |
| GET | `/forecast/hourly` | Forecast::getForecastHourly |
| GET | `/history` | History::getHistoryWeather |
| GET | `/history/export` | History::getHistoryWeatherCSV |
| GET | `/heatmap` | Heatmap::getHeatmapData |
| POST | `/sensors` | Sensors::setWeather |
| GET | `/precipitation` | Precipitation::index |
| GET | `/anomaly` | Anomaly::index |
| GET | `/anomaly/history` | Anomaly::history |
| GET | `/climate` | Climate::index |

---

## Testing

### Server
- PHPUnit 11.5, config in `server/phpunit.xml.dist`
- Tests in `server/tests/unit/`, `server/tests/database/`
- Coverage collected from `server/app/**/*.php` (excludes views and routes)

### Client
- Jest 30 + ts-jest + jsdom, config in `client/jest.config.ts`
- Tests co-located in `client/tools/*.test.ts` and component directories
- Coverage from all `.ts`/`.tsx` except test files, index files, and pages

---

## CI/CD Pipelines

| Workflow | Trigger | Action |
|---|---|---|
| `sonarcloud.yml` | Push to main (incl. tags) / PRs | Run tests, upload LCOV to SonarCloud |
| `ui-checks.yml` | PRs to main (`client/**`) | ESLint, Prettier, Jest, Next.js build |
| `ui-deploy.yml` | Push to main (`client/**`) | Build and deploy frontend via FTP (lftp) |
| `api-checks.yml` | PRs to main (`server/**`) | PHPUnit tests |
| `api-deploy.yml` | Push to main (`server/**`) | Composer install, deploy server via FTP (lftp) |
| `arduino-code-check.yml` | Push to main / PRs touching `arduino/**` | Arduino lint check |

---

## Guidelines for AI Agents

1. **Read before editing.** Always read the target file before modifying it.
2. **Follow existing patterns.** Match the coding style of the surrounding code — naming, structure, imports, error handling.
3. **Server changes:** Use CodeIgniter 4 conventions. Do not write raw SQL in controllers. Use Models, Entities, and validation rules.
4. **Client changes:** No semicolons. No `any`. Keep imports sorted. Keep JSX depth ≤ 4. Use RTK Query for all API calls — do not use `fetch` or `axios` directly.
5. **No over-engineering.** Do not add abstractions, helpers, or patterns beyond what the task requires.
6. **Tests:** When adding logic to `tools/`, add or update the corresponding `.test.ts` file. For new PHP methods in controllers or libraries, add a PHPUnit test.
7. **i18n:** All user-facing strings in the frontend must use `useTranslation()` and have entries in both `public/locales/en/` and `public/locales/ru/`.
8. **Environment:** Never hard-code API keys, URLs, or credentials. Use environment variables.
9. **Database:** Schema changes require a new CodeIgniter migration file — never modify existing migrations.
10. **Do not commit** `vendor/`, `node_modules/`, `.next/`, `writable/`, or `env` files.
