import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import PeriodToggle from './PeriodToggle'

import '@testing-library/jest-dom'

const options = [
    { value: '24h' as const, label: '24 часа' },
    { value: '7d' as const, label: '7 дней' },
    { value: '30d' as const, label: '30 дней' }
]

describe('PeriodToggle', () => {
    it('renders all option labels', () => {
        render(
            <PeriodToggle
                value={'24h'}
                onChange={jest.fn()}
                options={options}
            />
        )
        expect(screen.getByText('24 часа')).toBeInTheDocument()
        expect(screen.getByText('7 дней')).toBeInTheDocument()
        expect(screen.getByText('30 дней')).toBeInTheDocument()
    })

    it('calls onChange with the clicked option value', () => {
        const onChange = jest.fn()
        render(
            <PeriodToggle
                value={'24h'}
                onChange={onChange}
                options={options}
            />
        )
        fireEvent.click(screen.getByText('7 дней'))
        expect(onChange).toHaveBeenCalledWith('7d')
    })

    it('marks the current value as active', () => {
        render(
            <PeriodToggle
                value={'7d'}
                onChange={jest.fn()}
                options={options}
            />
        )
        expect(screen.getByText('7 дней').className).toContain('toggleButtonActive')
        expect(screen.getByText('24 часа').className).not.toContain('toggleButtonActive')
    })
})
