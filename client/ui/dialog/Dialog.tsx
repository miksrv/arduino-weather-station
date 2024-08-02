import React, { useEffect, useRef, useState } from 'react'

import styles from './styles.module.sass'

import Icon from '@/ui/icon'

export interface DialogProps extends React.HTMLAttributes<HTMLDialogElement> {
    open?: boolean
    header?: string
    contentHeight?: string
    maxWidth?: string
    backLinkCaption?: string
    showBackLink?: boolean
    actions?: React.ReactNode
    children?: React.ReactNode
    onBackClick?: () => void
    onCloseDialog?: () => void
}

const Dialog: React.FC<DialogProps> = ({
    open,
    header,
    contentHeight,
    maxWidth = '500px',
    backLinkCaption,
    showBackLink,
    actions,
    children,
    onBackClick,
    onCloseDialog,
    ...props
}) => {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [dialogStyle, setDialogStyle] = useState({})

    const handleResize = () => {
        // const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // const dialogWidth = dialogRef?.current?.offsetWidth || 0
        const dialogHeight = dialogRef.current?.offsetHeight || 0

        // const left = (viewportWidth - dialogWidth) / 2
        const top = (viewportHeight - dialogHeight) / 2

        setDialogStyle({
            // left: `${left}px`,
            maxWidth,
            top: `${top}px`
        })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onCloseDialog?.()
        }
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
            onCloseDialog?.()
        }
    }

    useEffect(() => {
        document.addEventListener('resize', handleResize)
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('resize', handleResize)
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    useEffect(() => {
        if (open) {
            handleResize()
        }
    }, [open])

    return open ? (
        <dialog
            {...props}
            open={open}
            ref={dialogRef}
            className={styles.dialog}
            style={dialogStyle}
        >
            {(header || showBackLink) && (
                <div className={styles.header}>
                    {showBackLink && (
                        <button
                            className={styles.backLink}
                            onClick={onBackClick}
                        >
                            <Icon name={'Left'} />
                            <div>{backLinkCaption}</div>
                        </button>
                    )}
                    <h2>{header}</h2>
                    {actions && <div className={styles.actions}>{actions}</div>}
                </div>
            )}
            <div
                className={styles.content}
                style={{ height: contentHeight ? contentHeight : 'auto' }}
            >
                {children}
            </div>
        </dialog>
    ) : (
        <></>
    )
}

export default Dialog
