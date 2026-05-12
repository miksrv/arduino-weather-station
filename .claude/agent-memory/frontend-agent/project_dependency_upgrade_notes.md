---
name: Dependency upgrade notes and constraints
description: Known breaking changes and constraints from the 2026-05 dependency upgrade (next-i18next v16, next-seo v7, TS 6, ESLint 9/10)
type: project
---

## next-i18next v16 (Pages Router)

`next-i18next` v16 removed `useTranslation`, `appWithTranslation` from the default entry point.
All Pages Router consumers must import from subpaths:
- Hooks / HOC: `from 'next-i18next/pages'`
- Server helpers: `from 'next-i18next/pages/serverSideTranslations'`

Test mocks must mirror the subpath:
```ts
jest.mock('next-i18next/pages', () => ({ useTranslation: () => ({ t: (k) => `t:${k}` }) }))
```

## next-seo v7 (Pages Router)

`next-seo` v7 dropped `NextSeo` and `DefaultSeo` React components.
Use function-based API from `next-seo/pages` inside `<Head>`:
```tsx
import Head from 'next/head'
import { generateNextSeo, generateDefaultSeo } from 'next-seo/pages'
// per-page:
<Head>{generateNextSeo({ title, description, canonical, openGraph, twitter })}</Head>
// in _app.tsx:
<Head>{generateDefaultSeo({ openGraph: { siteName: '...' }, twitter: { cardType: '...' } })}</Head>
```
Props shape is the same as the old `NextSeoProps`/`DefaultSeoProps` interfaces.

## TypeScript 6 breaking changes

TS 6 introduced two new errors relevant to this project:
1. `TS5011`: Requires explicit `rootDir` when `noEmit: true` and test patterns spread across directories.
   → Fixed by adding `"rootDir": "."` to `tsconfig.jest.json`.
2. `TS5107`: `moduleResolution=node10` deprecated (ts-jest internally sets this).
   → Suppressed with `"ignoreDeprecations": "6.0"` in `tsconfig.jest.json`.

## ESLint version constraint

ESLint is pinned to **v9** (currently `^9.39.4`). **Do NOT upgrade to ESLint v10** because:
- `eslint-plugin-react` v7.37.5 only supports ESLint `^9.7` (its peer dep cap is `^9.7`, not `^10`)
- ESLint v10 removed `eslint/use-at-your-own-risk` exports that `@typescript-eslint/utils` still relied on

A Yarn `resolution` forces `eslint-plugin-jest` to use the newer `@typescript-eslint/utils` (^8.59.3) to fix compatibility with ESLint 9:
```json
"resolutions": {
    "eslint-plugin-jest/@typescript-eslint/utils": "^8.59.3"
}
```

## simple-react-ui-kit 1.8.x

Upgraded from v1.7.x. No code changes were needed — the API is backward compatible.

## schema-dts v2

Upgraded from v1. Used only in `_document.tsx` for JSON-LD type hints. No code changes needed.
