import React from 'react'

import { render } from '@testing-library/react'

import UvScale from './UvScale'

import '@testing-library/jest-dom'

describe('UvScale', () => {
    it('renders the tick labels', () => {
        const { getByText } = render(<UvScale value={3} />)

        expect(getByText('0')).toBeInTheDocument()
        expect(getByText('2')).toBeInTheDocument()
        expect(getByText('5')).toBeInTheDocument()
        expect(getByText('7')).toBeInTheDocument()
        expect(getByText('10')).toBeInTheDocument()
        expect(getByText('11+')).toBeInTheDocument()
    })

    it('positions the marker at the percentage matching the value', () => {
        const { container } = render(<UvScale value={6} />)
        const marker = container.querySelector('div[style*="left"]')

        expect(marker).toHaveStyle({ left: '50%' })
    })

    it('positions the marker at 0% when value is undefined', () => {
        const { container } = render(<UvScale />)
        const marker = container.querySelector('div[style*="left"]')

        expect(marker).toHaveStyle({ left: '0%' })
    })
})
