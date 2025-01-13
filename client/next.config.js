const { i18n } = require('./next-i18next.config.js')

/** @type {import('next').NextConfig} */
const nextConfig = {
    i18n,
    // Authorization does not work in this mode
    reactStrictMode: false,
    images: {
        // https://nextjs.org/docs/pages/api-reference/components/image
        remotePatterns: [
            {
                hostname: 'api.geometki.com',
                pathname: '/uploads/**',
                port: '',
                protocol: 'https'
            },
            {
                hostname: 'miksoft.pro',
                port: '',
                protocol: 'https'
            },
            {
                hostname: 'localhost',
                pathname: '/uploads/**',
                port: '8080',
                protocol: 'http'
            }
        ],
        // unoptimized - When true, the source image will be served as-is instead of changing quality,
        // size, or format. Defaults to false.
        unoptimized: false
    },

    output: 'standalone',

    transpilePackages: ['echarts']
}

module.exports = nextConfig
