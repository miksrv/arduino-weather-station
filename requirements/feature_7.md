# Feature 7: Push Notifications About New Anomalies

## Overview

Visitors can subscribe in their browser to **web push notifications about new weather anomalies** (heat wave, cold
snap, strong wind, freezing rain, fog, drought, flood-risk level change, …). The notifications are sent by the same
daily cron run that detects the anomalies (`system:detectAnomalies`), and **only when a new anomaly appears** — never
for an anomaly that continues, re-opens or is replayed.

On the site, a small floating card offers the subscription once per browser. A visitor who declines does not see it
again for 30 days.

Planned for a separate minor release.

---

## Motivation

- Anomalies are the most time-sensitive thing the site knows about, but today a visitor only learns about them by
  opening `/anomaly`.
- The detection already runs once a day after midnight UTC (06:30 at the station), a good time for a daily alert;
  no new data or schedule is needed.
- A service worker is already in place (`client/public/sw.js`, registered in production by
  `client/hooks/useServiceWorker.ts`), so the browser side needs push handlers, not a new worker.

---

## Behaviour

### When a notification is sent

- `system:detectAnomalies` evaluates the last complete UTC days through `AnomalyLogModel::applyDayState()`. A result
  with `action === 'opened'` is a **new episode**: only these are announced.
- Not announced: `reopened` / `updated` / `closed` episodes, anything written by `system:backfillAnomalyLog`, and
  episodes that started before the detection window (the 3-day lookback must not announce old news after a missed
  run longer than that).
- Idempotent: an episode is announced at most once, even if the command runs again for the same days. The log row
  records it (`notified_at`, see below).
- Several new anomalies on the same run go out as **one** notification per subscriber ("2 new anomalies: Strong wind,
  Freezing rain"), not one per anomaly.
- Notification text is in the subscriber's language (`ru` / `en`, stored with the subscription); clicking it opens
  `/anomaly` (in that language).

### The subscription card

- A small floating card in a bottom corner of every page (not a modal, not over the content's main action), with a
  one-line explanation, **"Подписаться"** and **"Не сейчас"** (and a close ×, same as "Не сейчас").
- Shown only when all are true:
  - the browser supports push (`serviceWorker`, `PushManager`, `Notification` in `window`); on iOS only when the site
    runs as an installed web app (iOS supports web push only there);
  - `Notification.permission === 'default'` (never asked) and the browser has no active subscription;
  - the card was not dismissed within the snooze period;
  - not on the first seconds of the very first visit: after about 20 s on a page or on the second page view, so it
    never competes with the first paint.
- The browser's permission dialog is opened **only** from the "Подписаться" click (a user gesture). The site never
  calls `Notification.requestPermission()` on its own: browsers penalise unprompted permission requests (Chrome moves
  such sites to the quiet permission UI).
- **Snooze after "Не сейчас": 30 days**, stored per browser in `localStorage` (via `useLocalStorage`, key in
  `StorageKeys`, e.g. `pushPromptSnoozedUntil`). A second "Не сейчас" snoozes for 90 days, so a visitor who declined
  twice is not asked monthly. Rationale: 30 days is long enough not to nag a regular visitor, short enough that someone
  who said "not now" in summer is asked again before the winter anomalies (cold snaps, freezing rain, spring flood).
- If the visitor blocks notifications in the browser dialog (`permission === 'denied'`), the card is never shown
  again: the site cannot ask again, only the browser settings can change it.
- After subscribing, the card shows a short confirmation and disappears.
- Unsubscribing: a "Уведомления об аномалиях" switch on `/anomaly` (on / off for this browser), which also covers
  someone who wants to subscribe after snoozing the card.

---

## Backend Requirements

### Dependencies and configuration

- Web Push with VAPID: `minishlink/web-push` (needs the PHP `openssl` and `curl` extensions, plus `gmp` or `bcmath` —
  check what the shared PHP hosting provides before choosing the library).
- New `.env` keys (`server/env` template, documented in CLAUDE.md):
  - `app.push.vapidPublicKey`, `app.push.vapidPrivateKey` (generated once, e.g. `vendor/bin/web-push generate:vapid`
    or a small `spark` command);
  - `app.push.subject = 'mailto:astro@miksoft.pro'`.
  Empty keys disable the feature (no subscribe endpoint, nothing sent), like `app.metar.station`.

### Database (new migration)

- Table `push_subscriptions`: `id`, `endpoint` (unique; up to ~500 chars), `p256dh`, `auth`, `locale` (`ru` / `en`),
  `created_at`, `last_sent_at` (nullable), `failures` (int, default 0).
- Column `anomaly_log.notified_at` (nullable datetime): set when the episode was announced. `backfillAnomalyLog`
  sets it on every replayed row (`now`), so a rebuild of the log never announces history. The migration fills it for
  all existing rows.

### API

| Method | Path | Purpose |
|---|---|---|
| GET | `/push/key` | the VAPID public key (the client takes it from here, so it is configured once, on the server) |
| POST | `/push/subscribe` | body: the browser's `PushSubscription` JSON + `locale`; upsert by `endpoint` |
| POST | `/push/unsubscribe` | body: `endpoint`; delete the row |

- Validation: `endpoint` must be an `https` URL of a known push service; keys base64url of the right length.
- Throttled like `/sensors` (per IP), `Cache-Control: no-store`, CORS for the site's origin.
- Controller `Push` extends `ResourceController`; data access through a `PushSubscriptionModel`.

### Sending (`system:detectAnomalies`)

- After the days are applied: collect the episodes opened in this run with `notified_at IS NULL` and a `start_date`
  inside the evaluated window; if there are none, stop.
- Build one payload per locale (`title`, `body`, `url`, `tag` = the run date so a repeat replaces instead of stacking),
  send to every subscription in that locale with a TTL of about 24 h, then set `notified_at` on those episodes.
- A `404` / `410` from the push service means the subscription is gone: delete it. Other errors increment `failures`;
  delete a subscription after ~5 consecutive failures.
- A failure to send must not fail the detection: log it (`log_message('error', …)`) and keep `notified_at` empty, so
  the next run retries within the window.
- A `--no-push` option for manual runs.

### PHPUnit tests

- Subscribe / unsubscribe: validation, upsert, delete, disabled when keys are empty.
- Sending: only `opened` episodes inside the window; one notification per subscriber for several anomalies; idempotent
  on a second run (`notified_at`); backfill never sends; `410` deletes the subscription; a send failure leaves
  `notified_at` empty. The push library is mocked.

---

## Frontend Requirements

### Service worker (`client/public/sw.js`)

- `push`: show the notification (`title`, `body`, `icon`/`badge` from `/icons/`, `tag`, `data.url`).
- `notificationclick`: focus an open tab of the site and navigate it to `data.url`, or open a new one.
- `pushsubscriptionchange`: re-subscribe with the same key and send the new subscription to `/push/subscribe`.
- Bump `VERSION` in `sw.js`.

### Components and hooks

- `components/push-prompt/` (shown on every page from `AppLayout`): the floating card. Card surface and `StatusBadge`
  / kit `Button`s per `client/DESIGN.md`; fixed position above the content with the safe-area insets; must not cover
  the app bar or the bottom of the drawer on phones.
- `hooks/usePushSubscription.ts`: support check, current permission and subscription, `subscribe()` (key from
  `GET /push/key` → `PushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` → `POST /push/subscribe`
  with the current locale), `unsubscribe()`. Client-only (`useClientOnly`), so nothing renders on the server and there
  is no hydration mismatch.
- `hooks/usePushPrompt.ts`: the visibility rules and the snooze (30 / 90 days) in `localStorage`.
- The switch on `/anomaly` uses `usePushSubscription`.
- API calls through RTK Query (`getPushKey`, `pushSubscribe`, `pushUnsubscribe` in `client/api/api.ts`, types in
  `client/api/types/push.ts`).
- When the visitor changes the language, update the stored subscription's `locale` (`POST /push/subscribe` again).

### Jest tests

- `usePushPrompt`: shown / hidden by permission, support, subscription, snooze; 30 then 90 days; `denied` never.
- `usePushSubscription`: subscribe and unsubscribe flows with mocked `PushManager` and API.
- The card: buttons call the right handlers; nothing is rendered without push support.

---

## i18n Requirements

New keys in `public/locales/{ru,en}/common.json`, e.g.:

| Key | ru | en |
|---|---|---|
| `push-prompt-title` | Уведомления об аномалиях | Anomaly alerts |
| `push-prompt-text` | Сообщим, когда начнётся необычная погода: жара, похолодание, сильный ветер, ледяной дождь | We'll let you know when unusual weather starts: heat, cold snaps, strong wind, freezing rain |
| `push-prompt-subscribe` | Подписаться | Subscribe |
| `push-prompt-later` | Не сейчас | Not now |
| `push-prompt-done` | Готово, вы подписаны | Done, you're subscribed |
| `push-switch-label` | Уведомления об аномалиях в этом браузере | Anomaly alerts in this browser |
| `push-notification-one` / `push-notification-many` | Новая аномалия: {{name}} / Новые аномалии ({{count}}): {{names}} | New anomaly: {{name}} / New anomalies ({{count}}): {{names}} |

The notification text itself is built on the server (the subscriber may be offline when it is sent), so the
anomaly names and the two notification strings need a server-side translation table in both languages.

---

## Acceptance Criteria

- [ ] A visitor in a supporting browser sees the card once (not on the first seconds of the first visit), subscribes
      with one click plus the browser dialog, and the card does not appear again in that browser.
- [ ] "Не сейчас" hides the card for 30 days, a second time for 90 days; a blocked permission hides it for good.
- [ ] The day a new anomaly is detected, every subscriber gets one notification in their language; clicking it opens
      `/anomaly`.
- [ ] Re-running `system:detectAnomalies` for the same days and `system:backfillAnomalyLog --force` send nothing.
- [ ] Unsubscribing on `/anomaly` stops the notifications; expired subscriptions are removed automatically.
- [ ] With empty VAPID keys the feature is off and nothing else changes.
- [ ] PHPUnit and Jest tests above pass; CLAUDE.md (routes, tables, env keys, commands) and `client/DESIGN.md`
      (the card) are updated.
