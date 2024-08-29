import React, { useMemo } from 'react'
import Link from 'next/link'

import styles from './styles.module.sass'

import { concatClassNames as cn, encodeQueryData } from '@/tools/helpers'
import Icon from '@/ui/icon'

const LEFT_PAGE = 'LEFT'
const RIGHT_PAGE = 'RIGHT'

interface PaginationProps<T> {
    currentPage?: number
    totalItemsCount?: number
    linkPart?: string
    captionPage?: string
    captionNextPage?: string
    captionPrevPage?: string
    urlParam?: T
    perPage?: number
    neighbours?: number
    disableScroll?: boolean
    hideIfOnePage?: boolean
    hideArrows?: boolean
    onChangePage?: (page: number) => void
}

const Pagination: React.FC<PaginationProps<any>> = ({
    currentPage = 1,
    totalItemsCount = 0,
    linkPart,
    captionPage,
    captionNextPage,
    captionPrevPage,
    urlParam,
    disableScroll,
    hideIfOnePage,
    hideArrows,
    perPage = 4,
    neighbours = 2,
    onChangePage
}) => {
    const pageNeighbours = Math.max(0, Math.min(neighbours, 2))
    const totalPages = Math.ceil(totalItemsCount / perPage)

    const link = `/${linkPart}`

    const fetchPageNumbers: (string | number)[] = useMemo(() => {
        const totalNumbers = pageNeighbours * 2 + 3
        const totalBlocks = totalNumbers + 2

        if (totalPages > totalBlocks) {
            let pages = []

            const leftBound = currentPage - pageNeighbours
            const rightBound = currentPage + pageNeighbours
            const beforeLastPage = totalPages - 1

            const startPage = leftBound > 2 ? leftBound : 2
            const endPage = rightBound < beforeLastPage ? rightBound : beforeLastPage

            pages = range(startPage, endPage)

            const pagesCount = pages.length
            const singleSpillOffset = totalNumbers - pagesCount - 1

            const leftSpill = startPage > 2
            const rightSpill = endPage < beforeLastPage

            if (leftSpill && !rightSpill) {
                const extraPages = range(startPage - singleSpillOffset, startPage - 1)
                pages = [LEFT_PAGE, ...extraPages, ...pages]
            } else if (!leftSpill && rightSpill) {
                const extraPages = range(endPage + 1, endPage + singleSpillOffset)
                pages = [...pages, ...extraPages, RIGHT_PAGE]
            } else if (leftSpill && rightSpill) {
                pages = [LEFT_PAGE, ...pages, RIGHT_PAGE]
            }

            return [1, ...pages, totalPages]
        }

        return range(1, totalPages)
    }, [currentPage, pageNeighbours, totalPages])

    return hideIfOnePage && totalPages === 1 ? (
        <></>
    ) : (
        <nav
            aria-label={'Pages Pagination'}
            className={styles.pagination}
        >
            {fetchPageNumbers
                .filter((page) => (!hideArrows ? true : page !== RIGHT_PAGE && page !== LEFT_PAGE))
                .map((page) => (
                    <Link
                        scroll={!disableScroll}
                        className={cn(styles.item, currentPage === page ? styles.active : undefined)}
                        href={
                            page === RIGHT_PAGE
                                ? `${link}${encodeQueryData({
                                      ...urlParam,
                                      page: currentPage + 1
                                  })}`
                                : page === LEFT_PAGE
                                  ? `${link}${encodeQueryData({
                                        ...urlParam,
                                        page: currentPage - 1
                                    })}`
                                  : page === 1
                                    ? `${link}${encodeQueryData({
                                          ...urlParam,
                                          page: undefined
                                      })}`
                                    : `${link}${encodeQueryData({
                                          ...urlParam,
                                          page
                                      })}`
                        }
                        title={
                            page === RIGHT_PAGE
                                ? (captionNextPage ?? 'Next page')
                                : page === LEFT_PAGE
                                  ? (captionPrevPage ?? 'Previous page')
                                  : `${captionPage ?? 'Page'} - ${page}`
                        }
                        key={page}
                        onClick={(event) => {
                            if (onChangePage) {
                                event.preventDefault()
                                onChangePage(Number(page))
                            }
                        }}
                    >
                        {page === RIGHT_PAGE ? (
                            <Icon name={'Right'} />
                        ) : page === LEFT_PAGE ? (
                            <Icon name={'Left'} />
                        ) : (
                            <>{page}</>
                        )}
                    </Link>
                ))}
        </nav>
    )
}

/**
 * Generates an array of numbers in a certain range and with a given step
 * @param from
 * @param to
 * @param step
 */
export const range = (from: number, to: number, step = 1) => {
    let i = from
    const range: number[] = []

    while (i <= to) {
        range.push(i)
        i += step
    }

    return range
}

export default Pagination
