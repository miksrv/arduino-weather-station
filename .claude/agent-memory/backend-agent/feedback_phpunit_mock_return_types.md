---
name: PHPUnit mock callbacks must honour PHP 8 return types
description: willReturnCallback closures must return the correct type when the mocked method has a declared return type
type: feedback
---

When using `willReturnCallback()` on a PHPUnit mock, the closure must return a value that satisfies the mocked method's declared return type. PHP 8 enforces this even in test stubs.

Example: `Model::update()` returns `bool`. A callback that captures arguments but returns nothing produces `TypeError: Return value must be of type bool, null returned`.

Fix — always declare the return type and return an appropriate value:

```php
$stub->method('update')
    ->willReturnCallback(function (int $id, array $data) use (&$captured): bool {
        $captured = ['id' => $id, 'data' => $data];
        return true;
    });
```

**Why:** Seen in `testCloseAnomalyCallsUpdateWithEndDate` — the callback captured args but omitted the bool return, causing a TypeError at runtime.

**How to apply:** Any time a willReturnCallback closure mocks a method with a non-void, non-nullable return type, declare and satisfy that return type in the closure.
