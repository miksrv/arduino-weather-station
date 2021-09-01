import React from 'react'
import '@testing-library/jest-dom/extend-expect'

import * as functions from '../data/functions';

describe('Testing helper functions', () => {
    it('Check "declOfNum"', () => {
        const testArray = ['кадр', 'кадра', 'кадров']

        expect(functions.declOfNum(23, testArray)).toBe('кадра');
        expect(functions.declOfNum(21, testArray)).toBe('кадр');
        expect(functions.declOfNum(28, testArray)).toBe('кадров');
    })

    it('Check "timeAgo" - covert input number second to string time ago', () => {
        const tmp = 'Обновлено недавно'

        expect(functions.timeAgo(null)).toBe(tmp)
        expect(functions.timeAgo(-10)).toBe(tmp)
        expect(functions.timeAgo(5320)).toBe('01 ч. 28 мин. 40 сек. назад')
    })
});
