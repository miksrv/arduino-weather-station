# Backend

## Stack

| Component        | Version / Details                         |
|------------------|-------------------------------------------|
| PHP              | 8.2+                                      |
| CodeIgniter      | 4.7                                       |
| MySQL            | Any version compatible with CI4 driver    |
| HTTP client      | CodeIgniter `CURLRequest`                 |
| PHPUnit          | 11.5 (testing)                            |
| Composer         | Dependency management                     |

## Directory Structure

```
server/
├── app/
│   ├── Commands/             # spark CLI commands (system:*) — cron entry points
│   ├── Config/               # Routes.php, Filters.php, WeatherProviders.php, …
│   ├── Controllers/          # REST controllers
│   ├── Models/               # Database query classes
│   ├── Entities/             # Data entity classes
│   ├── Filters/              # CORS, throttle, Cache-Control/ETag
│   ├── Libraries/            # External API clients, anomaly/snowpack/safety logic
│   └── Database/
│       ├── Migrations/       # Versioned schema migration files
│       └── Seeds/            # DevWeatherSeeder (local development data)
├── tests/
│   ├── unit/                 # Unit tests (models and DB mocked)
│   ├── database/             # CodeIgniter example DB test (in-memory SQLite)
│   └── session/              # CodeIgniter example session test
├── env                       # Environment template (copy to .env)
├── phpunit.xml.dist          # PHPUnit configuration
└── composer.json
```

## Controllers

All controllers extend `ResourceController`; scheduled work lives in spark commands, not in controllers.

| Controller      | Purpose                                                                                     |
|-----------------|---------------------------------------------------------------------------------------------|
| `Current`       | Latest weather as JSON; `/current/text` is the `key=value` feed of the observatory's INDI Weather Watcher |
| `Forecast`      | Daily and hourly forecast aggregated from `forecast_weather_data`                           |
| `History`       | Queries `hourly_averages` (≤ 7 days) / `daily_averages` (longer ranges); exports CSV        |
| `Heatmap`       | Aggregates data for heatmap visualisation across a selected time period                    |
| `Sensors`       | Receives POST data from the Arduino, checks the token, writes to `raw_weather_data`        |
| `Precipitation` | Daily precipitation totals and yearly statistics for the precipitation calendar            |
| `Anomaly`       | Anomaly monitor state (flood risk, snowpack, z-scores, anomalies) and per-season SWE series |
| `Climate`       | Long-term climate statistics computed from `daily_averages`                                 |
| `Events`        | "Recent events" feed derived on every request from raw/hourly data and `anomaly_log`        |

## Models

| Model                     | Table                   | Purpose                                                  |
|---------------------------|-------------------------|----------------------------------------------------------|
| `RawWeatherDataModel`     | `raw_weather_data`      | Insert and query individual readings (station + external sources); hourly aggregation |
| `ForecastWeatherDataModel`| `forecast_weather_data` | Upsert and query forecast records from external APIs     |
| `HourlyAveragesModel`     | `hourly_averages`       | Hourly summaries; daily roll-up                          |
| `DailyAveragesModel`      | `daily_averages`        | Daily summaries                                          |
| `ClimateModel`            | `daily_averages`        | Climate statistics for the Climate controller            |
| `PrecipitationModel`      | `daily_averages`        | Daily precipitation totals, streaks and yearly stats     |
| `AnomalyLogModel`         | `anomaly_log`           | Anomaly episodes (open / close / re-open), calendar data |
| `AnomalyModel`            | —                       | Plain orchestration class assembling the `/anomaly` response |

## Libraries

| Library                     | Role                                                                          |
|-----------------------------|-------------------------------------------------------------------------------|
| `OpenWeatherAPILibrary`     | Current weather and forecast from OpenWeatherMap                              |
| `WeatherAPILibrary`         | Current weather and forecast from WeatherAPI.com                              |
| `VisualCrossingAPILibrary`  | Current weather and forecast from VisualCrossing                              |
| `OpenMeteoAPILibrary`       | Current weather, forecast and air quality from Open-Meteo                     |
| `MetarAPILibrary`           | Observed clouds and present weather from the airport METAR (`app.metar.station`); no forecast |
| `NarodMonLibrary`           | Pushes current sensor readings outbound to narodmon.ru                        |
| `AnomalyDetector`           | Z-scores, SPI and all anomaly condition checks                                |
| `SnowpackCalculator`        | Temperature-index snow water equivalent model                                 |
| `ObservatorySafety`         | Confirmed safety values of `/current/text`                                    |
| `ForecastAggregator`        | Per-source forecast rows → hourly → daily                                     |
| `EventFeedBuilder`          | Builds the `/events` feed                                                     |
| `DevWeatherGenerator`       | Synthetic weather for `DevWeatherSeeder` (development only)                   |

The weather providers implement `WeatherProviderInterface` and are registered in `app/Config/WeatherProviders.php`; `system:getCurrentWeather` and `system:getForecastWeather` poll every provider in that list.

## API Route Table

| Method | Route               | Controller action                | Description                                     |
|--------|---------------------|----------------------------------|-------------------------------------------------|
| GET    | `/`                 | closure                          | API info (name, version, status)                |
| GET    | `/current`          | `Current::getCurrentWeather`     | Latest weather reading as JSON                  |
| GET    | `/current/text`     | `Current::getCurrentTextWeather` | Plain-text feed for the observatory (never cached) |
| GET    | `/forecast/daily`   | `Forecast::getForecastDaily`     | Multi-day forecast                              |
| GET    | `/forecast/hourly`  | `Forecast::getForecastHourly`    | Hourly forecast                                 |
| GET    | `/history`          | `History::getHistoryWeather`     | Historical averages for a date range            |
| GET    | `/history/export`   | `History::getHistoryWeatherCSV`  | Download historical data as CSV                 |
| GET    | `/heatmap`          | `Heatmap::getHeatmapData`        | Aggregated data for heatmap visualisation       |
| POST   | `/sensors`          | `Sensors::setWeather`            | Receive and store an Arduino sensor reading     |
| GET    | `/precipitation`    | `Precipitation::index`           | Precipitation calendar for a year               |
| GET    | `/anomaly`          | `Anomaly::index`                 | Anomaly monitor state                           |
| GET    | `/anomaly/history`  | `Anomaly::history`               | SWE series of one hydrological season           |
| GET    | `/climate`          | `Climate::index`                 | Climate statistics                              |
| GET    | `/events`           | `Events::index`                  | Recent events feed                              |

Routes are defined in `app/Config/Routes.php`. GET responses get `Cache-Control` and an ETag from `Filters/CacheControlFilter.php` (max-age per route in `Config/Filters.php`); `POST /sensors` is throttled to one request per 30 seconds per IP.

## CLI Spark Commands

These commands are intended to be called by the server's cron daemon, not through HTTP.

```bash
# Fetch current weather from all external APIs, recalculate hourly/daily averages
php spark system:getCurrentWeather

# Fetch forecasts from all external APIs, upsert forecast_weather_data
php spark system:getForecastWeather

# Evaluate the last complete UTC days for anomalies, update anomaly_log
php spark system:detectAnomalies

# Push the latest reading to NarodMon
php spark system:sendNarodmonData

# Maintenance (manual)
php spark system:rebuildAverages [--since Y-m-d]   # recalculate hourly/daily averages from raw data
php spark system:backfillAnomalyLog [--force]      # rebuild anomaly_log from all daily records
```

Schedule example (run in `server/`, see the root `README.md` for the full crontab):

```
0    *   * * *  php spark system:getCurrentWeather
0    */4 * * *  php spark system:getForecastWeather
*/15 *   * * *  php spark system:sendNarodmonData
30   1   * * *  php spark system:detectAnomalies
```

## Database Migrations

Migrations live in `server/app/Database/Migrations/`. The naming follows CodeIgniter's timestamp convention.

**Rules:**
- Never modify an existing migration file. Once a migration has been applied to any environment it is immutable.
- All new schema changes must be added as new migration files.
- Run migrations with `php spark migrate`.
- Roll back with `php spark migrate:rollback`.

## Validation Rules

`POST /sensors` requires the `token` query parameter to match `app.arduino.token` (an empty server token rejects every request). The `Sensors` controller then checks each posted field on its own — a non-numeric or out-of-range value is dropped and logged instead of rejecting the whole reading; negative wind speed / UV is clamped to 0. Pressure below 800 is treated as mmHg and converted to hPa. Wind (`ws`, `wd`) is stored only when the payload carries `fw` ≥ 2 (m/s and degrees); the old firmware's pulse counts and sector numbers are dropped.

`RawWeatherDataModel` validates the row before it is written:

| Field    | Rule                    | Notes                                                                                    |
|----------|-------------------------|------------------------------------------------------------------------------------------|
| date     | required, valid_date    | Must be a parseable date string                                                          |
| source   | required, in_list       | Allowed values: `OpenWeatherMap`, `WeatherAPI`, `VisualCrossing`, `OpenMeteo`, `Metar`, `CustomStation`, `OtherSource` |
| All other sensor fields | permit_empty + range | Readings may be absent if a sensor is not connected or returns no value   |

## Setup

```bash
# 1. Navigate to the server directory
cd server

# 2. Install PHP dependencies
composer install

# 3. Copy environment template and configure
cp env .env
# Edit .env — set database credentials, API keys, coordinates and app.arduino.token

# 4. Apply database migrations
php spark migrate

# 5. Start the built-in development server
php spark serve
# API available at http://localhost:8080
# Outside production it first fills synthetic weather with DevWeatherSeeder (--no-seed to skip)
```

Key `.env` settings (see `server/env`):

```ini
# database.development.* locally; database.production.* when CI_ENVIRONMENT = production
database.development.hostname = 127.0.0.1
database.development.database = db
database.development.username = user
database.development.password = password

app.arduino.token = your_secret_token

# Station coordinates (used by the weather APIs)
app.lat = 51.77
app.lon = 55.10

# External API keys
app.openweather.key    = ...
app.weatherapi.key     = ...
app.visualcrossing.key = ...

# Airport METAR (ICAO code, empty disables the source)
app.metar.station = UWOO

# NarodMon
app.narodmon.mac = ...
app.narodmon.lat = ...
app.narodmon.lon = ...
app.narodmon.alt = ...
```
