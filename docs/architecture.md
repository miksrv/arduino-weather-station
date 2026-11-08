# Architecture

## High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARDUINO HARDWARE                         │
│  BMP085 · BH1750 · DHT22 · PCF8574 · GY-ML8511 · Anemometer   │
└──────────────────────────────┬──────────────────────────────────┘
                               │  HTTP POST /sensors?token=… (every 60 s)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PHP / CODEIGNITER API                      │
│  server/  ·  PHP 8.2+  ·  CodeIgniter 4.7  ·  MySQL            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Controllers │  │    Models    │  │      Libraries       │  │
│  │  Current     │  │  RawWeather  │  │  OpenWeatherMap      │  │
│  │  Forecast    │  │  Forecast    │  │  WeatherAPI          │  │
│  │  History     │  │  Hourly      │  │  VisualCrossing      │  │
│  │  Heatmap     │  │  Daily       │  │  OpenMeteo           │  │
│  │  Sensors     │  │  Climate     │  │  Metar (airport)     │  │
│  │  Precipitat. │  │  Precipitat. │  │  NarodMon (push)     │  │
│  │  Anomaly     │  │  Anomaly     │  │  AnomalyDetector     │  │
│  │  Climate     │  │  AnomalyLog  │  │  SnowpackCalculator  │  │
│  │  Events      │  └──────────────┘  │  ObservatorySafety   │  │
│  └──────────────┘                    └──────────────────────┘  │
│  Commands (php spark system:*) — cron entry points              │
└────────┬────────────────────────────────────┬───────────────────┘
         │  REST JSON                         │  CLI cron jobs
         ▼                                    ▼
┌──────────────────────┐         ┌────────────────────────────────┐
│   NEXT.JS DASHBOARD  │         │       EXTERNAL SERVICES        │
│  client/             │         │  OpenWeatherMap  (current+fc)  │
│  Next.js 16 · React  │         │  WeatherAPI.com  (current+fc)  │
│  RTK Query · ECharts │         │  VisualCrossing  (current+fc)  │
│  i18next (ru / en)   │         │  Open-Meteo      (current+fc)  │
└──────────────────────┘         │  METAR (NOAA AWC, observation) │
                                 │  NarodMon        (data push)   │
                                 └────────────────────────────────┘
```

## Three-Layer Architecture

### Layer 1 — Firmware (arduino/)

The Arduino firmware (C++) runs on an Arduino with an Ethernet shield. It reads sensor values every 60 seconds and sends a single HTTP POST request (form-encoded) to `POST /sensors` on the backend API. Authentication uses a shared secret token (`API_SECRET` in the sketch, `app.arduino.token` on the server) passed as the `token` query parameter.

Sensors managed by the firmware:

| Sensor     | Interface          | Measurement                   |
|------------|--------------------|-------------------------------|
| BMP085     | I2C                | Atmospheric pressure          |
| BH1750     | I2C                | Ambient light / solar energy  |
| PCF8574    | I2C expander       | Wind vane (direction)         |
| DHT22      | Digital pin 4      | Temperature, humidity         |
| Anemometer | Interrupt pin 3    | Wind speed                    |
| GY-ML8511  | Analog A0 / A1     | UV intensity                  |

### Layer 2 — Backend API (server/)

The PHP/CodeIgniter application exposes a REST API consumed by the frontend and receives POST data from the Arduino. It also runs scheduled CLI commands (via `php spark`) to pull current observations and forecasts from third-party weather services, detect anomalies and push local readings to NarodMon.

Raw measurements (station and external sources) are stored in `raw_weather_data`. `system:getCurrentWeather` aggregates them into `hourly_averages` (from raw rows) and `daily_averages` (rolled up from hourly rows; daily precipitation is the day's total), `system:getForecastWeather` populates `forecast_weather_data`, and `system:detectAnomalies` writes `anomaly_log`.

### Layer 3 — Frontend Dashboard (client/)

A Next.js 16 application (Pages Router) fetches all data through RTK Query endpoints backed by the backend API; above-the-fold data is prefetched in `getServerSideProps`. It presents real-time readings, sensor cards, historical charts (ECharts), a heatmap, a multi-day forecast, the precipitation calendar, the anomaly monitor and the climate page. The UI supports Russian and English (next-i18next) with light and dark themes (next-themes).

## Data Flow

```
Arduino sensors
    │
    │  POST /sensors?token=…  (every 60 s)
    ▼
raw_weather_data table  ◄──  php spark system:getCurrentWeather  ◄──  External APIs
    │                         (OpenWeatherMap, WeatherAPI.com, VisualCrossing,
    │                          Open-Meteo, airport METAR)
    │
    ├─► hourly_averages  (previous + current hour, recalculated by system:getCurrentWeather)
    └─► daily_averages   (previous + current day, rolled up from hourly_averages)
              │
              └─► anomaly_log  (php spark system:detectAnomalies — last complete UTC days)

External APIs (OpenWeatherMap, WeatherAPI.com, VisualCrossing, Open-Meteo)
    │
    │  php spark system:getForecastWeather  (scheduled cron)
    ▼
forecast_weather_data table

NarodMon
    ▲
    │  php spark system:sendNarodmonData  (scheduled cron, outbound push)
    │
raw_weather_data table

Frontend (RTK Query)
    │  GET /current, /forecast/daily, /forecast/hourly, /history, /heatmap,
    │      /precipitation, /anomaly, /anomaly/history, /climate, /events
    ▼
ECharts visualisations, summary cards, forecast table
```

`GET /current/text` is not used by the dashboard: it is the plain-text feed of the observatory's INDI Weather Watcher.

After the aggregation rules change, `php spark system:rebuildAverages [--since Y-m-d]` recalculates `hourly_averages` and `daily_averages` from raw data month by month, and `php spark system:backfillAnomalyLog --force` replays `anomaly_log`.

## External Services

| Service          | Direction | Purpose                                                                         |
|------------------|-----------|---------------------------------------------------------------------------------|
| OpenWeatherMap   | Inbound   | Current weather via `system:getCurrentWeather`, forecast via `system:getForecastWeather` |
| WeatherAPI.com   | Inbound   | Same two commands                                                               |
| VisualCrossing   | Inbound   | Same two commands                                                               |
| Open-Meteo       | Inbound   | Same two commands, plus air quality (no API key)                                |
| METAR (NOAA AWC) | Inbound   | Observed clouds / present weather of the airport `app.metar.station`; current weather only |
| NarodMon         | Outbound  | Receives local sensor readings pushed via `system:sendNarodmonData`             |

The providers polled by both fetch commands are listed in `server/app/Config/WeatherProviders.php`. API keys, coordinates and the METAR station are stored in the server `.env` file and read with `getenv()`.

## Database Tables

| Table                  | Purpose                                                         |
|------------------------|-----------------------------------------------------------------|
| `raw_weather_data`     | Every individual reading: the Arduino (60-second cadence) and each external source |
| `hourly_averages`      | Pre-aggregated averages per clock hour, computed from raw data  |
| `daily_averages`       | Pre-aggregated values per calendar day, rolled up from hourly averages (precipitation = day total) |
| `forecast_weather_data`| Forecast records fetched from external APIs                     |
| `anomaly_log`          | Detected meteorological anomaly episodes                        |

Migrations live in `server/app/Database/Migrations/`. Existing migration files must never be modified; new schema changes always go into new migration files.

## CI/CD Pipelines

All pipelines are defined in `.github/workflows/`.

| Workflow file           | Trigger                              | What it does                                                    |
|-------------------------|--------------------------------------|-----------------------------------------------------------------|
| `ui-checks.yml`         | PR to main (`client/**`)             | Runs ESLint, Prettier, Jest, and `next build` on the client     |
| `ui-deploy.yml`         | Push to main (`client/**`)           | Builds the standalone Next.js output and deploys via SSH (`rsync` + PM2 restart) |
| `api-checks.yml`        | PR to main (`server/**`)             | Runs PHPUnit                                                    |
| `api-deploy.yml`        | Push to main (`server/**`)           | Composer install, deploys the PHP server files via FTP (lftp)   |
| `sonarcloud.yml`        | Push to main (incl. `v*` tags) / PR  | Runs PHPUnit and Jest with coverage, uploads to SonarCloud      |
| `arduino-code-check.yml`| Push to main / PR (`arduino/**`)     | Compiles every sketch with `arduino-cli` (Uno) to verify it builds |
