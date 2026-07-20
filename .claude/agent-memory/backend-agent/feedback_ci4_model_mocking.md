---
name: CI4 Model Mocking Pattern
description: How to correctly mock CodeIgniter 4 Model subclasses in PHPUnit when fluent query builder methods are involved
type: feedback
---

CI4 Model subclasses expose query builder methods (select, where, whereIn, orderBy, limit) via `__call` magic — they are NOT directly declared on the class. This means `onlyMethods(['select', 'where', ...])` will throw `CannotUseOnlyMethodsException` and `method('get')` will throw `MethodCannotBeConfiguredException`.

**Correct pattern:**

```php
$stub = $this->getMockBuilder(DailyAveragesModel::class)
    ->disableOriginalConstructor()
    ->getMock();

// __call handles fluent chain — return $stub to allow chaining
$stub->method('__call')->willReturnCallback(fn() => $stub);

// findAll and first ARE real public methods on BaseModel — safe to stub
$stub->method('findAll')->willReturn($rows);
$stub->method('first')->willReturn($rows[0] ?? null);
```

**Why:** `findAll()` and `first()` are declared in `BaseModel`. `select()`, `where()`, `get()`, etc. are query builder methods delegated through `__call`.

**Consequence for library design:** Avoid using `->get()->getResultArray()` inside injectable library methods — prefer `->findAll()` so the entire chain terminates at a mockable public method. Refactor `->select('SUM(...) as alias')->get()->getResultArray()` to `->select('column')->findAll()` with PHP-side aggregation.

**How to apply:** Any time writing PHPUnit tests for code that uses DailyAveragesModel or HourlyAveragesModel with fluent chains.

**Critical distinction — testing a model's OWN method vs. mocking it as a dependency:**

The pattern above (`getMockBuilder(...)->getMock()` with NO `onlyMethods()`) is only correct when the model is a *dependency* being injected into something else you're testing (e.g. a controller). It mocks ALL public methods, including inherited ones — which is fine because you never call the model's own real methods, only `__call`/`findAll`/`first`.

But when you are testing one of the model's OWN methods that internally uses the fluent chain (e.g. `RawWeatherDataModel::getRowsSince()` which does `$this->where(...)->orderBy(...)->findAll()`), `getMock()` with no `onlyMethods()` will ALSO mock `getRowsSince()` itself — silently replacing its real body with a stub that returns a default empty value (`[]`/`null`), so it never actually executes and never calls `where`/`orderBy`/`findAll` at all. The test then passes/fails for the wrong reason (asserting against the mock's default return, not the real logic).

**Correct pattern for this case:** explicitly scope `onlyMethods(['__call', 'findAll'])` (or `['__call', 'first']`) so only those two are doubled, leaving the method under test (`getRowsSince`, `getAnomaliesTouchingWindow`, etc.) with its real implementation:

```php
$stub = $this->getMockBuilder(RawWeatherDataModel::class)
    ->disableOriginalConstructor()
    ->onlyMethods(['__call', 'findAll'])
    ->getMock();

$stub->method('__call')->willReturnCallback(fn() => $stub);
$stub->expects($this->once())->method('findAll')->willReturn($expected);

$result = $stub->getRowsSince(new DateTime('...')); // runs REAL getRowsSince() body
```

Note some existing tests (e.g. `AnomalyLogModelTest::testGetAnomaliesActiveOnDateCallsFindAll`) use `onlyMethods(['findAll'])` alone (no `__call` override) and this also works — because building a query (`where`/`groupStart`/`orderBy`) without executing it doesn't require a live DB connection, so the real inherited `__call` runs harmlessly. Either form is fine as long as the method under test is excluded from the mocked set. Verified by reproducing the failure with a throwaway debug test (`var_dump` inside `__call`/`findAll` never fired until `onlyMethods` was scoped correctly).
