import { DEFAULT_STORAGE_KEY } from '@/tools/hooks/useLocalStorage'

import { isValidJSON } from './helpers'

/**
 * Retrieves an item from localStorage by key.
 *
 * This function synchronously reads from localStorage and parses the stored JSON data.
 * It's designed to work with the same storage format as the useLocalStorage hook.
 *
 * @template T - The type of the value to retrieve.
 * @param key - The key under which the data is stored.
 * @returns The stored value or undefined if not found or on server-side.
 *
 * @example
 * const locale = getItem<string>(StorageKeys.LOCALE)
 */
export const getItem = <T>(key: string): T | undefined => {
    if (typeof window === 'undefined') {
        return undefined
    }

    const localStorageData = localStorage.getItem(DEFAULT_STORAGE_KEY)

    if (localStorageData && isValidJSON(localStorageData)) {
        const parsedData = JSON.parse(localStorageData) as Record<string, T>
        return parsedData[key]
    }

    return undefined
}

