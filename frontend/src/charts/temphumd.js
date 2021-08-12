import Highcharts from 'highcharts'

const temphumd = {
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
                color: Highcharts.theme.colors[7]
            }
        },
        title: {
            text: '', // Температура
            style: {
                color: Highcharts.theme.colors[7]
            }
        },
        opposite: false,
    }, {
        gridLineWidth: 0,
        title: {
            text: '', // Влажность
            style: {
                color: Highcharts.theme.colors[6]
            }
        },
        labels: {
            format: '{value} %',
            style: {
                color: Highcharts.theme.colors[6]
            }
        },
        opposite: true,
        min: 0,
        max: 90,
    }],
    series: [{
        name: 'Влажность',
        type: 'area',
        yAxis: 1,
        color: Highcharts.theme.colors[6],
        // data: data.humd,
        tooltip: {
            valueSuffix: ' %'
        }
    }, {
        name: 'Температура',
        type: 'spline',
        yAxis: 0,
        // data: data.temp1,
        color: Highcharts.theme.colors[7],
        tooltip: {
            valueSuffix: ' °C'
        }
    }]
}

export default temphumd