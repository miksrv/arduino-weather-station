module.exports = {
    apps: [
        {
            args: 'start',
            autorestart: true,
            env: {
                NODE_ENV: 'production',
                PORT: 3007
            },
            instances: 1,
            max_memory_restart: '256M',
            name: 'meteo.miksoft.pro',
            script: 'server.js',
            watch: false
        }
    ]
}
