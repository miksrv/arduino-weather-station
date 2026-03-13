# Development Guide

## Prerequisites

| Tool          | Minimum version | Purpose                                      |
|---------------|-----------------|----------------------------------------------|
| Node.js       | 20              | Frontend runtime and build tooling           |
| Yarn          | 4               | Frontend package manager                     |
| PHP           | 8.2             | Backend runtime                              |
| Composer      | Latest stable   | PHP dependency manager                       |
| MySQL         | Any CI4-compatible version | Backend database                  |
| Arduino IDE   | 2.x recommended | Compile and upload the Arduino firmware      |

## Complete Setup Walkthrough

### 1. Clone the Repository

```bash
git clone https://github.com/miksrv/arduino-weather-station.git
cd arduino-weather-station
```

### 2. Server Setup (PHP + CodeIgniter)

```bash
cd server

# Install PHP dependencies
composer install

# Copy environment template
cp env .env

# Edit .env — minimum required settings:
#   database.default.hostname
#   database.default.database
#   database.default.username
#   database.default.password
#   app.arduino.token          (shared secret with the Arduino sketch)
#   app.openWeatherMap.apiKey  (if using forecast)
#   app.weatherApi.apiKey      (if using forecast)
#   app.visualCrossing.apiKey  (if using forecast)
#   app.narodmon.deviceId      (if pushing to NarodMon)

# Apply database migrations
php spark migrate

# Start the development server
php spark serve
# API available at http://localhost:8080
```

### 3. Client Setup (Next.js)

```bash
cd client

# Install frontend dependencies
yarn install

# Copy environment template
cp env .env.local

# Edit .env.local:
#   NEXT_PUBLIC_API_HOST    = 'http://localhost:8080/'
#   NEXT_PUBLIC_SITE_LINK   = 'http://localhost:3000/'
#   NEXT_PUBLIC_STORAGE_KEY = 'meteo'

# Start the development server
yarn dev
# Dashboard available at http://localhost:3000
```

### 4. Arduino Setup

```bash
# Open the sketch in the Arduino IDE:
arduino/main/main.ino
```

Configure these constants inside `main.ino`:

| Constant        | Description                                                   |
|-----------------|---------------------------------------------------------------|
| `API_SERVER`    | URL of your backend, e.g. `http://192.168.1.100:8080`        |
| `API_METHOD`    | Endpoint path — default `/sensors`, change only if modified  |
| `API_SECRET`    | Must match `app.arduino.token` in the server `.env`          |
| `PIN_ANEMOMETR` | Arduino pin connected to the anemometer (default: 3, interrupt) |
| `PIN_DHT22`     | Arduino pin connected to the DHT22 (default: 4)              |
| `PIN_UV_OUT`    | Analog pin for GY-ML8511 output (default: A0)                |
| `PIN_UV_REF`    | Analog pin for GY-ML8511 reference (default: A1)             |

Before compiling, extract the bundled libraries into the Arduino IDE `libraries/` folder:

- `arduino/BMP085_Library.zip`
- `arduino/PCF8574_Library.zip`

Then connect your Arduino and upload the sketch.

## Development Commands

### Client

```bash
# Start development server with hot reload
yarn dev

# Type-check and build for production
yarn build

# Serve the production build
yarn start

# Run all tests
yarn test

# Run tests with coverage
yarn test:coverage

# Lint source files
yarn lint

# Format source files
yarn format
```

### Server

```bash
# Start the built-in PHP development server
php spark serve

# Apply pending migrations
php spark migrate

# Roll back the last migration batch
php spark migrate:rollback

# Aggregate raw data into hourly/daily averages
php spark system:current

# Pull forecast from all configured external APIs
php spark system:forecast

# Push latest reading to NarodMon
php spark system:narodmon

# Run PHP unit tests
vendor/bin/phpunit
```

## PHP Code Conventions

| Convention                      | Rule                                                                          |
|---------------------------------|-------------------------------------------------------------------------------|
| Namespaces                      | Follow PSR-4: `App\Controllers`, `App\Models`, `App\Libraries`, etc.         |
| Type hints                      | Required on all method parameters and return types                            |
| DocBlocks                       | Required on all public methods; include `@param` and `@return` tags           |
| Private methods                 | Prefix with underscore: `_myPrivateMethod()`                                  |
| Constants                       | `UPPER_SNAKE_CASE`                                                            |
| SQL                             | No raw SQL strings in controllers — all queries go through Model methods      |
| Environment values              | Access via `env('key')` or `$this->request->env()`; never `$_ENV` directly   |

## TypeScript Code Conventions

| Convention         | Rule                                                                         |
|--------------------|------------------------------------------------------------------------------|
| Semicolons         | No semicolons                                                                |
| Quotes             | Single quotes                                                                |
| `any` type         | Prohibited — use specific types or `unknown`                                 |
| Import order       | External packages first, then internal aliases, then relative paths          |
| JSX nesting depth  | Maximum 4 levels — extract sub-components if deeper                          |
| `console.log`      | Must not appear in committed code                                            |
| Styling            | CSS Modules only — no inline `style` props, no arbitrary class strings       |
| API calls          | RTK Query endpoints only — no raw `fetch` or Axios in components             |
| State              | Redux (RTK) for global state; `useState` only for component-local UI state   |

## Branch and PR Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make changes and commit with a descriptive message.
3. Push and open a pull request targeting `main`.
4. The `ui-checks.yml` workflow runs automatically on every PR: ESLint, Prettier, Jest, and `next build` must all pass.
5. After review and approval, merge to `main`. The deploy workflows (`ui-deploy.yml`, `api-deploy.yml`) trigger on push to `main`.

## Environment Variable Reference

### Client (`client/.env.local`)

| Variable                  | Example value                   | Description                                     |
|---------------------------|---------------------------------|-------------------------------------------------|
| `NEXT_PUBLIC_API_HOST`    | `http://localhost:8080/`        | Backend API base URL                            |
| `NEXT_PUBLIC_SITE_LINK`   | `http://localhost:3000/`        | Public frontend URL (used for canonical links)  |
| `NEXT_PUBLIC_STORAGE_KEY` | `meteo`                         | localStorage key prefix                         |

### Server (`server/.env`)

| Variable                            | Description                                              |
|-------------------------------------|----------------------------------------------------------|
| `database.default.hostname`         | MySQL host                                               |
| `database.default.database`         | Database name                                            |
| `database.default.username`         | Database user                                            |
| `database.default.password`         | Database password                                        |
| `app.arduino.token`                 | Shared secret for Arduino authentication                 |
| `app.openWeatherMap.apiKey`         | OpenWeatherMap API key                                   |
| `app.openWeatherMap.latitude`       | Station latitude for forecast requests                   |
| `app.openWeatherMap.longitude`      | Station longitude for forecast requests                  |
| `app.weatherApi.apiKey`             | WeatherAPI.com API key                                   |
| `app.visualCrossing.apiKey`         | VisualCrossing API key                                   |
| `app.narodmon.deviceId`             | NarodMon device identifier                               |
