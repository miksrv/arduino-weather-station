# Backend

## Stack

| Component        | Version / Details                         |
|------------------|-------------------------------------------|
| PHP              | 8.2                                       |
| CodeIgniter      | 4.6                                       |
| MySQL            | Any version compatible with CI4 driver    |
| GuzzleHTTP       | 7                                         |
| firebase/php-jwt | JWT authentication for Arduino token      |
| PHPUnit          | 11.5 (testing)                            |
| Composer         | Dependency management                     |

## Directory Structure

```
server/
├── app/
│   ├── Controllers/          # HTTP and CLI request handlers
│   ├── Models/               # Database query classes
│   ├── Entities/             # Data entity classes
│   ├── Libraries/            # External API integration clients
│   └── Database/
│       └── Migrations/       # Versioned schema migration files
├── tests/
│   ├── unit/                 # Unit tests (no DB)
│   └── database/             # Integration tests (DB required)
├── env                       # Environment template (copy to .env)
├── phpunit.xml.dist          # PHPUnit configuration
└── composer.json
```

## Controllers

| Controller  | Type | Purpose                                                                                |
|-------------|------|----------------------------------------------------------------------------------------|
| `Current`   | HTTP | Returns the latest sensor reading; also serves a plain-text summary via `/current/text`|
| `Forecast`  | HTTP | Returns daily and hourly forecast records from `forecast_weather_data`                 |
| `History`   | HTTP | Queries `hourly_averages` / `daily_averages` for a date range; exports CSV             |
| `Heatmap`   | HTTP | Aggregates data for heatmap visualisation across a selected time period                |
| `Sensors`   | HTTP | Receives POST data from the Arduino, validates the token, writes to `raw_weather_data` |
| `System`    | CLI  | Cron entry-points: fetch current aggregates, pull forecast data, push to NarodMon      |

## Models

| Model                    | Table                  | Purpose                                                  |
|--------------------------|------------------------|----------------------------------------------------------|
| `RawWeatherDataModel`    | `raw_weather_data`     | Insert and query individual Arduino readings             |
| `ForecastWeatherDataModel`| `forecast_weather_data`| Insert and query forecast records from external APIs    |
| `HourlyAveragesModel`    | `hourly_averages`      | Query pre-aggregated hourly summaries                    |
| `DailyAveragesModel`     | `daily_averages`       | Query pre-aggregated daily summaries                     |

## External API Libraries

| Library                       | Role                                                                          |
|-------------------------------|-------------------------------------------------------------------------------|
| `OpenWeatherMapAPILibrary`    | Fetches forecast JSON from OpenWeatherMap and normalises it for storage        |
| `WeatherAPILibrary`           | Fetches forecast JSON from WeatherAPI.com and normalises it for storage        |
| `VisualCrossingAPILibrary`    | Fetches forecast JSON from VisualCrossing and normalises it for storage        |
| `NarodMonAPILibrary`          | Pushes current sensor readings outbound to the NarodMon monitoring network     |

All libraries live in `server/app/Libraries/` and are injected into the `System` controller.

## API Route Table

| Method | Route               | Controller action         | Description                                     |
|--------|---------------------|---------------------------|-------------------------------------------------|
| GET    | `/current`          | `Current::index`          | Latest weather reading as JSON                  |
| GET    | `/current/text`     | `Current::text`           | Latest weather reading as plain text            |
| GET    | `/forecast/daily`   | `Forecast::daily`         | Multi-day forecast records                      |
| GET    | `/forecast/hourly`  | `Forecast::hourly`        | Hourly forecast records                         |
| GET    | `/history`          | `History::index`          | Historical averages for a date range            |
| GET    | `/history/export`   | `History::export`         | Download historical data as CSV                 |
| GET    | `/heatmap`          | `Heatmap::index`          | Aggregated data for heatmap visualisation       |
| POST   | `/sensors`          | `Sensors::create`         | Receive and store an Arduino sensor reading     |

## CLI Spark Commands

These commands are intended to be called by the server's cron daemon, not through HTTP.

```bash
# Aggregate raw sensor data into hourly/daily averages
php spark system:current

# Pull forecast data from all configured external APIs
php spark system:forecast

# Push the latest reading to NarodMon
php spark system:narodmon
```

Schedule example (run in `server/`):

```
*/5  * * * *  php spark system:current
0    */1 * * *  php spark system:forecast
*/10 * * * *  php spark system:narodmon
```

## Database Migrations

Migrations live in `server/app/Database/Migrations/`. The naming follows CodeIgniter's timestamp convention.

**Rules:**
- Never modify an existing migration file. Once a migration has been applied to any environment it is immutable.
- All new schema changes must be added as new migration files.
- Run migrations with `php spark migrate`.
- Roll back with `php spark migrate:rollback`.

## Validation Rules

The `Sensors` controller validates the incoming POST payload before writing to the database.

| Field    | Rule                    | Notes                                                                                    |
|----------|-------------------------|------------------------------------------------------------------------------------------|
| date     | required, valid_date    | Must be a parseable date string                                                          |
| source   | required, in_list       | Allowed values: `OpenWeatherMap`, `WeatherAPI`, `VisualCrossing`, `CustomStation`, `OtherSource` |
| All other sensor fields | permit_empty | Readings may be absent if a sensor is not connected or returns no value   |

## Setup

```bash
# 1. Navigate to the server directory
cd server

# 2. Install PHP dependencies
composer install

# 3. Copy environment template and configure
cp env .env
# Edit .env — set database credentials, API keys, and app.arduino.token

# 4. Apply database migrations
php spark migrate

# 5. Start the built-in development server
php spark serve
# API available at http://localhost:8080
```

Key `.env` settings:

```ini
database.default.hostname = localhost
database.default.database = weather_station
database.default.username = your_db_user
database.default.password = your_db_password

app.arduino.token = your_secret_token

# External API keys
app.openWeatherMap.apiKey = ...
app.weatherApi.apiKey = ...
app.visualCrossing.apiKey = ...
app.narodmon.deviceId = ...
```
