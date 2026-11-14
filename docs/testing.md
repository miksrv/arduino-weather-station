# Testing Guide

## Server Testing (PHPUnit)

### Setup

| Item             | Details                                                            |
|------------------|--------------------------------------------------------------------|
| Framework        | PHPUnit 11.5                                                       |
| Configuration    | `server/phpunit.xml.dist`                                          |
| Test suite       | One suite (`App`) covering everything under `server/tests/`        |
| Bootstrap        | CodeIgniter 4 framework bootstrap (configured in `phpunit.xml.dist`) |
| Test database    | `tests` group in `app/Config/Database.php` — in-memory SQLite      |

### Test Categories

| Directory                 | Type              | Description                                        |
|---------------------------|-------------------|----------------------------------------------------|
| `server/tests/unit/`      | Unit tests        | Controllers, models, libraries, filters, commands — models and the DB are mocked |
| `server/tests/database/`  | Example           | CodeIgniter's example database test (in-memory SQLite) |
| `server/tests/session/`   | Example           | CodeIgniter's example session test                 |

### Running Tests

```bash
cd server

# Run all tests
vendor/bin/phpunit

# Run only one directory
vendor/bin/phpunit tests/unit

# Run one test class
vendor/bin/phpunit --filter PrecipitationModelTest

# Run with readable output
vendor/bin/phpunit --testdox
```

### Coverage

Coverage is configured in `server/phpunit.xml.dist`:

- **Source:** `server/app/**/*.php`
- **Excluded:** `app/Views`, `app/Config/Routes.php`
- **Output formats:** Clover XML (`build/logs/clover.xml`), HTML (`build/logs/html`) and a text summary

To generate a coverage report locally PHP must have Xdebug or PCOV installed:

```bash
vendor/bin/phpunit --coverage-html coverage/
```

---

## Client Testing (Jest)

### Setup

| Item              | Details                                                           |
|-------------------|-------------------------------------------------------------------|
| Framework         | Jest 30                                                           |
| TypeScript runner | ts-jest                                                           |
| DOM environment   | jsdom                                                             |
| React utilities   | @testing-library/react                                            |

### Test File Locations

Tests are co-located close to the code they cover:

| Location                      | What is tested                                          |
|-------------------------------|---------------------------------------------------------|
| `client/tools/*.test.ts`      | Pure utility / helper functions                         |
| `client/hooks/*.test.ts`      | Custom React hooks                                      |
| `client/api/*.test.ts`        | SSR prefetch helpers                                    |
| Next to component files       | Component render and interaction tests                  |

### Running Tests

```bash
cd client

# Run all tests (watch mode in interactive terminal)
yarn test

# Run all tests once (CI mode)
yarn test --ci

# Run with coverage
yarn test:coverage
```

### Coverage

- **Included:** all `.ts` and `.tsx` files
- **Excluded:** `*.test.tsx` files, `*.d.ts`, `index.ts` barrel files, Next.js page files (`pages/**`) and `.next/`

---

## CI Pipelines

### `ui-checks.yml` — Pull Request Quality Gate

Runs on every PR targeting `main` that touches `client/**`. Steps:

1. Install dependencies (`yarn workspaces focus`)
2. Run ESLint (`yarn eslint:check`)
3. Run Prettier check (`yarn prettier:check`)
4. Run Jest (`yarn test`)
5. Run `yarn build` (type-check + Next.js compilation)

All steps must pass before a PR can be merged.

### `api-checks.yml` — Server Quality Gate

Runs on every PR targeting `main` that touches `server/**`: `composer install`, then `vendor/bin/phpunit --no-coverage` on PHP 8.4.

### `sonarcloud.yml` — Code Quality Analysis

Runs on push to `main` (including `v*` tags) and on PRs. Steps:

1. Run PHPUnit with Clover coverage (`server/build/logs/clover.xml`)
2. Run Jest with LCOV coverage output (`yarn test:coverage`)
3. Upload both reports to SonarCloud
4. SonarCloud evaluates the quality gate

| SonarCloud setting | Value                              |
|--------------------|------------------------------------|
| Project key        | `miksrv_arduino-weather-station`   |
| Organisation       | `miksoft`                          |

### `arduino-code-check.yml` — Firmware Compilation

Compiles every sketch in `arduino/*/` with `arduino-cli` for the Arduino Uno (`arduino:avr:uno`), with the bundled BMP085/PCF8574 libraries installed, on every push to `main` and every PR touching `arduino/**`. No upload to hardware occurs in CI.

---

## Testing Conventions

### General

- `test.only` and `test.skip` must not appear in committed code — use them locally only.
- Tests must be deterministic: avoid relying on the current system time; use Jest fake timers instead.
- Test descriptions should read as plain English sentences (`it('returns humidity as a number')`).

### React Component Tests (@testing-library)

- Use `render` and `screen` from `@testing-library/react`; do not query the DOM directly.
- Do not test implementation details (internal state, private methods). Test visible behaviour and rendered output.
- Prefer `getByRole`, `getByLabelText`, and `getByText` over `getByTestId` wherever possible.
- For async behaviour use `waitFor` or `findBy*` queries.

### Utility Function Tests

- Keep tests in `client/tools/*.test.ts` co-located with the utility file.
- One `describe` block per function, with distinct `it` cases for each significant input or edge case.
- Use Jest fake timers (`jest.useFakeTimers`) whenever a function depends on the current date or time.
