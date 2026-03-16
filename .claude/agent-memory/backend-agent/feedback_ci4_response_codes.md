---
name: CI4 API response codes
description: CodeIgniter 4 ResponseTrait failValidationErrors() returns 400, not 422
type: feedback
---

`$this->failValidationErrors()` in CodeIgniter4's `ResponseTrait` returns HTTP **400** (not 422).

The `$codes['invalid_data']` value is 400:
```php
'invalid_data' => 400,
```

This applies to: `failValidationErrors()`, `fail()`, `failNotFound()` (404), `failUnauthorized()` (401), `failServerError()` (500).

**Why:** Tests were written expecting 422 but CI4 uses 400 for validation errors.
**How to apply:** When writing tests asserting on CI4 API validation responses, use 400 not 422.
