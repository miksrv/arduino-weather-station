import { IRestResponse, ISensorItem } from '../../app/types'

const payload: ISensorItem[] = [
    {
        max: 12.9,
        min: 12.1,
        name: 't',
        trend: -3,
        type: 'temperature',
        value: 12.3
    },
    {
        max: 746.3,
        min: 745.2,
        name: 'p',
        trend: 0.4,
        type: 'pressure',
        value: 746.2
    },
    {
        max: 59.6,
        min: 32,
        name: 'h',
        trend: 7.1,
        type: 'humidity',
        value: 45.4
    },
    {
        max: 2.4,
        min: -1.8,
        name: 'dp',
        trend: 0.4,
        type: 'dewpoint',
        value: 3.2
    },
    {
        max: 80,
        min: 55,
        name: 'cl',
        trend: 14,
        type: 'clouds',
        value: 80
    },
    {
        max: 5.4,
        min: 0,
        name: 'ws',
        trend: 2.1,
        type: 'wind_speed',
        value: 3.1
    },
    {
        name: 'wd',
        type: 'wind_deg',
        value: 180
    },
    {
        max: 2.3,
        min: 0,
        name: 'pr',
        trend: 0,
        type: 'precipitation',
        value: 0.2
    }
]

export const response: IRestResponse = {
    payload: payload,
    status: true,
    timestamp: {
        server: (Date.now() / 1000) | 0,
        update: (Date.now() / 1000 - 50) | 0
    }
}

export default response
