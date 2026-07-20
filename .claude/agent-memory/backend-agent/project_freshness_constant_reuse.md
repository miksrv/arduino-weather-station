---
name: project_freshness_constant_reuse
description: Single source of truth for the "data freshness" threshold is EventFeedBuilder::SYSTEM_FRESHNESS_MINUTES (15 min, public) — reused as-is by Current controller for /current's isStale field, not duplicated
type: project
---

`App\Libraries\EventFeedBuilder::SYSTEM_FRESHNESS_MINUTES` (currently `15`, already `public`) is the one canonical "is this reading stale" threshold in the codebase. It was originally used only by `EventFeedBuilder::_buildSystemStatusEvent()` for the `/events` feed's `system_status` entry (`'ok'` vs `'stale'`, diff in minutes since last raw_weather_data row).

**Why:** When adding `isStale`/`lastUpdated` to the `GET /current` response (2026-07-20, fixing the unhandled-500-on-stale-sensor bug — see [[feedback_getrowarray_null_typeerror]]), the task explicitly required not duplicating this threshold value. Since the constant was already `public`, `App\Controllers\Current` now references `EventFeedBuilder::SYSTEM_FRESHNESS_MINUTES` directly rather than introducing a new constant or config value. There's already precedent for a Controller depending on this Library constant: `App\Controllers\Events` already uses `EventFeedBuilder` for the same purpose.

**How to apply:**
- If any other endpoint needs a "is the latest reading fresh" check, reuse `EventFeedBuilder::SYSTEM_FRESHNESS_MINUTES` — do not hardcode `15` or add a parallel constant/env var.
- The comparison pattern (mirror this, don't reinvent): convert the stored date (which may be a `CodeIgniter\I18n\Time` — note `Time extends DateTimeImmutable`, NOT `DateTime`, so null-safety/type checks must use `instanceof DateTimeInterface`, not `instanceof DateTime`) to a `DateTime` in `app_timezone()` (== `'UTC'` per `Config/App.php`), diff against `new DateTime('now', new DateTimeZone(app_timezone()))` in minutes, compare `> SYSTEM_FRESHNESS_MINUTES`.
- If the frontend agent asks where this threshold lives / how to keep client and server in sync: tell them it's `EventFeedBuilder::SYSTEM_FRESHNESS_MINUTES = 15` (minutes), exposed to the frontend only indirectly via the `isStale` boolean on `/current` (and `/events`' `system_status.status`) — there is no dedicated `/config`-style endpoint exposing the raw number.
