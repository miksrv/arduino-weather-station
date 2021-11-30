import translate from '../functions/translate'
import colors from './colors'

const lang = translate().statistic

const humidity_temperature = {
    xAxis: [{
        type: 'datetime',
        dateTimeLabelFormats: {
            month: '%e %b, %Y',
            year: '%b'
        },
        gridLineWidth: 1
    }],
    yAxis: [{
        labels: {
            format: '{value}°C',
            style: {
                color: colors[1]
            }
        },
        title: {
            text: '', // Температура
        },
        opposite: false,
    }, {
        gridLineWidth: 0,
        title: {
            text: '', // Влажность
        },
        labels: {
            format: '{value} %',
            style: {
                color: colors[9]
            }
        },
        opposite: true,
        min: 0,
        max: 90,
    }],
    series: [{
        name: lang.humidity,
        type: 'area',
        yAxis: 1,
        data: [],
        color: colors[9],
        tooltip: {
            valueSuffix: ' %'
        }
    }, {
        name: lang.temperature,
        type: 'spline',
        yAxis: 0,
        data: [],
        color: colors[1],
        tooltip: {
            valueSuffix: ' °C'
        }
    }]
}

export default humidity_temperature
