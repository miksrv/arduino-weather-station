import type { Config } from 'jest'

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '\\.(css|sass|scss|jpg|jpeg|png)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/$1',
        '^simple-react-ui-kit$': '<rootDir>/__mocks__/simple-react-ui-kit.js'
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                babel: true,
                tsconfig: 'tsconfig.jest.json'
            }
        ]
    },
    collectCoverageFrom: ['**/*.{ts,tsx}', '!**/*.test.tsx', '!*.d.ts', '!pages/**/*.{ts,tsx}', '!.next/**/*', '!**/index.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    transformIgnorePatterns: ['node_modules/(?!(module-to-transform)/)', '/.next/']
}

export default config
