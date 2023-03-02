import { rest } from 'msw'

import currentData from './rest/current'
import forecastData from './rest/forecast'
import sensorsData from './rest/sensors'

export const handlers = [
    rest.get('**/get/current', (req, res, ctx) => {
        currentData.timestamp.server = (Date.now() / 1000) | 0
        currentData.timestamp.update =
            (Date.now() / 1000 - (Math.random() * (40 - 10) + 10)) | 0
        return res(
            // ctx.delay(1500),
            ctx.status(202, 'Mocked status'),
            ctx.json(currentData)
        )
    }),

    rest.get('**/get/forecast', (req, res, ctx) =>
        res(
            // ctx.delay(1500),
            ctx.status(202, 'Mocked status'),
            ctx.json(forecastData)
        )
    ),

    rest.get('**/get/sensors', (req, res, ctx) => {
        sensorsData.timestamp.server = (Date.now() / 1000) | 0
        sensorsData.timestamp.update =
            (Date.now() / 1000 - (Math.random() * (40 - 10) + 10)) | 0
        return res(
            // ctx.delay(1500),
            ctx.status(202, 'Mocked status'),
            ctx.json(sensorsData)
        )
    })

    // rest.get('**/get/statistic', (req, res, ctx) => {
    //     return res(
    //         // ctx.delay(1500),
    //         ctx.status(202, 'Mocked status'),
    //         ctx.json({ status: false }),
    //     )
    // }),
]
