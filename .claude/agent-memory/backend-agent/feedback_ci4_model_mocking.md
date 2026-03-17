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
