---
name: Throttle filter testing with CI4 MockCache
description: How to properly reset the rate-limit state between PHPUnit test methods when ThrottleFilter is active
type: feedback
---

CI4's `CIUnitTestCase` injects a fresh `MockCache` (in-memory) on every `setUp()` via `mockCache()`. However, `Services::throttler()` is a shared service that holds a reference to the OLD cache instance — so injecting a new MockCache does NOT reset the throttle bucket for the shared throttler.

To reset the rate-limit state between test methods, call:

```php
Services::injectMock('throttler', new Throttler(Services::cache()));
```

in `setUp()`. This creates a new Throttler that uses the newly-injected MockCache, starting with an empty token bucket.

**Why:** The MockCache `$cache` array is per-instance. The throttler holds a hard reference to whichever cache instance it was constructed with. Deleting cache keys via `cache()->delete()` deletes from the NEW MockCache, not from the throttler's OLD cache.

**How to apply:** Any test class that exercises an endpoint protected by ThrottleFilter must inject a fresh throttler in setUp, or tests will see 429 responses on the second and subsequent test methods.
