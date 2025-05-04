import React, { useDebugValue, useEffect, useState } from 'react'

export const DEFAULT_STORAGE_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY || 'mikApp'

/**
 * Custom React hook for managing state synchronized with `localStorage`.
 *
 * This hook provides a way to store, retrieve, and remove data from `localStorage`
 * while keeping the state in sync with React's state management.
 *
 * @template K - The type of the key used in `localStorage`.
 * @template S - The type of the state value associated with the key.
 *
 * @param key - The key under which the data is stored in `localStorage`.
 * @param initialState - The initial state value or a function that returns the initial state.
 *
 * @returns A tuple containing:
 * - `state` - The current state value.
 * - `setState` - A function to update the state and `localStorage`.
 * - `remove` - A function to remove the key from `localStorage` and reset the state to the initial value.
 *
 * @example
 * enum StorageKeys {
 *     LIGHT = 'light'
 * }
 *
 * type LightType = {
 *     lightStatus: string
 * }
 *
 * const [state, setState, remove] = useLocalStorage<StorageKeys, LightType>(
 *     StorageKeys.LIGHT,
 *     { lightStatus: 'created' }
 * )
 *
 * // Update the state and `localStorage`
 * setState({ lightStatus: 'updated' })
 *
 * // Remove the key from `localStorage` and reset the state
 * remove()
 */
export const useLocalStorage = <K extends string, S>(
    key: K,
    initialState?: S | (() => S)
): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>, () => void] => {
    const [state, setState] = useState<S | undefined>(() => {
        if (typeof window === 'undefined') {
            return typeof initialState === 'function' ? (initialState as () => S)() : initialState
        }

        const localstorageData = localStorage.getItem(DEFAULT_STORAGE_KEY)
        if (localstorageData && isValidJSON(localstorageData)) {
            const parsedData = JSON.parse(localstorageData)
            return parsedData[key] ?? (typeof initialState === 'function' ? (initialState as () => S)() : initialState)
        }

        return typeof initialState === 'function' ? (initialState as () => S)() : initialState
    })

    useDebugValue(state)

    const _getLocalStorage = (): Record<K, S> | undefined => {
        if (typeof window === 'undefined') {
            return
        }

        const localstorageData = localStorage.getItem(DEFAULT_STORAGE_KEY)
        if (localstorageData && isValidJSON(localstorageData)) {
            return JSON.parse(localstorageData) as Record<K, S>
        }
    }

    const setItem = (key: K, value: S | undefined) => {
        const data = _getLocalStorage() || {}
        const updatedData = { ...data, [key]: value }
        localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(updatedData))
    }

    const removeItem = (key: K) => {
        const data = _getLocalStorage() || {}
        delete (data as Record<K, S>)[key]
        localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(data))
    }

    useEffect(() => {
        const data = _getLocalStorage()
        if (data && key in data) {
            setState(data[key])
        }
    }, [key])

    useEffect(() => {
        setItem(key, state)
    }, [key, state])

    const remove = () => {
        removeItem(key)
        setState(typeof initialState === 'function' ? (initialState as () => S)() : initialState)
    }

    return [state, setState, remove]
}

/**
 * Checks if a given string is a valid JSON.
 *
 * @param string - The string to be checked.
 * @returns `true` if the string is a valid JSON, otherwise `false`.
 */
const isValidJSON = (string: string) => {
    if (!string || !string.length) {
        return true
    }

    try {
        JSON.parse(string)
    } catch (e) {
        console.error(e)

        return false
    }

    return true
}

export default useLocalStorage
