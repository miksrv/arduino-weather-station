module.exports = {
    apps: [
        {
            args: 'start',
            autorestart: true,
            env: {
                // Fewer glibc malloc arenas: the image optimizer (sharp) otherwise bloats RSS
                // far beyond the JS heap on a 1 CPU VPS
                MALLOC_ARENA_MAX: '2',
                NODE_ENV: 'production',
                PORT: 3007
            },
            // Fork, not cluster: in cluster mode PM2 hands the env to the worker after the start,
            // too late for glibc to read MALLOC_ARENA_MAX
            exec_mode: 'fork',
            instances: 1,
            max_memory_restart: '256M',
            name: 'meteo.miksoft.pro',
            script: 'server.js',
            watch: false
        }
    ]
}
