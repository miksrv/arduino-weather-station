const { i18n } = require('./next-i18next.config.js')

const isDev = process.env.NODE_ENV !== 'production'
const apiHost = (process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8080').replace(/\/+$/, '')

// Report-only for now: inline scripts (next-themes, Yandex.Metrika) and ECharts' inline styles need
// 'unsafe-inline'; switch to `Content-Security-Policy` once the reports are clean.
const contentSecurityPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://yastatic.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://miksoft.pro https://mc.yandex.ru https://mc.yandex.com",
    `connect-src 'self' ${apiHost} https://mc.yandex.ru https://mc.yandex.com wss://mc.yandex.com`,
    "frame-src 'self' https://webvisor.com https://*.webvisor.com",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
].join('; ')

const securityHeaders = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
    ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }])
]

/** @type {import('next').NextConfig} */
const nextConfig = {
    i18n,
    reactStrictMode: false,
    poweredByHeader: false,
    compress: true,
    images: {
        // https://nextjs.org/docs/pages/api-reference/components/image
        remotePatterns: [
            {
                hostname: 'miksoft.pro',
                port: '',
                protocol: 'https'
            },
            ...(isDev
                ? [
                      {
                          hostname: 'localhost',
                          pathname: '/uploads/**',
                          port: '8080',
                          protocol: 'http'
                      }
                  ]
                : [])
        ],
        formats: ['image/avif', 'image/webp']
    },

    output: 'standalone',

    async headers() {
        return [
            {
                source: '/:path*',
                headers: securityHeaders
            },
            {
                // Open Graph pictures and icons change rarely
                source: '/images/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }]
            },
            {
                // The browser must see a new service worker as soon as it is deployed
                source: '/sw.js',
                headers: [{ key: 'Cache-Control', value: 'no-cache' }]
            }
        ]
    },

    transpilePackages: ['echarts']
}

module.exports = nextConfig
