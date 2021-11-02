import { IRestResponse, ISensorItem } from '../../app/types'

const payload: ISensorItem[] = [
    {
        name: 't',
        value: 12.3,
        trend: -3,
        min: 12.1,
        max: 12.9,
        type: 'temperature'
    },
    {
        name: 'p',
        value: 746.2,
        trend: 0.4,
        min: 745.2,
        max: 746.3,
        type: 'pressure'
    },
    {
        name: 'h',
        value: 45.4,
        trend: 7.1,
        min: 32,
        max: 59.6,
        type: 'humidity'
    },
    {
        name: 'dp',
        value: 3.2,
        trend: .4,
        min: -1.8,
        max: 2.4,
        type: 'dewpoint'
    },
    {
        name: 'cl',
        value: 80,
        trend: 14,
        min: 55,
        max: 80,
        type: 'clouds'
    },
    {
        name: 'ws',
        value: 3.1,
        trend: 2.1,
        min: 0,
        max: 5.4,
        type: 'wind_speed'
    },
    {
        name: 'wd',
        value: 180,
        type: 'wind_degree'
    },
    {
        name: 'pr',
        value: .2,
        trend: 0,
        min: 0,
        max: 2.3,
        type: 'precipitation'
    }
]

export const response: IRestResponse = {
    status: true,
    timestamp: {
        server: Date.now() / 1000 | 0,
        update:  (Date.now() / 1000) - 50 | 0
    },
    payload: payload
}

export default response