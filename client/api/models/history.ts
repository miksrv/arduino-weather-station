import { Weather } from './weather'

import { DateTime } from '@/api/types'

export type History = Weather & {date: DateTime};
