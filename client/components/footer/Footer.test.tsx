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

describe('Footer', () => {
    it('displays the correct version information', () => {
        ;(formatDate as jest.Mock).mockReturnValue('2023')

        render(<Footer />)

        expect(screen.getByText('v')).toBeInTheDocument()
        expect(screen.getByText('GitHub')).toBeInTheDocument()
        expect(screen.getByText('1.0.0')).toBeInTheDocument()
        expect(screen.queryByText(/\d{2}\.\d{2}\.\d{4}/)).not.toBeInTheDocument()
    })

    it('renders the action on the copyright line', () => {
        render(<Footer action={<span data-testid={'action'} />} />)

        expect(screen.getByTestId('action').parentElement).toHaveTextContent('Copyright ©')
    })
})
