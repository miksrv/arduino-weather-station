import React, { useEffect, useRef, useState } from 'react'
import { Table, TableProps } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'

interface WidgetProps extends TableProps<ApiModel.Weather> {
    title?: string
}

const WidgetForecastTable: React.FC<WidgetProps> = ({ title, ...props }) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const titleRef = useRef<HTMLDivElement | null>(null)
    const [tableHeight, setTableHeight] = useState<number | null>(null)

    useEffect(() => {
        const calculateTableHeight = () => {
            if (containerRef.current && titleRef.current) {
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
            className={styles.widgetForecastTable}
        >
            {title && (
                <div
                    ref={titleRef}
                    className={styles.title}
                >
                    {title}
                </div>
            )}

            <Table<ApiModel.Weather>
                {...props}
                className={styles.table}
                height={tableHeight}
            />
        </div>
    )
}

export default WidgetForecastTable
