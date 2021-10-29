import { rest } from 'msw'

import currentData from './rest/current'
import forecastData from './rest/forecast'
import sensorsListData from './rest/sensors'

export const handlers = [
    rest.get('**/get/current', (req, res, ctx) =>
        res(
            ctx.delay(1500),
            ctx.status(202, 'Mocked status'),
            ctx.json(currentData),
        )
    ),

    rest.get('**/get/forecast', (req, res, ctx) =>
        res(
            ctx.delay(1500),
            ctx.status(202, 'Mocked status'),
            ctx.json(forecastData),
        )
    ),

    rest.get('**/get/sensors', (req, res, ctx) =>
        res(
            ctx.delay(1500),
            ctx.status(202, 'Mocked status'),
            ctx.json(sensorsListData),
        )
    ),
]