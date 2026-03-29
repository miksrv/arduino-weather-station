---
name: useLocalStorage default value pitfall
description: Never pass a default value to useLocalStorage for keys that drive navigation/locale, because the hook writes the default to storage on mount even when the key already has a value in a different call site.
type: feedback
---

Do not pass a non-undefined initialState to `useLocalStorage` for keys shared across multiple component instances (like `StorageKeys.LOCALE`). The hook has a `useEffect` that writes `state` back to storage on every state change. If two call sites use the same key with different defaults, whichever mounts last wins and can overwrite a valid stored value.

**Why:** The `LanguageSwitcher` used `useLocalStorage(StorageKeys.LOCALE, 'en')` with `'en'` as default. On a fresh session this wrote `'en'` to storage immediately. `_app.tsx` then read that stored `'en'` and redirected the page to `locale: en`, overriding the site's default `'ru'` and any user-chosen locale.

**How to apply:** Always call `useLocalStorage(key)` with no initialState when the component only needs to *write* to storage, not read from it with a meaningful fallback. Only provide a default when the component genuinely needs a fallback value and is the sole owner of that key.
