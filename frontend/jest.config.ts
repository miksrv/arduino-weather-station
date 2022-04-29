import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
    verbose: true,
    testEnvironment: 'jsdom',
    collectCoverageFrom: [
        '**/src/**/*.{js,jsx,ts,tsx}',
        '!**/src/*.{js,jsx,ts,tsx}',
    ],
    coveragePathIgnorePatterns: [
        './src/*/*.types.{ts,tsx}',
        './src/index.tsx',
        './src/App.tsx',
        './src/serviceWorker.ts'
    ],
    coverageReporters: [
        'json',
        'lcov',
        'text-summary',
        'clover'
    ],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/ts-jest'
    },
    transformIgnorePatterns: [
        '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
        '^.+\\.module\\.(css|sass|scss)$'
    ],
    moduleNameMapper: {
        '^react-native$': 'react-native-web',
        '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
        'src/(.*)$': '<rootDir>/src/$1'
    }
}

export default config
