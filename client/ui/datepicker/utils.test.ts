// utils.test.ts
import { enDaysOfWeek, enMonths, enPresets, PresetOption, ruDaysOfWeek, ruMonths, ruPresets } from './utils'

describe('PresetOption enum', () => {
    it('should contain all expected keys', () => {
        expect(PresetOption.TODAY).toBe('today')
        expect(PresetOption.DAY).toBe('day')
        expect(PresetOption.WEEK).toBe('week')
        expect(PresetOption.MONTH).toBe('month')
        expect(PresetOption.QUARTER).toBe('quarter')
        expect(PresetOption.HALF_YEAR).toBe('half_year')
        expect(PresetOption.YEAR).toBe('year')
    })
})

describe('enPresets', () => {
    it('should have correct English labels for all presets', () => {
        expect(enPresets[PresetOption.TODAY]).toBe('Today')
        expect(enPresets[PresetOption.DAY]).toBe('24 Hours')
        expect(enPresets[PresetOption.WEEK]).toBe('Last Week')
        expect(enPresets[PresetOption.MONTH]).toBe('Last Month')
        expect(enPresets[PresetOption.QUARTER]).toBe('Last Quarter')
        expect(enPresets[PresetOption.HALF_YEAR]).toBe('Last 6 Months')
        expect(enPresets[PresetOption.YEAR]).toBe('Last Year')
    })
})

describe('ruPresets', () => {
    it('should have correct Russian labels for all presets', () => {
        expect(ruPresets[PresetOption.TODAY]).toBe('Сегодня')
        expect(ruPresets[PresetOption.DAY]).toBe('Последние сутки')
        expect(ruPresets[PresetOption.WEEK]).toBe('Последняя неделя')
        expect(ruPresets[PresetOption.MONTH]).toBe('Последний месяц')
        expect(ruPresets[PresetOption.QUARTER]).toBe('Последний квартал')
        expect(ruPresets[PresetOption.HALF_YEAR]).toBe('Последние полгода')
        expect(ruPresets[PresetOption.YEAR]).toBe('Последний год')
    })
})

describe('enDaysOfWeek', () => {
    it('should contain 7 English day abbreviations', () => {
        expect(enDaysOfWeek).toStrictEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])
    })
})

describe('ruDaysOfWeek', () => {
    it('should contain 7 Russian day abbreviations', () => {
        expect(ruDaysOfWeek).toStrictEqual(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'])
    })
})

describe('enMonths', () => {
    it('should contain 12 English month names', () => {
        expect(enMonths).toStrictEqual([
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ])
    })
})

describe('ruMonths', () => {
    it('should contain 12 Russian month names', () => {
        expect(ruMonths).toStrictEqual([
            'Январь',
            'Февраль',
            'Март',
            'Апрель',
            'Май',
            'Июнь',
            'Июль',
            'Август',
            'Сентябрь',
            'Октябрь',
            'Ноябрь',
            'Декабрь'
        ])
    })
})
