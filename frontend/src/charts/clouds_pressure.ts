import translate from '../functions/translate'
import colors from './colors'

const lang = translate().statistic

const clouds_pressure = {
    xAxis: [{
        type: 'datetime',
        dateTimeLabelFormats: {
            month: '%e %b, %Y',
            year: '%b'
        },
        gridLineWidth: 1
    }],
    yAxis: [{
        gridLineWidth: 0,
        title: {
            text: '', // Давление
        },
        labels: {
            format: '{value}',
            style: {
                color: colors[3]
            }
        },
        opposite: true,
    }, {
        labels: {
            format: '{value}%',
            style: {
                color: colors[8]
            }
        },
        title: {
            text: '', // Облачность
        },
        opposite: false,
        min: 0,
        max: 100,
    }, {
        labels: {
            format: '{value} мм',
            style: {
                color: colors[10]
            }
        },
        title: {
            text: '', // Осадки
        },
        opposite: true,
    }],
    series: [{
        name: lang.clouds,
        type: 'area',
        yAxis: 1,
        data: [],
        color: colors[8],
        tooltip: {
            valueSuffix: ' %'
        }
    }, {
        name: lang.precipitation,
        type: 'column',
        yAxis: 2,
        data: [],
        color: colors[10],
        tooltip: {
            valueSuffix: ' мм.'
        }
    }, {
        name: lang.pressure,
        type: 'spline',
        yAxis: 0,
        data: [],
        color: colors[3],
        tooltip: {
            valueSuffix: ' мм.рт.ст.'
        }
    }]
}

export default clouds_pressure
