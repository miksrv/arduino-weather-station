import translate from 'functions/translate'

import colors from './colors'

const lang = translate().statistic

const humidity_temperature = {
    series: [
        {
            color: colors[9],
            data: [],
            name: lang.humidity,
            tooltip: {
                valueSuffix: ' %'
            },
            type: 'area',
            yAxis: 1
        },
        {
            color: colors[1],
            data: [],
            name: lang.temperature,
            tooltip: {
                valueSuffix: ' °C'
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
            labels: {
                format: '{value}°C',
                style: {
                    color: colors[1]
                }
            },
            opposite: false,
            title: {
                text: '' // Температура
            }
        },
        {
            gridLineWidth: 0,
            labels: {
                format: '{value} %',
                style: {
                    color: colors[9]
                }
            },
            max: 90,
            min: 0,
            opposite: true,
            title: {
                text: '' // Влажность
            }
        }
    ]
}

export default humidity_temperature
