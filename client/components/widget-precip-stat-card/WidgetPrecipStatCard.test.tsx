import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetPrecipStatCard from './WidgetPrecipStatCard'

import '@testing-library/jest-dom'

describe('WidgetPrecipStatCard', () => {
    it('renders Skeleton when loading', () => {
        render(
            <WidgetPrecipStatCard
                loading={true}
                title='Total'
                value='100mm'
            />
        )
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
        expect(screen.queryByText('Total')).not.toBeInTheDocument()
    })

    it('renders title and string value when not loading', () => {
        render(
            <WidgetPrecipStatCard
                loading={false}
                title='Total'
                value='100mm'
            />
        )
        expect(screen.getByText('Total')).toBeInTheDocument()
        expect(screen.getByText('100mm')).toBeInTheDocument()
    })

    it('renders numeric value when not loading', () => {
        render(
            <WidgetPrecipStatCard
                loading={false}
                title='Days'
                value={42}
            />
        )
        expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('renders sub text when sub is provided', () => {
        render(
            <WidgetPrecipStatCard
                loading={false}
                title='Total'
                value='50mm'
                sub='vs last year'
            />
        )
        expect(screen.getByText('vs last year')).toBeInTheDocument()
    })

    it('does not render sub element when sub is omitted', () => {
        render(
            <WidgetPrecipStatCard
                loading={false}
                title='Total'
                value='50mm'
            />
        )
        expect(screen.queryByText('vs last year')).not.toBeInTheDocument()
    })
})
