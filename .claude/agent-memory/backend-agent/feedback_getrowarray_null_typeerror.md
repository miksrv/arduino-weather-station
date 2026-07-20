---
name: feedback_getrowarray_null_typeerror
description: getRowArray() returns null (not []) on no match; feeding that into array_merge() throws TypeError (not Exception) — controllers must catch Throwable, not just Exception
type: feedback
---

`ResultInterface::getRowArray()` (and similar single-row Query Builder fetchers) return `null`, not `[]`, when no row matches — unlike `getResultArray()` which always returns `[]`. Feeding that `null` into `array_merge()` throws a PHP `TypeError`, which does **not** extend `Exception` (it extends `Error`). A controller `catch (Exception $e)` block silently lets it escape as an unhandled 500 with an invalid (non-JSON) body.

Concretely: `RawWeatherDataModel::getRecentAverages()` (used by `getCurrentActualWeatherData()`, backing `GET /current`) used `->get()->getRowArray()` directly. If the Arduino sensor hadn't reported in the last 30 minutes, the query matched zero rows, `getRowArray()` returned `null`, and `array_merge(['date' => ...], null, ...)` threw a TypeError that broke both `/current` and `/current/text` (and, downstream, the frontend home page + `/sensors`, both of which depend on `/current` via RTK Query).

**Why:** Discovered while fixing this exact crash (2026-07-20). Root cause was two-layered: (1) missing `?? []` on the `getRowArray()` result, and (2) `Current::_getWeatherData()` only caught `catch (Exception $e)`, not `catch (Throwable $e)`.

**How to apply:**
- Any time you see `->getRowArray()`, `->getRow()`, or `->first()` results flowing into `array_merge()`, string concatenation, or foreach without a null check, add `?? []` (or an explicit null check) at the call site inside the Model — don't rely on the caller to guard it.
- Controller `_get*Data()`-style private helpers that wrap a Model call in try-catch should catch `\Throwable`, not `\Exception`, specifically because PHP 8 `TypeError`/`Error` from bad-shape data (null args to typed builtins, etc.) are common failure modes here and are NOT `Exception` subclasses.
- `getResultArray()` (used by History/Heatmap) is safe by contrast — it already returns `[]` on no rows, which is why those controllers were unaffected by this bug class.

See also [[feedback_history_controller_bug]] — same PHP 8 TypeError class of bug, different controller (return-type mismatch there vs. null-array-merge here).
