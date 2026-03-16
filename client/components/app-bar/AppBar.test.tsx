import React from 'react'

import { render, screen } from '@testing-library/react'

import AppBar from './AppBar'

import '@testing-library/jest-dom'

jest.mock('@/pages/_app', () => ({
    POLING_INTERVAL_CURRENT: 600000
}))

jest.mock('@/api', () => ({
    API: {
        useGetCurrentQuery: jest.fn()
    }
}))

jest.mock('@/tools/hooks/useClientOnly', () => jest.fn())
jest.mock('next-themes', () => ({
    useTheme: jest.fn()
}))
jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('@/ui/theme-switcher', () => () => <div data-testid='theme-switcher' />)
jest.mock('@/tools/date', () => ({
    formatDate: jest.fn(() => '1 January 2024, 12:00'),
    minutesAgo: jest.fn(() => 5),
    timeAgo: jest.fn(() => '5 minutes ago')
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const useGetCurrentQuery = require('@/api').API.useGetCurrentQuery
// eslint-disable-next-line @typescript-eslint/no-require-imports
const useClientOnly = require('@/tools/hooks/useClientOnly')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useTheme } = require('next-themes')

describe('AppBar', () => {
    beforeEach(() => {
        useTheme.mockReturnValue({ theme: 'light', setTheme: jest.fn() })
        useClientOnly.mockReturnValue(false)
        useGetCurrentQuery.mockReturnValue({ data: undefined, isLoading: false })
    })

    it('renders the hamburger button', () => {
        render(<AppBar />)
        expect(screen.getByLabelText('Toggle Sidebar')).toBeInTheDocument()
    })

    it('calls onMenuClick when hamburger is clicked', () => {
        const onMenuClick = jest.fn()
        render(<AppBar onMenuClick={onMenuClick} />)
        screen.getByLabelText('Toggle Sidebar').click()
        expect(onMenuClick).toHaveBeenCalled()
    })

    it('shows loading spinner when isLoading is true', () => {
        useGetCurrentQuery.mockReturnValue({ data: undefined, isLoading: true })
        render(<AppBar />)
        expect(screen.getByText('please-wait-loading')).toBeInTheDocument()
    })

    it('shows formatted date when data is available', () => {
        useGetCurrentQuery.mockReturnValue({
            data: { date: '2024-01-01T12:00:00Z' },
            isLoading: false
        })
        render(<AppBar />)
        expect(screen.getByText('1 January 2024, 12:00')).toBeInTheDocument()
    })

    it('shows timeAgo when data is available', () => {
        useGetCurrentQuery.mockReturnValue({
            data: { date: '2024-01-01T12:00:00Z' },
            isLoading: false
        })
        render(<AppBar />)
        expect(screen.getByText('5 minutes ago')).toBeInTheDocument()
    })

    it('shows ThemeSwitcher only when isClient is true', () => {
        useClientOnly.mockReturnValue(true)
        render(<AppBar />)
        expect(screen.getByTestId('theme-switcher')).toBeInTheDocument()
    })

    it('hides ThemeSwitcher when isClient is false', () => {
        useClientOnly.mockReturnValue(false)
        render(<AppBar />)
        expect(screen.queryByTestId('theme-switcher')).not.toBeInTheDocument()
    })
})
