import Highcharts from 'highcharts'

const windspeed = {
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
                color: Highcharts.theme.colors[12]
            }
        },
        labels: {
            format: '{value} м/с',
            style: {
                color: Highcharts.theme.colors[12]
            }
        },
    }],
    series: [{
        name: 'Скорость ветра',
        type: 'column',
        pointWidth: 4,
        borderWidth: 0.4,
        // data: data.ws,
        color: Highcharts.theme.colors[12],
        tooltip: {
            valueSuffix: ' м/с'
        }
    }]
}

export default windspeed