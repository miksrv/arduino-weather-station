import React, { useEffect, useRef, useState } from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'

interface PaginationProps {
    className?: string
    position?: 'left' | 'right'
    action?: React.ReactNode | string
    children?: React.ReactNode
    closeOnChildrenClick?: boolean
}

const Popout: React.FC<PaginationProps> = ({ className, position, action, children, closeOnChildrenClick }) => {
    const popoutRef = useRef<HTMLDivElement>(null)
    const popoutChildrenRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState<boolean>(false)

    const toggleDropdown = (event: React.MouseEvent) => {
        event.stopPropagation()

        setIsOpen(!isOpen)
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (popoutRef.current && !popoutRef.current.contains(event.target as Node)) {
            setIsOpen(false)
        }

        if (popoutChildrenRef.current && !popoutChildrenRef.current.contains(event.target as Node)) {
            setIsOpen(false)
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <div
            ref={popoutRef}
            className={cn(className, styles.popout)}
        >
            <button
                className={styles.trigger}
                onClick={toggleDropdown}
            >
                {action}
            </button>

            {isOpen && (
                <div
                    ref={popoutRef}
                    className={styles.content}
                    onClick={() => (closeOnChildrenClick ? setIsOpen(false) : undefined)}
                    style={position === 'left' ? { left: 0 } : { right: 0 }}
                >
                    {children}
                </div>
            )}
        </div>
    )
}

export default Popout
