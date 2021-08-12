import Highcharts from 'highcharts'

const luxpress = {
    xAxis: [{
        type: 'datetime',
        dateTimeLabelFormats: {
            month: '%e %b, %Y',
            year: '%b'
        },
        //tickInterval: 3600 * 1000 * 2,
        gridLineWidth: 1
    }],
    yAxis: [{
        labels: {
            style: {
                color: Highcharts.theme.colors[9]
            }
        },
        title: {
            text: '', // Освещенность (lux)
            style: {
                color: Highcharts.theme.colors[9]
            }
        },
        opposite: false,
    }, {
        gridLineWidth: 0,
        title: {
            text: '', // UV (мВт/см^2)
            style: {
                color: Highcharts.theme.colors[11]
            }
        },
        labels: {
            style: {
                color: Highcharts.theme.colors[11]
            }
        },
        opposite: true,
    }, {
        gridLineWidth: 0,
        title: {
            text: '', // Атмосферное давление (мм.рт.ст.)
            style: {
                color: Highcharts.theme.colors[10]
            }
        },
        labels: {
            style: {
                color: Highcharts.theme.colors[10]
            }
        },
        opposite: true,
    }],
    series: [{
        name: 'Освещенность',
        type: 'area',
        yAxis: 0,
        // data: data.light,
        color: Highcharts.theme.colors[9],
        tooltip: {
            valueSuffix: ' lux'
        }
    }, {
        name: 'UV',
        type: 'spline',
        yAxis: 1,
        // data: data.uv,
        color: Highcharts.theme.colors[11],
        marker: {
            enabled: false
        },
        tooltip: {
            valueSuffix: ' мВт/см^2'
        }

    }, {
        name: 'Давление',
        type: 'spline',
        yAxis: 2,
        // data: data.press,
        color: Highcharts.theme.colors[10],
        marker: {
            enabled: false
        },
        tooltip: {
            valueSuffix: ' мм.рт.ст.'
        }

    }]
}

export default luxpress