# Testing Guide

## Server Testing (PHPUnit)

### Setup

| Item             | Details                                                            |
|------------------|--------------------------------------------------------------------|
| Framework        | PHPUnit 11.5                                                       |
| Configuration    | `server/phpunit.xml.dist`                                          |
| Test paths       | `server/tests/unit/`, `server/tests/database/`                     |
| Bootstrap        | CodeIgniter 4 framework bootstrap (configured in `phpunit.xml.dist`) |

### Test Categories

| Directory                 | Type              | Description                                        |
|---------------------------|-------------------|----------------------------------------------------|
| `server/tests/unit/`      | Unit tests        | Test individual classes in isolation, no DB needed |
| `server/tests/database/`  | Integration tests | Test models and queries against a real database    |

### Running Tests

```bash
cd server

# Run all tests
vendor/bin/phpunit

# Run only unit tests
vendor/bin/phpunit --testsuite unit

# Run only database tests
vendor/bin/phpunit --testsuite database

# Run with verbose output
vendor/bin/phpunit --testdox
```

### Coverage

Coverage is configured in `server/phpunit.xml.dist`:

- **Source:** `server/app/**/*.php`
- **Excluded:** view files, `Routes.php`
- **Output formats:** HTML report and Clover XML (`clover.xml`)

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
- **Excluded:** test files themselves (`*.test.ts`, `*.test.tsx`), index barrel files (`index.ts`), Next.js page files (covered by E2E, not unit tests)

---

## CI Pipelines

### `ui-checks.yml` — Pull Request Quality Gate

Runs on every PR targeting `main`. Steps:

1. Install dependencies (`yarn install`)
2. Run ESLint
3. Run Prettier check
4. Run Jest (`yarn test --ci`)
5. Run `yarn build` (type-check + Next.js compilation)

All steps must pass before a PR can be merged.

### `sonarcloud.yml` — Code Quality Analysis

Runs on push and PR events. Steps:

1. Run Jest with LCOV coverage output
2. Upload LCOV report to SonarCloud
3. SonarCloud evaluates the quality gate

| SonarCloud setting | Value                              |
|--------------------|------------------------------------|
| Project key        | `miksrv_arduino-weather-station`   |
| Organisation       | `miksoft`                          |

### `arduino-code-check.yml` — Firmware Compilation

Compiles the Arduino sketch to verify it builds without errors on every push and PR. No upload to hardware occurs in CI.

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
