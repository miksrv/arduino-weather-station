# Architecture

## High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARDUINO HARDWARE                         │
│  BMP085 · BH1750 · DHT22 · PCF8574 · GY-ML8511 · Anemometer   │
└──────────────────────────────┬──────────────────────────────────┘
                               │  HTTP POST /sensors (every 60 s)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PHP / CODEIGNITER API                      │
│  server/  ·  PHP 8.2  ·  CodeIgniter 4.6  ·  MySQL             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Controllers │  │    Models    │  │      Libraries       │  │
│  │  Current     │  │  RawWeather  │  │  OpenWeatherMap      │  │
│  │  Forecast    │  │  Forecast    │  │  WeatherAPI          │  │
│  │  History     │  │  Hourly      │  │  VisualCrossing      │  │
│  │  Heatmap     │  │  Daily       │  │  NarodMon (push)     │  │
│  │  Sensors     │  └──────────────┘  └──────────────────────┘  │
│  │  System      │                                               │
│  └──────────────┘                                               │
└────────┬────────────────────────────────────┬───────────────────┘
         │  REST JSON                         │  CLI cron jobs
         ▼                                    ▼
┌──────────────────────┐         ┌────────────────────────────────┐
│   NEXT.JS DASHBOARD  │         │       EXTERNAL SERVICES        │
│  client/             │         │  OpenWeatherMap  (forecast)    │
│  Next.js 16 · React  │         │  WeatherAPI.com  (forecast)    │
│  RTK Query · ECharts │         │  VisualCrossing  (forecast)    │
│  i18next (ru / en)   │         │  NarodMon        (data push)   │
└──────────────────────┘         └────────────────────────────────┘
```

## Three-Layer Architecture

### Layer 1 — Firmware (arduino/)

The Arduino firmware (C++) runs on an Arduino or ESP32 microcontroller. It reads sensor values every 60 seconds and sends a single HTTP POST request to `POST /sensors` on the backend API. Authentication uses a shared secret token (`API_SECRET`) configured in both the sketch and the server environment.

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

The PHP/CodeIgniter application exposes a REST API consumed by the frontend and receives POST data from the Arduino. It also runs scheduled CLI commands (via `php spark`) to pull forecast data from third-party weather services and push local readings to NarodMon.

Raw measurements are stored in `raw_weather_data`. Background cron jobs aggregate data into `hourly_averages` and `daily_averages`, and populate `forecast_weather_data` from external APIs.

### Layer 3 — Frontend Dashboard (client/)

A Next.js 16 application (Pages Router) fetches all data through RTK Query endpoints backed by the backend API. It presents real-time readings, historical charts (ECharts), a heatmap, and a multi-day forecast. The UI supports Russian and English (next-i18next) with light and dark themes (next-themes).

## Data Flow

```
Arduino sensors
    │
    │  POST /sensors  (every 60 s, bearer token auth)
    ▼
raw_weather_data table
    │
    ├─► hourly_averages  (aggregated by System controller / cron)
    └─► daily_averages   (aggregated by System controller / cron)

External APIs (OpenWeatherMap, WeatherAPI.com, VisualCrossing)
    │
    │  php spark system:forecast  (scheduled cron)
    ▼
forecast_weather_data table

NarodMon
    ▲
    │  php spark system:narodmon  (scheduled cron, outbound push)
    │
raw_weather_data table

Frontend (RTK Query)
    │  GET /current, /forecast/daily, /forecast/hourly,
    │      /history, /heatmap, /current/text
    ▼
ECharts visualisations, summary cards, forecast table
```

## External Services

| Service          | Direction | Purpose                                                    |
|------------------|-----------|------------------------------------------------------------|
| OpenWeatherMap   | Inbound   | Fetches forecast data on a schedule via `system:forecast`  |
| WeatherAPI.com   | Inbound   | Alternative forecast source, same cron command             |
| VisualCrossing   | Inbound   | Additional forecast provider, same cron command            |
| NarodMon         | Outbound  | Receives local sensor readings pushed via `system:narodmon`|

Credentials and API keys for all four services are stored in the server `.env` file and accessed through CodeIgniter's environment-variable helpers.

## Database Tables

| Table                  | Purpose                                                         |
|------------------------|-----------------------------------------------------------------|
| `raw_weather_data`     | Every individual reading posted by the Arduino (60-second cadence) |
| `hourly_averages`      | Pre-aggregated averages per clock hour, computed from raw data  |
| `daily_averages`       | Pre-aggregated averages per calendar day, computed from raw data|
| `forecast_weather_data`| Forecast records fetched from external APIs                     |

Migrations live in `server/app/Database/Migrations/`. Existing migration files must never be modified; new schema changes always go into new migration files.

## CI/CD Pipelines

All pipelines are defined in `.github/workflows/`.

| Workflow file           | Trigger                  | What it does                                                    |
|-------------------------|--------------------------|-----------------------------------------------------------------|
| `ui-checks.yml`         | PR to main               | Runs ESLint, Prettier, Jest, and `next build` on the client     |
| `ui-deploy.yml`         | Push to main             | Builds the Next.js app and deploys via FTP to production        |
| `api-deploy.yml`        | Push to main             | Deploys the PHP server files via FTP to production              |
| `sonarcloud.yml`        | Push / PR                | Uploads LCOV coverage to SonarCloud quality gate                |
| `arduino-code-check.yml`| Push / PR                | Compiles the Arduino sketch to verify it builds without errors  |
