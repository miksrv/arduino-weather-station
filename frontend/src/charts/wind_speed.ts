import colors from './colors'

const wind_speed = {
    xAxis: [{
        type: 'datetime',
        dateTimeLabelFormats: {
            month: '%e %b, %Y',
            year: '%b'
        },
        gridLineWidth: 1,
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
        opposite: false,
    }, {
        title: {
            text: '',
            style: {
                color: colors[8]
            }
        },
        labels: {
            format: '{value} °',
            style: {
                color: colors[8]
            }
        },
        opposite: true,
    }],
    series: [{
        yAxis: 0,
        name: 'Скорость ветра',
        type: 'column',
        pointWidth: 4,
        borderWidth: 0.4,
        color: colors[12],
        tooltip: {
            valueSuffix: ' м/с'
        }
    }, {
        yAxis: 1,
        name: 'Направление',
        type: 'line',
        marker: {
            radius: 2,
        },
        color: colors[8],
        tooltip: {
            valueSuffix: ' °'
        }
    }],
    tooltip: {
        shared: true,
    },
}

export default wind_speed
