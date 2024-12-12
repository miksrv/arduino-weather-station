import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { cn, Table, TableProps } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'

interface WidgetProps extends TableProps<ApiModel.Weather> {
    title?: string
    link?: React.AnchorHTMLAttributes<HTMLAnchorElement>
    fullWidth?: boolean
}

const WidgetForecastTable: React.FC<WidgetProps> = ({ title, link, fullWidth, ...props }) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const titleRef = useRef<HTMLDivElement | null>(null)
    const [tableHeight, setTableHeight] = useState<number | null>(null)

    useEffect(() => {
        const calculateTableHeight = () => {
            if (containerRef.current && titleRef.current && props.stickyHeader) {
                const containerHeight = containerRef.current.offsetHeight
                const titleHeight = titleRef.current.offsetHeight
                const calculatedHeight = containerHeight - titleHeight
                setTableHeight(calculatedHeight)
            }
        }

        calculateTableHeight()

        window.addEventListener('resize', calculateTableHeight)

        return () => {
            window.removeEventListener('resize', calculateTableHeight)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className={cn(
                styles.widgetForecastTable,
                props.stickyHeader && styles.stickyHeader,
                fullWidth && styles.fullWidth
            )}
        >
            {title && (
                <h3
                    ref={titleRef}
                    className={styles.title}
                >
                    {link ? (
                        <Link
                            href={link?.href || ''}
                            {...link}
                        >
                            {title}
                        </Link>
                    ) : (
                        title
                    )}
                </h3>
            )}

            <Table<ApiModel.Weather>
                {...props}
                className={styles.table}
                height={props.stickyHeader ? tableHeight : undefined}
            />
        </div>
    )
}

export default WidgetForecastTable
