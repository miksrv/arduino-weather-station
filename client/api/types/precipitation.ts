export interface PrecipDay {
    date: string
    total: number
}

export interface PrecipStats {
    totalYear: number
    rainyDays: number
    dryDays: number
    maxDailyTotal: { value: number; date: string }
    longestWetStreak: { days: number; start: string; end: string }
    longestDryStreak: { days: number; start: string; end: string }
    monthlyTotals: Array<{ month: number; total: number }>
}

export interface Response {
    year: number
    days: PrecipDay[]
    stats: PrecipStats
    availableYears: number[]
}

export interface Request {
    year: number
}
