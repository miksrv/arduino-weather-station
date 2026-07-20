import React from 'react'

import { render, screen } from '@testing-library/react'

import StaleDataBanner from './StaleDataBanner'

import '@testing-library/jest-dom'

jest.mock('@/pages/_app', () => ({
    POLING_INTERVAL_CURRENT: 600000
}))

jest.mock('@/api', () => ({
    API: {
        useGetCurrentQuery: jest.fn()
    }
}))

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { time: string }) => `${key}${options ? `:${options.time}` : ''}`
    })
}))

jest.mock('@/tools/date', () => ({
    timeAgo: jest.fn(() => '5 days ago')
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const useGetCurrentQuery = require('@/api').API.useGetCurrentQuery

describe('StaleDataBanner', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders nothing when data is not stale', () => {
        useGetCurrentQuery.mockReturnValue({ data: { isStale: false, lastUpdated: '2024-01-01T12:00:00Z' } })
        const { container } = render(<StaleDataBanner />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renders nothing when data is not loaded yet', () => {
        useGetCurrentQuery.mockReturnValue({ data: undefined })
        const { container } = render(<StaleDataBanner />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renders the banner with title and relative time when data is stale', () => {
        useGetCurrentQuery.mockReturnValue({ data: { isStale: true, lastUpdated: '2024-01-01T12:00:00Z' } })
        render(<StaleDataBanner />)
        expect(screen.getByText('stale-data-banner-title')).toBeInTheDocument()
        expect(screen.getByText('stale-data-banner-message:5 days ago')).toBeInTheDocument()
    })
})
