import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react'
import { EmblaCarouselType } from 'embla-carousel'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'
import Icon from '@/ui/icon'

type UsePrevNextButtonsType = {
    prevBtnDisabled: boolean
    nextBtnDisabled: boolean
    onPrevButtonClick: () => void
    onNextButtonClick: () => void
}

export const usePrevNextButtons = (emblaApi: EmblaCarouselType | undefined): UsePrevNextButtonsType => {
    const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
    const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

    const onPrevButtonClick = useCallback(() => {
        if (!emblaApi) {
            return
        }
        emblaApi.scrollPrev()
    }, [emblaApi])

    const onNextButtonClick = useCallback(() => {
        if (!emblaApi) {
            return
        }
        emblaApi.scrollNext()
    }, [emblaApi])

    const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
        setPrevBtnDisabled(!emblaApi.canScrollPrev())
        setNextBtnDisabled(!emblaApi.canScrollNext())
    }, [])

    useEffect(() => {
        if (!emblaApi) {
            return
        }

        onSelect(emblaApi)
        emblaApi.on('reInit', onSelect)
        emblaApi.on('select', onSelect)
    }, [emblaApi, onSelect])

    return {
        nextBtnDisabled,
        onNextButtonClick,
        onPrevButtonClick,
        prevBtnDisabled
    }
}

type PropType = PropsWithChildren<
    React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
>

export const PrevButton: React.FC<PropType> = ({ children, ...restProps }) => (
    <button
        className={cn(styles.arrowButton, styles.arrowButtonLeft)}
        type={'button'}
        {...restProps}
    >
        <span>
            <Icon name={'Left'} />
            {children}
        </span>
    </button>
)

export const NextButton: React.FC<PropType> = ({ children, ...restProps }) => (
    <button
        className={cn(styles.arrowButton, styles.arrowButtonRight)}
        type={'button'}
        {...restProps}
    >
        <span>
            <Icon name={'Right'} />
            {children}
        </span>
    </button>
)
