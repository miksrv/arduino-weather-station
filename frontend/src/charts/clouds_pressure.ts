import translate from 'functions/translate'

import colors from './colors'

const lang = translate().statistic

const clouds_pressure = {
    series: [
        {
            color: colors[13],
            name: lang.clouds,
            tooltip: {
                valueSuffix: ' %'
            },
            type: 'area',
            yAxis: 1
        },
        {
            color: colors[10],
            name: lang.precipitation,
            tooltip: {
                valueSuffix: ' мм.'
            },
            type: 'column',
            yAxis: 2
        },
        {
            color: colors[4],
            name: lang.pressure,
            tooltip: {
                valueSuffix: ' мм.рт.ст.'
            },
            type: 'spline',
            yAxis: 0
        }
    ],
    xAxis: [
        {
            dateTimeLabelFormats: {
                month: '%e %b, %Y',
                year: '%b'
            },
            gridLineWidth: 1,
            type: 'datetime'
        }
    ],
    yAxis: [
        {
            gridLineWidth: 0,
            labels: {
                format: '{value}',
                style: {
                    color: colors[4]
                }
            },
            opposite: true,
            title: {
                text: '' // Давление
            }
        },
        {
            labels: {
                format: '{value}%',
                style: {
                    color: colors[13]
                }
            },
            max: 100,
            min: 0,
            opposite: false,
            title: {
                text: '' // Облачность
            }
        },
        {
            labels: {
                format: '{value} мм',
                style: {
                    color: colors[10]
                }
            },
            opposite: true,
            title: {
                text: '' // Осадки
            }
        }
    ]
}

export default clouds_pressure
