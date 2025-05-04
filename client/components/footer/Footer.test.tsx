import React from 'react'

import { render, screen } from '@testing-library/react'

import { formatDate } from '@/tools/date'

import Footer from './Footer'

import '@testing-library/jest-dom'

jest.mock('@/package.json', () => ({
    name: 'TestApp',
    version: '1.0.0'
}))

jest.mock('@/tools/date', () => ({ formatDate: jest.fn() }))

jest.mock('@/update', () => new Date(2023, 0, 1, 12, 0, 0))

describe('Footer', () => {
    it('displays the correct version information', () => {
        ;(formatDate as jest.Mock).mockImplementation((date, format) =>
            format === 'DD.MM.YYYY, HH:mm' ? '01.01.2023, 12:00' : '2023'
        )

        render(<Footer />)

        expect(screen.getByText('v')).toBeInTheDocument()
        expect(screen.getByText('GitHub')).toBeInTheDocument()
        expect(screen.getByText('1.0.0')).toBeInTheDocument()
        expect(screen.getByText('(01.01.2023, 12:00)')).toBeInTheDocument()
    })
})
