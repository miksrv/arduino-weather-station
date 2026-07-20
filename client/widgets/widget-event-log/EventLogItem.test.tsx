import React from 'react'

import { render, screen } from '@testing-library/react'

import EventLogItem from './EventLogItem'

import '@testing-library/jest-dom'

jest.mock('@/tools/date', () => ({
    formatDate: (date: string, fmt: string) => (fmt === 'HH:mm' ? date.slice(11, 16) : date)
}))
jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => {
            const dictionary: Record<string, string> = {
                'event-temperature-up': 'Температура выросла на {{value}} °C',
                'event-system-ok': 'Данные успешно обновлены со всех датчиков'
            }
            const template = dictionary[key] ?? key

            return options
                ? Object.entries(options).reduce((str, [k, v]) => str.replace(`{{${k}}}`, String(v)), template)
                : template
        }
    })
}))

describe('EventLogItem', () => {
    it('renders the formatted timestamp', () => {
        render(
            <EventLogItem
                event={{ date: '2024-01-01T15:42:00Z', type: 'temperature_change', direction: 'up', value: 0.6 }}
            />
        )
        expect(screen.getByText('15:42')).toBeInTheDocument()
    })

    it('renders the composed message', () => {
        render(
            <EventLogItem
                event={{ date: '2024-01-01T15:42:00Z', type: 'temperature_change', direction: 'up', value: 0.6 }}
            />
        )
        expect(screen.getByText('Температура выросла на 0.6 °C')).toBeInTheDocument()
    })

    it('renders a system status event', () => {
        render(<EventLogItem event={{ date: '2024-01-01T15:33:00Z', type: 'system_status', status: 'ok' }} />)
        expect(screen.getByText('Данные успешно обновлены со всех датчиков')).toBeInTheDocument()
    })
})
