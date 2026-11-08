# Backend Roadmap — Arduino Weather Station Server

Generated: 2026-03-22
Scope: `/server` directory (PHP 8.2+, CodeIgniter 4.7, MySQL)

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

The CORS filter is registered as a global `before` filter and allows any origin to issue cross-origin requests with `GET, POST, OPTIONS`. Any malicious web page visited by a user can silently call `POST /sensors` or `GET /history/export` using the user's browser. It also nullifies any future cookie-based or token-based access control at the browser layer.

Restrict `Access-Control-Allow-Origin` to the known frontend origin(s) (e.g., `https://meteo.miksoft.pro`). Use an allowlist for multiple origins if needed.

---

### SEC-05 · Arduino authentication token transmitted as a URL query string parameter [HIGH]

**File:** `server/app/Controllers/Sensors.php`, line 61

```php
$token       = $this->request->getGet('token');
```

The token is passed as `?token=TOKEN` in the URL. Query strings are written to web server access logs, reverse-proxy logs, CDN logs, and browser history. Any party with access to any of these log sources can silently extract the token without any indication of compromise.

Move the token to an HTTP header (e.g., `Authorization: Bearer <token>`) and update the Arduino firmware to send it as a request header instead of a query parameter.

---

### SEC-13 · HTTPS not enforced at the application level [MEDIUM]

**File:** `server/app/Config/App.php`, line 160

```php
public bool $forceGlobalSecureRequests = false;
```

The application does not enforce HTTPS internally. If a reverse proxy misconfiguration causes HTTP requests to reach the application, the Arduino token (SEC-05) and sensor payloads are transmitted in cleartext. Enforcement should be layered: both at the reverse proxy and at the application level.

Set `$forceGlobalSecureRequests = true` in production.

---

### SEC-19 · `CorsFilter` uses `die()` for OPTIONS preflight, bypassing the response pipeline [LOW]

**File:** `server/app/Filters/CorsFilter.php`, lines 29–33

```php
if ($method === "OPTIONS") {
    die();
}
```

Using `die()` exits PHP immediately, bypassing all CodeIgniter `after` filters. Any future after-filters (security headers, audit logging) will never execute for OPTIONS preflight requests. Additionally, `$_SERVER['REQUEST_METHOD']` is accessed directly instead of `$request->getMethod()`, bypassing framework abstraction.

Replace with a proper `$response->setStatusCode(204)->send(); exit;` pattern, or return a response object from the filter method and let the framework terminate the request cleanly.

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
| SEC-05 | Arduino token sent as a URL query parameter (logged)       | `Controllers/Sensors.php:61` |

### Medium

| ID     | Summary                                                    | File |
| ------ | ---------------------------------------------------------- | ---- |
| SEC-13 | HTTPS not enforced at application level                    | `Config/App.php:160` |

### Low

| ID     | Summary                                                    | File |
| ------ | ---------------------------------------------------------- | ---- |
| SEC-19 | `die()` in CorsFilter bypasses the response pipeline       | `Filters/CorsFilter.php:32` |
| SEC-21 | Log files use `.log` extension without PHP guard           | `Config/Logger.php:104` |
