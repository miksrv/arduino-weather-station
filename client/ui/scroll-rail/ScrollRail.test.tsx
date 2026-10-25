import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import { ScrollRail } from './ScrollRail'

import '@testing-library/jest-dom'

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

const setSizes = (element: HTMLElement, { client, scroll, left }: { client: number; scroll: number; left: number }) => {
    Object.defineProperty(element, 'clientWidth', { configurable: true, value: client })
    Object.defineProperty(element, 'scrollWidth', { configurable: true, value: scroll })
    element.scrollLeft = left
}

describe('ScrollRail', () => {
    it('renders the items in a named group without arrows when everything fits', () => {
        render(
            <ScrollRail aria-label={'Hours'}>
                <div>1</div>
                <div>2</div>
            </ScrollRail>
        )

        expect(screen.getByRole('group', { name: 'Hours' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'carousel-next' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'carousel-previous' })).not.toBeInTheDocument()
    })

    it('takes the list role for list items', () => {
        render(
            <ScrollRail
                role={'list'}
                aria-label={'Hours'}
            >
                <div role={'listitem'}>1</div>
            </ScrollRail>
        )

        expect(screen.getByRole('list', { name: 'Hours' })).toBeInTheDocument()
    })

    it('shows the arrow towards the hidden items on scroll', () => {
        render(
            <ScrollRail aria-label={'Hours'}>
                <div>1</div>
            </ScrollRail>
        )

        const list = screen.getByRole('group')

        setSizes(list, { client: 300, left: 0, scroll: 900 })
        fireEvent.scroll(list)
        expect(screen.getByRole('button', { name: 'carousel-next' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'carousel-previous' })).not.toBeInTheDocument()

        setSizes(list, { client: 300, left: 600, scroll: 900 })
        fireEvent.scroll(list)
        expect(screen.getByRole('button', { name: 'carousel-previous' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'carousel-next' })).not.toBeInTheDocument()
    })

    it('scrolls most of a screen per arrow press', () => {
        render(
            <ScrollRail aria-label={'Hours'}>
                <div>1</div>
            </ScrollRail>
        )

        const list = screen.getByRole('group')
        const scrollBy = jest.fn()
        list.scrollBy = scrollBy

        setSizes(list, { client: 1000, left: 0, scroll: 3000 })
        fireEvent.scroll(list)
        fireEvent.click(screen.getByRole('button', { name: 'carousel-next' }))

        expect(scrollBy).toHaveBeenCalledWith({ behavior: 'smooth', left: 700 })
    })
})
