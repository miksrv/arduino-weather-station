import React, { useEffect, useRef, useState } from 'react'
import { cn, Icon } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import styles from './styles.module.sass'

interface ScrollRailProps {
    /** The accessible name of the row */
    'aria-label'?: string
    /** `list` when the children are `role="listitem"` items */
    role?: 'group' | 'list'
    className?: string
    children?: React.ReactNode
}

/**
 * One row of items that scrolls sideways instead of wrapping: the native scroll — a swipe on touch screens,
 * a trackpad or Shift + wheel — and round arrow buttons with a mouse, shown only while there is more to that
 * side, with the edges faded. The inner padding is `--scroll-rail-inset` (2px by default, room for focus rings), the
 * space between items `--scroll-rail-gap`. The one horizontal scroller of the site.
 */
export const ScrollRail: React.FC<ScrollRailProps> = ({
    'aria-label': ariaLabel,
    role = 'group',
    className,
    children
}) => {
    const { t } = useTranslation()
    const listRef = useRef<HTMLDivElement>(null)
    const itemsCount = React.Children.count(children)
    const [overflow, setOverflow] = useState({ end: false, start: false })

    const updateOverflow = () => {
        const list = listRef.current
        if (!list) {
            return
        }

        const start = list.scrollLeft > 8
        const end = list.scrollLeft + list.clientWidth < list.scrollWidth - 8

        // Called on every scroll tick: keep the same state object unless an edge changed
        setOverflow((prev) => (prev.start === start && prev.end === end ? prev : { end, start }))
    }

    useEffect(() => {
        const list = listRef.current
        updateOverflow()

        // A resize or new items change the edges
        if (list && typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(updateOverflow)
            observer.observe(list)
            Array.from(list.children).forEach((child) => observer.observe(child))

            return () => observer.disconnect()
        }

        window.addEventListener('resize', updateOverflow)

        return () => window.removeEventListener('resize', updateOverflow)
    }, [itemsCount])

    // Most of a screen per press: a few items stay in view as a landmark
    const scrollBy = (direction: -1 | 1) => {
        const list = listRef.current
        list?.scrollBy?.({ behavior: 'smooth', left: direction * list.clientWidth * 0.7 })
    }

    return (
        <div className={cn(styles.rail, overflow.start && styles.fadeStart, overflow.end && styles.fadeEnd, className)}>
            {overflow.start && (
                <button
                    type={'button'}
                    className={cn(styles.arrow, styles.prev)}
                    aria-label={t('carousel-previous')}
                    title={t('carousel-previous')}
                    tabIndex={-1}
                    onClick={() => scrollBy(-1)}
                >
                    <Icon name={'KeyboardLeft'} />
                </button>
            )}

            <div
                ref={listRef}
                role={role}
                aria-label={ariaLabel}
                className={styles.list}
                onScroll={updateOverflow}
            >
                {children}
            </div>

            {overflow.end && (
                <button
                    type={'button'}
                    className={cn(styles.arrow, styles.next)}
                    aria-label={t('carousel-next')}
                    title={t('carousel-next')}
                    tabIndex={-1}
                    onClick={() => scrollBy(1)}
                >
                    <Icon name={'KeyboardRight'} />
                </button>
            )}
        </div>
    )
}
