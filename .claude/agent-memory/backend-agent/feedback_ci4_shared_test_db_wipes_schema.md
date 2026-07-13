---
name: PHPUnit run wipes the shared dev database schema
description: Running vendor/bin/phpunit drops and rebuilds all App-namespace tables in the local dev DB because database.tests points at the same physical MariaDB instance as database.development
type: feedback
---

`server/.env` configures `database.tests.*` to point at the exact same docker-compose MariaDB container/database as `database.development.*` (127.0.0.1:3309, db `db`, same user). The `.env` file even has a comment claiming this is safe because "each test runs inside a transaction that's rolled back afterwards."

**That comment is misleading for schema state.** CI4's test bootstrap (CIUnitTestCase / DatabaseTestTrait) does a full migration refresh when the test environment initializes — it rolled back (`down()`) every `App` namespace migration and only left the `Tests\Support\Database\Migrations\ExampleMigration` applied. After running the full suite, `SHOW TABLES` showed only `factories` and `migrations` — `raw_weather_data`, `hourly_averages`, `daily_averages`, `forecast_weather_data`, and `anomaly_log` were all gone.

**Why:** Discovered 2026-07-12 while end-to-end verifying the OpenMeteo provider feature — I had manually confirmed rows in `raw_weather_data` via `php spark db:table`, then ran `vendor/bin/phpunit`, then went back to query the table and found the whole schema wiped.

**How to apply:**
- Always run `vendor/bin/phpunit` BEFORE doing final manual DB verification (`php spark system:getCurrentWeather` + inspecting rows), never after — otherwise you'll be verifying against an empty/reset schema.
- If you need both a passing test suite AND live DB proof in the same session, do: `php spark migrate` → `vendor/bin/phpunit` → `php spark migrate` (again, to restore the App schema) → run the CLI command → inspect rows.
- Don't be alarmed by "table doesn't exist" errors from spark commands after running phpunit — it's not a code bug, just re-run `php spark migrate` (or `migrate --all`) to restore the App namespace tables.
