---
name: useLocalStorage must write to localStorage synchronously in setState
description: The setState returned by useLocalStorage must write to localStorage inside the state updater (synchronously), not in a useEffect, to prevent race conditions during Next.js locale navigation.
type: feedback
---

`useLocalStorage`'s exposed `setState` must write to `localStorage` synchronously — inside the state updater function passed to React's `setState` — rather than in a `useEffect` that runs after commit.

**Why:** When `LanguageSwitcher` called `setStorageLocale(locale)` then immediately `router.push(..., { locale })`, the navigation triggered `_app.tsx` to remount before the deferred `useEffect` write had flushed. `_app.tsx`'s `useLocalStorage` initializer read the old locale from localStorage and the `_app.tsx` redirect effect counter-navigated back to the old locale. The URL appeared to not change (it bounced: `/` → `/en/` → `/` in one frame).

**How to apply:** `setStoredState` (the wrapper returned from the hook) must call `setItem(key, next)` inside the `setState` updater closure, so localStorage is updated atomically with the React state update — before any navigation or remount can read a stale value.
