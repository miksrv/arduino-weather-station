import React from 'react'

import { render, screen } from '@testing-library/react'

import EChart from './EChart'

import '@testing-library/jest-dom'

jest.mock('next/dynamic', () => () => {
    const Canvas = (props: { group?: string }) => (
        <div
            data-testid='canvas'
            data-group={props.group}
        />
    )

    return Canvas
})

describe('EChart', () => {
    it('reserves the chart size on the outer box', () => {
        const { container } = render(
            <EChart
                option={{}}
                style={{ height: 180, width: '100%' }}
                className={'chart'}
            />
        )
        const box = container.firstChild as HTMLElement

        expect(box).toHaveStyle({ height: '180px', width: '100%' })
        expect(box).toHaveClass('chart')
    })

    it('passes the chart props to the lazy canvas', () => {
        render(
            <EChart
                option={{}}
                group={'snowpack'}
            />
        )

        expect(screen.getByTestId('canvas')).toHaveAttribute('data-group', 'snowpack')
    })
})
