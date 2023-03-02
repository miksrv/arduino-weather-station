import colors from './colors'

const wind_speed = {
    series: [
        {
            borderWidth: 0.4,
            color: colors[12],
            name: 'Скорость ветра',
            pointWidth: 4,
            tooltip: {
                valueSuffix: ' м/с'
            },
            type: 'column',
            yAxis: 0
        },
        {
            color: colors[8],
            marker: {
                radius: 2
            },
            name: 'Направление',
            tooltip: {
                valueSuffix: ' °'
            },
            type: 'line',
            yAxis: 1
        }
    ],
    tooltip: {
        shared: true
    },
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
            gridLineWidth: 1,
            labels: {
                format: '{value} м/с',
                style: {
                    color: colors[12]
                }
            },
            opposite: false,
            title: {
                style: {
                    color: colors[12]
                },
                text: ''
            }
        },
        {
            labels: {
                format: '{value} °',
                style: {
                    color: colors[8]
                }
            },
            opposite: true,
            title: {
                style: {
                    color: colors[8]
                },
                text: ''
            }
        }
    ]
}

export default wind_speed
