export enum PresetOption {
    TODAY = 'today',
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    QUARTER = 'quarter',
    HALF_YEAR = 'half_year',
    YEAR = 'year'
}

export type CalendarPresetType = {
    key: PresetOption
    endDate: Date
}

export const enPresets = {
    [PresetOption.TODAY]: 'Today',
    [PresetOption.DAY]: '24 Hours',
    [PresetOption.WEEK]: 'Last Week',
    [PresetOption.MONTH]: 'Last Month',
    [PresetOption.QUARTER]: 'Last Quarter',
    [PresetOption.HALF_YEAR]: 'Last 6 Months',
    [PresetOption.YEAR]: 'Last Year'
}

export const ruPresets = {
    [PresetOption.TODAY]: 'Сегодня',
    [PresetOption.DAY]: 'Последние сутки',
    [PresetOption.WEEK]: 'Последняя неделя',
    [PresetOption.MONTH]: 'Последний месяц',
    [PresetOption.QUARTER]: 'Последний квартал',
    [PresetOption.HALF_YEAR]: 'Последние полгода',
    [PresetOption.YEAR]: 'Последний год'
}

export const enDaysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
export const ruDaysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export const enMonths = [
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
]

export const ruMonths = [
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
]
