import colors from './colors'

const wind_speed = {
    xAxis: [{
        type: 'datetime',
        dateTimeLabelFormats: {
            month: '%e %b, %Y',
            year: '%b'
        },
        gridLineWidth: 1
    }],
    yAxis: [{
        gridLineWidth: 1,
        title: {
            text: '',
            style: {
                color: colors[12]
            }
        },
        labels: {
            format: '{value} м/с',
            style: {
                color: colors[12]
            }
        },
    }],
    series: [{
        name: 'Скорость ветра',
        type: 'column',
        pointWidth: 4,
        borderWidth: 0.4,
        // data: data.ws,
        color: colors[12],
        tooltip: {
            valueSuffix: ' м/с'
        }
    }]
}

export default wind_speed
