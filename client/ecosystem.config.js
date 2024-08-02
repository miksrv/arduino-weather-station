module.exports = {
    apps: [
        {
            args: 'start',
            autorestart: true,
            env: {
                NODE_ENV: 'production',
                PORT: 3005
            },
            instances: 1,
            max_memory_restart: '1G',
            name: 'geometki.com',
            script: 'server.js',
            watch: false
        }
    ]
}
