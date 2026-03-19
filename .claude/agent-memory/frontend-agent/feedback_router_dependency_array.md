---
name: Avoid whole router object in useEffect dependency array
description: Putting the whole `router` object in a useEffect dep array causes the effect to re-run on every render, since router is a new reference each render.
type: feedback
---

Never put the whole `router` object from `useRouter()` into a `useEffect` dependency array. Use specific stable values instead: `router.pathname`, `router.asPath`, `router.query`, etc.

**Why:** The `router` object returned by `useRouter()` is a new reference on every render. Including it in `[storageLocale, i18n.language, router]` caused the locale-redirect effect in `_app.tsx` to fire on every navigation, potentially creating redirect loops.

**How to apply:** Extract only the specific router properties you actually use inside the effect and list those in the dependency array.
