import { LOCAL_STORAGE_KEY } from './constants'
import { getItem, removeItem, setItem } from './localstorage'

const mockLocalStorage = (() => {
    let store: { [key: string]: string } = {}

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value
        },
        removeItem: (key: string) => {
            delete store[key]
        },
        clear: () => {
            store = {}
        }
    }
})()

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
})

describe('localstorage', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('getItem returns empty string if local storage is empty', () => {
        expect(getItem('LOCALE')).toBe('')
    })

    it('getItem returns the correct value from local storage', () => {
        setItem('LOCALE', 'someValue')
        expect(getItem('LOCALE')).toBe('someValue')
    })

    it('removeItem removes the value from local storage', () => {
        setItem('LOCALE', 'someValue')
        removeItem('LOCALE')
        const storedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}')
        expect(storedData.someKey).toBeUndefined()
    })
})
