---
name: History controller _getData() return type bug
description: History::_getData() has a PHP return type mismatch that causes TypeError in PHP 8.3
type: feedback
---

`History::_getData()` is declared as returning `?array` but internally calls `$this->fail()` and `$this->failValidationErrors()` which return a `Response` object. In PHP 8.3 strict return-type checking, this causes a `TypeError` when validation fails.

Both `ControllerTestTrait::execute()` and `FeatureTestTrait` rethrow Throwable with code 0 (TypeError's default code), so the error surfaces in tests.

Tests for the validation-failure path must use `$this->expectException(\TypeError::class)` to document this existing bug.

**Why:** Discovered while writing PHPUnit tests for the History controller.
**How to apply:** When fixing or testing History controller validation, be aware of this return type inconsistency. The fix would be to change the return type to `mixed` or fix the method to not return Response objects from a `?array` method.
