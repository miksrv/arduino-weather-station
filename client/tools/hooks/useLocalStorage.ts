import React, { useDebugValue, useEffect, useState } from 'react'

import * as LocalStorage from '@/tools/localstorage'

export const useLocalStorage = <S>(
    key: string,
    initialState?: S | (() => S)
): [S, React.Dispatch<React.SetStateAction<S>>] => {
    const [state, setState] = useState<S>(initialState as S)

    useDebugValue(state)

    useEffect(() => {
        const item = LocalStorage.getItem(key as any)
        setState((item ?? null) as S)
    }, [])

    useEffect(() => {
        if (state) {
            LocalStorage.setItem(key as any, state as string | number)
        }
    }, [state])

    return [state, setState]
}

export default useLocalStorage
