# Backend Roadmap — Arduino Weather Station Server

Generated: 2026-03-22
Scope: `/server` directory (PHP 8.2+, CodeIgniter 4.6, MySQL)

---

## Legend

| Priority     | Meaning                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| **Critical** | Active exploit risk; requires immediate remediation                     |
| **High**     | Significant security weakness; address in the next sprint               |
| **Medium**   | Defence-in-depth gap; address in regular sprints                        |
| **Low**      | Hardening improvement or low-probability risk; backlog                  |

---

## 1. Security

> All items below were identified during a security audit on 2026-03-22.

### SEC-03 · Wildcard CORS — `Access-Control-Allow-Origin: *` on all endpoints [HIGH]

**File:** `server/app/Filters/CorsFilter.php`, line 24

```php
header("Access-Control-Allow-Origin: *");
```

The CORS filter is registered as a global `before` filter and allows any origin to issue cross-origin requests with any HTTP method (`GET, POST, OPTIONS, PATCH, PUT, DELETE`). Any malicious web page visited by a user can silently call `POST /sensors` or `GET /history/export` using the user's browser. It also nullifies any future cookie-based or token-based access control at the browser layer.

Restrict `Access-Control-Allow-Origin` to the known frontend origin(s) (e.g., `https://meteo.miksoft.pro`). Use an allowlist for multiple origins if needed.

---

### SEC-05 · Arduino authentication token transmitted as a URL query string parameter [HIGH]

**File:** `server/app/Controllers/Sensors.php`, line 39

```php
$token = $this->request->getGet('token', FILTER_SANITIZE_SPECIAL_CHARS);
```

The token is passed as `?token=TOKEN` in the URL. Query strings are written to web server access logs, reverse-proxy logs, CDN logs, and browser history. Any party with access to any of these log sources can silently extract the token without any indication of compromise.

Move the token to an HTTP header (e.g., `Authorization: Bearer <token>`) and update the Arduino firmware to send it as a request header instead of a query parameter.

---

### SEC-13 · HTTPS not enforced at the application level [MEDIUM]

**File:** `server/app/Config/App.php`, line 136

```php
public bool $forceGlobalSecureRequests = false;
```

The application does not enforce HTTPS internally. If a reverse proxy misconfiguration causes HTTP requests to reach the application, the Arduino token (SEC-05) and sensor payloads are transmitted in cleartext. Enforcement should be layered: both at the reverse proxy and at the application level.

Set `$forceGlobalSecureRequests = true` in production.

---

### SEC-15 · Unused `firebase/php-jwt` production dependency [MEDIUM]

**File:** `server/composer.json`, line 9

```json
"firebase/php-jwt": "^6.10"
```

The JWT library is listed as a production dependency but is not imported or used anywhere in the codebase. Unused dependencies add attack surface (CVEs in unused libraries still affect the project) and create a misleading impression that JWT authentication is implemented.

Remove the dependency with `composer remove firebase/php-jwt`. If JWT authentication is planned, document it as a future task rather than pre-installing the library.

---

### SEC-18 · Physical station GPS coordinates committed to a public repository [LOW]

**File:** `server/.env.production`

```
app.lat = 51.70952
app.lon = 55.26690
```

The exact GPS coordinates of the physical hardware are committed to the public repository. While publicly exposing a weather station's location may be intentional, it should be a documented decision, not an accidental disclosure via a committed secrets file. Remove from `.env.production` (see SEC-01) and store in the runtime environment instead.

---

### SEC-19 · `CorsFilter` uses `die()` for OPTIONS preflight, bypassing the response pipeline [LOW]

**File:** `server/app/Filters/CorsFilter.php`, lines 28–31

```php
if ($method === "OPTIONS") {
    die();
}
```

Using `die()` exits PHP immediately, bypassing all CodeIgniter `after` filters. Any future after-filters (security headers, audit logging) will never execute for OPTIONS preflight requests. Additionally, `$_SERVER['REQUEST_METHOD']` is accessed directly instead of `$request->getMethod()`, bypassing framework abstraction.

Replace with a proper `$response->setStatusCode(204)->send(); exit;` pattern, or return a response object from the filter method and let the framework terminate the request cleanly.

---

### SEC-20 · No sensitive data redaction in debug traces [LOW]

**File:** `server/app/Config/Exceptions.php`, line 52

No keys are registered for redaction in debug stack traces. If an API key, database password, or Arduino token is passed as a function argument and an exception is thrown during that call, the value appears in the trace output. Register all sensitive key names (e.g., `password`, `token`, `api_key`, `key`, `mac`) in `$sensitiveDataInTrace`.

---

### SEC-21 · Log files use `.log` extension without a PHP guard [LOW]

**File:** `server/app/Config/Logger.php`, line 104

```php
'fileExtension' => '',
```

The `fileExtension` defaults to `.log`. The CodeIgniter documentation notes that using a `.php` extension allows protecting log files via a PHP guard when stored under a publicly accessible directory. If `writable/logs/` were ever accidentally served by the web server, `.log` files would be delivered as plain text, potentially exposing application internals. Keep `writable/logs/` outside the web root and consider setting `'fileExtension' => 'php'` as an additional safeguard.

---

## 2. Summary by Severity

### High

| ID     | Summary                                                    | File |
| ------ | ---------------------------------------------------------- | ---- |
| SEC-03 | Wildcard CORS `*` allows any origin to call all endpoints  | `Filters/CorsFilter.php:24` |
| SEC-05 | Arduino token sent as a URL query parameter (logged)       | `Controllers/Sensors.php:39` |

### Medium

| ID     | Summary                                                    | File |
| ------ | ---------------------------------------------------------- | ---- |
| SEC-13 | HTTPS not enforced at application level                    | `Config/App.php:136` |
| SEC-15 | Unused `firebase/php-jwt` production dependency            | `composer.json:9` |

### Low

| ID     | Summary                                                    | File |
| ------ | ---------------------------------------------------------- | ---- |
| SEC-18 | Physical GPS coordinates in a public repository            | `server/.env.production` |
| SEC-19 | `die()` in CorsFilter bypasses the response pipeline       | `Filters/CorsFilter.php:30` |
| SEC-20 | No sensitive data redaction in debug stack traces          | `Config/Exceptions.php:52` |
| SEC-21 | Log files use `.log` extension without PHP guard           | `Config/Logger.php:104` |
