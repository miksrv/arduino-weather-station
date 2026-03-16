import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetMeteogram from './WidgetMeteogram'

import '@testing-library/jest-dom'

jest.mock('@/components/widget-meteogram/Meteogram', () => () => <div data-testid='meteogram' />)

describe('WidgetMeteogram', () => {
    it('renders Meteogram when not loading', () => {
        render(<WidgetMeteogram loading={false} />)
        expect(screen.getByTestId('meteogram')).toBeInTheDocument()
    })

    it('renders skeleton when loading is true', () => {
        render(<WidgetMeteogram loading />)
        expect(screen.queryByTestId('meteogram')).not.toBeInTheDocument()
    })

    it('renders Meteogram when loading is undefined', () => {
        render(<WidgetMeteogram />)
        expect(screen.getByTestId('meteogram')).toBeInTheDocument()
    })
})
