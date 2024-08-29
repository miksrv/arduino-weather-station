import React, { useCallback, useEffect, useRef, useState } from 'react'
import debounce from 'lodash-es/debounce'
import Image, { StaticImageData } from 'next/image'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'
import Icon from '@/ui/icon'
import { IconTypes } from '@/ui/icon/types'
import Spinner from '@/ui/spinner'

export type DropdownOption = {
    title: string
    value: any
    type?: string
    image?: StaticImageData
    description?: string
}

interface DropdownProps<T> {
    className?: string
    options?: DropdownOption[]
    loading?: boolean
    disabled?: boolean
    clearable?: boolean
    hideArrow?: boolean
    debouncing?: boolean
    debounceDelay?: number
    notFoundCaption?: string
    placeholder?: string
    label?: string
    value?: T
    minLength?: number
    leftIcon?: IconTypes
    onSelect?: (option: T) => void
    onSearch?: (value: string) => void
    onClear?: () => void
}

// TODO: If Enter key press and focus on the input field and options list not empty - select first option
const Autocomplete: React.FC<DropdownProps<any>> = ({
    className,
    options,
    disabled,
    loading,
    clearable,
    hideArrow,
    debouncing = true,
    debounceDelay = 1000,
    value,
    minLength = 3,
    notFoundCaption,
    placeholder,
    label,
    leftIcon,
    onSelect,
    onSearch,
    onClear
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [search, setSearch] = useState<string>()
    const [localLoading, setLocalLoading] = useState<boolean>(false)
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [selectedOption, setSelectedOption] = useState<DropdownOption | undefined>(undefined)

    const toggleDropdown = () => {
        setIsOpen(!isOpen)
    }

    const handleDebouncedSearch = useCallback(
        debounce((value) => {
            onSearch?.(value)
            setLocalLoading(false)
        }, debounceDelay ?? 1000),
        []
    )

    const handleChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value

        if (value.length >= minLength) {
            setLocalLoading(true)
        } else {
            setLocalLoading(false)
        }

        setSearch(value)

        if (value === '' && isOpen) {
            setIsOpen(false)
        }

        if (debouncing) {
            handleDebouncedSearch(value)
        } else {
            onSearch?.(value)
            setLocalLoading(false)
        }
    }

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && options?.length && options.length >= 1 && search !== '') {
            handleSelect(options[0])
        }
    }

    const handleSelect = (option: DropdownOption | undefined) => {
        if (selectedOption?.title !== option?.title) {
            setSelectedOption(option)
            setSearch(option?.title)
        }

        onSelect?.(option)

        setIsOpen(false)
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false)
        }
    }

    const handleClearClick = (event: React.MouseEvent) => {
        event.stopPropagation()
        setSearch(undefined)
        handleSelect(undefined)
        onClear?.()
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    useEffect(() => {
        if (!value) {
            setSelectedOption(undefined)
        }

        if (value) {
            setSearch(value.title)
            setSelectedOption(options?.find(({ title }) => value === title) ?? value ?? undefined)
        }
    }, [value])

    useEffect(() => {
        if (search) {
            setIsOpen(true)
        }
    }, [options])

    return (
        <div
            ref={dropdownRef}
            className={cn(className, styles.autocomplete)}
        >
            {label && <label className={styles.label}>{label}</label>}
            <div className={cn(styles.container, isOpen && styles.open, disabled && styles.disabled)}>
                <div className={styles.searchContainer}>
                    {leftIcon && (
                        <span className={styles.leftIcon}>
                            <Icon name={leftIcon} />
                        </span>
                    )}
                    <input
                        type={'text'}
                        value={search || ''}
                        defaultValue={selectedOption?.title ?? value?.name}
                        className={styles.searchInput}
                        placeholder={placeholder ?? ''}
                        onMouseMove={(e) => e.stopPropagation()}
                        onWheelCapture={(e) => e.stopPropagation()}
                        onKeyDown={handleKeyPress}
                        onChange={handleChangeInput}
                    />
                    <span className={styles.arrow}>
                        {loading || localLoading ? (
                            <Spinner className={styles.loader} />
                        ) : clearable && selectedOption?.title ? (
                            <button
                                className={styles.clear}
                                type={'button'}
                                onClick={handleClearClick}
                            >
                                <Icon name={'Close'} />
                            </button>
                        ) : !hideArrow ? (
                            <button
                                className={styles.toggleButton}
                                type={'button'}
                                onClick={toggleDropdown}
                            >
                                {isOpen ? <Icon name={'ArrowUp'} /> : <Icon name={'ArrowDown'} />}
                            </button>
                        ) : (
                            <></>
                        )}
                    </span>
                </div>
                {isOpen && !loading && (
                    <ul
                        className={styles.optionsList}
                        onWheelCapture={(e) => e.stopPropagation()}
                    >
                        {!options?.length && <li className={styles.emptyItem}>{notFoundCaption ?? 'Nothing found'}</li>}
                        {options?.map((option, i) => (
                            <li
                                key={`option${i}`}
                                className={cn(
                                    option.title === selectedOption?.title &&
                                        option.type === selectedOption.type &&
                                        styles.active
                                )}
                            >
                                <button
                                    onClick={() => handleSelect(option)}
                                    onMouseMove={(e) => e.stopPropagation()}
                                >
                                    <div className={styles.content}>
                                        {option.image && (
                                            <Image
                                                className={styles.optionImage}
                                                src={option.image.src}
                                                alt={''}
                                                width={22}
                                                height={26}
                                            />
                                        )}
                                        <span>{option.title}</span>
                                    </div>
                                    {option.description && (
                                        <div className={styles.description}>{option.description}</div>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

export default Autocomplete
