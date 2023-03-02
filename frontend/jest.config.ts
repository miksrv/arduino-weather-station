import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
    collectCoverageFrom: [
        '**/src/**/*.{js,jsx,ts,tsx}',
        '!**/src/*.{js,jsx,ts,tsx}'
    ],
    coveragePathIgnorePatterns: [
        './src/*/*.types.{ts,tsx}',
        './src/index.tsx',
        './src/App.tsx',
        './src/serviceWorker.ts'
    ],
    coverageReporters: ['json', 'lcov', 'text-summary', 'clover'],
    moduleNameMapper: {
        '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
        '^react-native$': 'react-native-web',
        'src/(.*)$': '<rootDir>/src/$1'
    },
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/ts-jest'
    },
    transformIgnorePatterns: [
        '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
        '^.+\\.module\\.(css|sass|scss)$'
    ],
    verbose: true
}

export default config
