import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import jestPlugin from 'eslint-plugin-jest'
import reactPlugin from 'eslint-plugin-react'
import nextPlugin from '@next/eslint-plugin-next'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default defineConfig([
    // register all the plugins up-front
    {
        // note - intentionally uses computed syntax to make it easy to sort the keys
        plugins: {
            ['@typescript-eslint']: tseslint.plugin,
            ['react']: reactPlugin,
            ['react-hooks']: reactHooksPlugin,
            ['import']: importPlugin,
            ['jest']: jestPlugin,
            ['prettier']: prettierPlugin,
            ['simple-import-sort']: simpleImportSortPlugin,
            ['next']: nextPlugin,
            // ['jsx-a11y']: jsxA11yPlugin,
            // ['unicorn']: unicornPlugin,
        },
        extends: [prettierConfig],
    },

    // register all the configs up-front
    {
        ignores: [
            '**/.yarn/**',
            '**/eslint.config.mjs',
            '**/declarations.d.ts',
            '**/node_modules/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',

            // WebPack
            // '**/webpack.config.js',

            // RollUp
            '**/rollup.config.js',

            // PM2 Server
            '**/ecosystem.config.js',

            // NextJS
            '**/next-i18next.config.js',
            '**/next.config.js',
            '**/.next/**',
            '**/next-env.d.ts',
            '**/middleware.ts',

            // Storybook
            '**/.storybook/main.js',
            '**/.storybook/preview.js',
            '**/storybook-static/',

            // Jest
            '**/jest.config.ts',
            '**/jest.setup.ts',
        ],
    },

    // extends ...
    tseslint.configs.recommended,

    {
        languageOptions: {
            parserOptions: {
                allowAutomaticSingleRunInference: true,
                warnOnUnsupportedTypeScriptVersion: false,
                project: ['tsconfig.json'],
            },
        },

        settings: {
            react: {
                version: 'detect',
            },
        },

        rules: {
            //
            // eslint-base
            //
            // ✅ Requires curly braces for all control statements
            curly: ['error', 'all'],
            // ✅ Disallow semicolons
            semi: ['error', 'never'],
            // ✅ Require === and !== except when comparing to null
            eqeqeq: ['error', 'always', { null: 'never' }],
            // ✅ Error when the same module is imported multiple times
            'no-duplicate-imports': 'error',
            // ✅ Enforce using logical assignment operators (&&=, ||=, ??=)
            'logical-assignment-operators': 'error',
            // ✅ Disallow return in else after if with return
            'no-else-return': 'error',
            // ✅ Disallow console except console.warn and console.error
            'no-console': ['error', { allow: ['warn', 'error'] }],
            // ✅ Disallow process.exit()
            'no-process-exit': 'error',
            // ✅ Disallow fallthrough in switch/case unless marked with a comment
            'no-fallthrough': [
                'error',
                { commentPattern: '.*intentional fallthrough.*' },
            ],
            // ✅ Warn if double quotes are used instead of single quotes
            quotes: ['warn', 'single'],
            // ❌ Warn if trailing commas are used (Prettier Config)
            // -> 'comma-dangle': ['warn', 'never'],
            // ❌ Prefer single quotes in JSX (Prettier Config)
            // -> 'jsx-quotes': ['warn', 'prefer-single'],
            // ✅ Disallow declaring multiple variables in one statement
            'one-var': ['error', 'never'],
            // ✅ Warn if lines exceed 120 characters, ignoring strings, templates, and comments
            'max-len': [
                'warn',
                {
                    code: 120,
                    ignoreUrls: true,
                    ignoreTemplateLiterals: true,
                    ignoreStrings: true,
                    ignoreComments: true,
                },
            ],
            // ✅ Enforce consistent indentation (2 spaces)
            'object-curly-spacing': ['error', 'always'],
            // ❌ Enforce consistent spacing inside braces
            'object-curly-newline': [
                'off',
                // {
                //     ObjectExpression: {
                //         multiline: true,
                //         minProperties: 6, // Wrap to new lines if there are more than 5 properties
                //     },
                //     ImportDeclaration: {
                //         multiline: true,
                //         minProperties: 6, // Wrap to new lines if there are more than 5 imports
                //     },
                // },
            ],
            // ✅ Enforce consistent line breaks inside braces
            'padding-line-between-statements': [
                'error',
                // Add an empty line after the last import
                { blankLine: 'always', prev: 'import', next: '*' },
                // Allow multiple consecutive imports without empty lines
                { blankLine: 'any', prev: 'import', next: 'import' },
            ],

            //
            // eslint-plugin-prettier
            //
            'prettier/prettier': 'error',

            //
            // typescript-eslint
            //
            // ❌ Not require explicit return types on functions and class methods
            '@typescript-eslint/explicit-function-return-type': ['off'],
            // ❌ Typescript unnecessary conditions
            '@typescript-eslint/no-unnecessary-condition': 'off',
            // ✅ Disallow usage of any type
            '@typescript-eslint/no-explicit-any': 'warn',
            // ✅ Disallow constant conditions (e.g., while(true) or if(1))
            'no-constant-condition': 'error',
            // ✅ Disallow require() in TypeScript files
            '@typescript-eslint/no-var-requires': 'warn',
            // ✅ Prefer literal enum members, allow bitwise expressions
            '@typescript-eslint/prefer-literal-enum-member': [
                'error',
                { allowBitwiseExpressions: true },
            ],
            // ✅ Prefer startsWith/endsWith over indexOf or substr comparisons
            '@typescript-eslint/prefer-string-starts-ends-with': [
                'error',
                { allowSingleElementEquality: 'always' },
            ],
            // ✅ Allow unbound methods (without this)
            '@typescript-eslint/unbound-method': 'off',
            // ✅ Require explicit accessibility modifiers on class properties and methods (public, private, protected)
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                { accessibility: 'explicit' },
            ],
            // ✅ Disallow floating promises (promises that are not awaited or handled)
            '@typescript-eslint/no-floating-promises': 'error',
            // ✅ Disallow calling `await` on non-Promise values
            '@typescript-eslint/await-thenable': 'warn',
            // ✅ Require using `Promise.allSettled` or `Promise.all` with proper handling
            '@typescript-eslint/no-misused-promises': [
                'error',
                { checksVoidReturn: false },
            ],
            // ✅ Require `this` to be used only inside classes or objects where it makes sense
            '@typescript-eslint/no-invalid-this': 'error',
            // ✅ Prefer using `Array<T>` or `T[]` instead of `Array<any>`
            '@typescript-eslint/array-type': [
                'error',
                { default: 'array-simple' },
            ],
            // ✅ Ban `// @ts-ignore` unless justified with a comment
            '@typescript-eslint/ban-ts-comment': [
                'error',
                { 'ts-ignore': 'allow-with-description' },
            ],
            // ✅ Require all switch-case statements to have a `default` case
            '@typescript-eslint/switch-exhaustiveness-check': 'error',
            // ✅ Require type-safe use of template expressions (avoid accidentally adding numbers, booleans, etc.)
            '@typescript-eslint/restrict-template-expressions': [
                'error',
                { allowNumber: true, allowBoolean: false, allowAny: false },
            ],
            // ✅ Disallow unused variables, ignore variables or args starting with underscore
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    vars: 'all',
                    caughtErrors: 'all',
                    varsIgnorePattern: '^_',
                    argsIgnorePattern: '^_',
                    ignoreRestSiblings: false,
                },
            ],

            //
            // react
            //
            // ❌ Check hook dependencies
            'react-hooks/exhaustive-deps': 'off',
            // Turn off prop-types checks (TypeScript handles this)
            'react/prop-types': 'off',
            // ✅ Disallow unsafe lifecycle methods
            'react/no-unsafe': 'error',
            // ✅ Disallow this.state inside setState
            'react/no-access-state-in-setstate': 'error',
            // ✅ Check hook usage rules
            'react-hooks/rules-of-hooks': 'error',
            // ✅ Prefer function components over class components
            'react/prefer-stateless-function': [
                'warn',
                { ignorePureComponents: true },
            ],
            // ✅ Check for keys in maps
            'react/jsx-key': 'error',
            // ✅ Limit max JSX nesting
            'react/jsx-max-depth': ['warn', { max: 4 }],
            // ✅ Ensure readability of JSX elements with multiple props
            'react/jsx-max-props-per-line': [
                'warn',
                { maximum: 1, when: 'multiline' },
            ],
            // ✅ Prefer using shorthand <></> for Fragment
            'react/jsx-fragments': ['warn', 'syntax'],

            //
            // eslint-plugin-import
            //
            // ✅ Enforce all import statements to appear at the top of the file
            'import/first': 'error',
            // ✅ Error if importing a module that is not in package.json
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [
                        '**/*.test.{ts,tsx}',
                        '**/*.spec.{ts,tsx}',
                        '**/stories/*.stories.{ts,tsx}',
                        '**/storybook/**/*.stories.{ts,tsx}',
                        '**/setupTests.ts',
                    ],
                },
            ],
            // ✅ Warning if there are cyclic dependencies
            'import/no-cycle': ['warn', { maxDepth: Infinity }],
            // ✅ Error if absolute paths are specified instead of relative ones (can be disabled if necessary)
            'import/no-absolute-path': 'error',
            // ❌ Error if non-existent files/modules are imported
            'import/no-unresolved': 'off',
            // ✅ Warning if there are duplicate imports
            'import/no-duplicates': 'warn',
            // ✅ Disallow a module importing itself
            'import/no-self-import': 'error',
            // ✅ Enforce a consistent type specifier style in imports
            'import/consistent-type-specifier-style': 'error',

            //
            // eslint-plugin-simple-import-sort
            //
            // ✅ Automatic sorting of exports
            'simple-import-sort/exports': 'error',
            // ✅ Automatic sorting of imports
            'simple-import-sort/imports': [
                'error',
                {
                    groups: [
                        // Packages `react` related packages come first.
                        ['^react', '^\\w', '^@hookform', '^@radix-ui'],
                        // Node.js builtin модули (fs, path, etc.)
                        ['^node:'],
                        [
                            '^(assert|buffer|child_process|cluster|crypto|dgram|dns|domain|events|fs|http|https|net|os|path|punycode|querystring|readline|stream|string_decoder|timers|tls|tty|url|util|v8|vm|zlib)(/.*|$)',
                        ],
                        // npm packages (others external)
                        ['^next', '^@?\\w'],
                        // aliases (@/ or src/)
                        ['^@/', '^src/'],
                        // relative imports (parent)
                        ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
                        // relative imports (current folder and index)
                        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
                        // type-only imports (sometimes .d.ts or import type)
                        ['^.+\\.d\\.ts$', '^\\u0000'],
                        // styles
                        [
                            '^.+\\.css$',
                            '^.+\\.scss$',
                            '^.+\\.sass$',
                            '^.+\\.less$',
                        ],
                    ],
                },
            ],

            //
            // jest
            //
            // ✅ Prevent disabled tests
            'jest/no-disabled-tests': 'warn',
            // ✅ Prevent focused tests (like .only)
            'jest/no-focused-tests': 'error',
            // ✅ Ensure expect() is called in a test
            'jest/valid-expect': 'error',
            // ✅ Avoid identical titles in tests
            'jest/no-identical-title': 'error',
            // ✅ Warn about large snapshots
            'jest/no-large-snapshots': ['warn', { maxSize: 50 }],
            // ✅ Disallow hooks outside describing
            'jest/no-hooks': ['error', { allow: ['beforeEach', 'afterEach'] }],
            // ✅ Prefer toHaveLength over comparing .length
            'jest/prefer-to-have-length': 'warn',
            // ✅ Prefer using toBeNull, toBeUndefined, etc.
            'jest/prefer-to-be': 'warn',
            // ✅ Prefer using toContain() over indexOf
            'jest/prefer-to-contain': 'warn',
            // ✅ Suggest using toStrictEqual
            'jest/prefer-strict-equal': 'warn',

            //
            // next
            //
            // ✅ Enforce google font display strategy
            'next/google-font-display': 'warn',
            // ✅ Warn if google fonts are not preconnected
            'next/google-font-preconnect': 'warn',
            // ✅ Warn if next/script is not used for Google Analytics
            'next/next-script-for-ga': 'warn',
            // ✅ Warn about async client components
            'next/no-async-client-component': 'warn',
            // ✅ Warn about beforeInteractive scripts outside _document.js
            'next/no-before-interactive-script-outside-document': 'warn',
            // ✅ Warn about CSS <link> tags
            'next/no-css-tags': 'warn',
            // ✅ Warn about <head> elements outside _document.js
            'next/no-head-element': 'warn',
            // ✅ Warn about <a href> pointing to pages directory
            'next/no-html-link-for-pages': 'warn',
            // ✅ Warn about styled-jsx in _document.js
            'next/no-styled-jsx-in-document': 'warn',
            // ✅ Warn about synchronous scripts
            'next/no-sync-scripts': 'warn',
            // ✅ Enforce using <Image> instead of <img>
            'next/no-img-element': 'warn',
            // ✅ Warn about <title> in _document.js
            'next/no-title-in-document-head': 'warn',
            // ✅ Warn about typos in Next.js specific APIs
            'next/no-typos': 'warn',
            // ✅ Warn about unwanted Polyfill.io usage
            'next/no-unwanted-polyfillio': 'warn',
            // ✅ Require unique inline script IDs
            'next/inline-script-id': 'error',
            // ✅ Disallow assignment to module variable
            'next/no-assign-module-variable': 'error',
            // ✅ Disallow _document.js import in pages
            'next/no-document-import-in-page': 'error',
            // ✅ Disallow <Head> import in _document.js
            'next/no-head-import-in-document': 'error',
            // ✅ Disallow <Script> component in <Head>
            'next/no-script-component-in-head': 'error',

        },
    },
])
