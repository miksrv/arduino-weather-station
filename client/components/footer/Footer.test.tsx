import React from 'react'

import '@testing-library/jest-dom'

import Footer from './Footer'

import { formatDate } from '@/tools/date'
import { render, screen } from '@testing-library/react'

jest.mock('@/package.json', () => ({
    name: 'TestApp',
    version: '1.0.0'
}))

jest.mock('@/tools/date', () => ({
    formatDate: jest.fn()
}))

jest.mock('@/update', () => new Date(2023, 0, 1, 12, 0, 0)) // 1 января 2023 года, 12:00

describe('Footer', () => {
    it('displays the correct copyright information', () => {
        ;(formatDate as jest.Mock).mockImplementation((date, format) =>
            format === 'YYYY' ? '2023' : '01.01.2023, 12:00'
        )

        render(<Footer />)

        expect(screen.getByText('Copyright © TestApp 2023')).toBeInTheDocument()
    })

    it('displays the correct version information', () => {
        ;(formatDate as jest.Mock).mockImplementation((date, format) =>
            format === 'DD.MM.YYYY, HH:mm' ? '01.01.2023, 12:00' : '2023'
        )

        render(<Footer />)

        expect(screen.getByText('Version')).toBeInTheDocument()
        expect(screen.getByText('1.0.0')).toBeInTheDocument()
        expect(screen.getByText('(01.01.2023, 12:00)')).toBeInTheDocument()
    })
})
