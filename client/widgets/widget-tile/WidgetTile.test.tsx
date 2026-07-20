import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetTile from './WidgetTile'

import '@testing-library/jest-dom'

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

describe('WidgetTile', () => {
    it('renders the title', () => {
        render(
            <WidgetTile
                title={'Точка росы'}
                value={13.2}
            />
        )
        expect(screen.getByText('Точка росы')).toBeInTheDocument()
    })

    it('renders the value with unit', () => {
        render(
            <WidgetTile
                title={'Точка росы'}
                value={13.2}
                unit={'°C'}
            />
        )
        expect(screen.getByText('13.2')).toBeInTheDocument()
        expect(screen.getByText('°C')).toBeInTheDocument()
    })

    it('renders text values without a unit', () => {
        render(
            <WidgetTile
                title={'Состояние неба'}
                value={'Ясно'}
            />
        )
        expect(screen.getByText('Ясно')).toBeInTheDocument()
    })

    it('renders fallback "no-data" when value is undefined', () => {
        render(<WidgetTile title={'Точка росы'} />)
        expect(screen.getByText('no-data')).toBeInTheDocument()
    })

    it('does not render the unit when value is undefined', () => {
        render(
            <WidgetTile
                title={'Точка росы'}
                unit={'°C'}
            />
        )
        expect(screen.queryByText('°C')).not.toBeInTheDocument()
    })

    it('renders skeleton instead of value while loading', () => {
        render(
            <WidgetTile
                title={'Точка росы'}
                value={13.2}
                loading
            />
        )
        expect(screen.queryByText('13.2')).not.toBeInTheDocument()
    })

    it('applies formatter to the value', () => {
        const formatter = (v: string | number | undefined) => `${v}!`
        render(
            <WidgetTile
                title={'Точка росы'}
                value={5}
                formatter={formatter}
            />
        )
        expect(screen.getByText('5!')).toBeInTheDocument()
    })
})
