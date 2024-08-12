import { Weather } from './weather'

import { DateTime } from '@/api/types'

export type Forecast = Weather & { date: DateTime }
