---
name: CI4 controller testing patterns
description: How to correctly test CodeIgniter 4 controllers without a real DB — ControllerTestTrait vs FeatureTestTrait
type: feedback
---

Use `ControllerTestTrait` (not raw `new Controller()`) when calling controller methods directly in tests. Calling `$controller->someMethod()` without `initController()` results in "Call to member function on null" because `$this->response` is null.

Correct pattern:
```php
use CodeIgniter\Test\ControllerTestTrait;
$this->setUpControllerTestTrait();
$this->controller(MyController::class);
$this->setPrivateProperty($this->controller, 'myModel', $mockModel);
$result = $this->execute('myMethod');
$result->response()->getStatusCode();
```

When combining `ControllerTestTrait` and `FeatureTestTrait` in one class, resolve the `withBody` method collision:
```php
use ControllerTestTrait, FeatureTestTrait {
    ControllerTestTrait::withBody insteadof FeatureTestTrait;
    FeatureTestTrait::withBody as featureWithBody;
}
```

`ControllerTestTrait::execute()` and `FeatureTestTrait` both rethrow Throwable with `code < 100` (e.g. TypeError has code 0). Wrap those tests with `$this->expectException(\TypeError::class)`.

**Why:** Learned through failing tests when writing the PHPUnit test suite.
**How to apply:** Always use ControllerTestTrait pattern for direct controller method testing. Use FeatureTestTrait only for route-level integration smoke tests.
