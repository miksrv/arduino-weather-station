import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'
import Button, { ButtonProps } from '@/ui/button'

interface PaginationProps extends ButtonProps {
    className?: string
    position?: 'left' | 'right'
    action?: React.ReactNode | string
    children?: React.ReactNode
    closeOnChildrenClick?: boolean
}

export interface PopoutHandle {
    close: () => void // Метод для закрытия
}

const Popout = forwardRef<PopoutHandle, PaginationProps>(
    ({ className, position, action, children, closeOnChildrenClick, ...props }, ref) => {
        const popoutRef = useRef<HTMLDivElement>(null)
        const popoutChildrenRef = useRef<HTMLDivElement>(null)
        const [isOpen, setIsOpen] = useState<boolean>(false)

        // Метод для закрытия компонента
        const close = () => {
            setIsOpen(false)
        }

        // Делаем метод доступным через ref
        useImperativeHandle(ref, () => ({
            close
        }))

        const toggleDropdown = (event: React.MouseEvent) => {
            event.stopPropagation()
            setIsOpen(!isOpen)
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (popoutRef.current && !popoutRef.current.contains(event.target as Node)) {
                close() // Закрываем при клике вне
            }

            if (popoutChildrenRef.current && !popoutChildrenRef.current.contains(event.target as Node)) {
                close() // Закрываем при клике вне
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
                <Button
                    onClick={toggleDropdown}
                    {...props}
                >
                    {action}
                </Button>

                {isOpen && (
                    <div
                        ref={popoutChildrenRef}
                        className={styles.content}
                        onClick={() => (closeOnChildrenClick ? close() : undefined)}
                        style={position === 'left' ? { left: 0 } : { right: 0 }}
                    >
                        {children}
                    </div>
                )}
            </div>
        )
    }
)

Popout.displayName = 'Popout'

export default Popout
