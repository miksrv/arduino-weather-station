import Highcharts from 'highcharts'
import windDirection from '../data/functions'

const winddir = {
    chart: {
        polar: true
    },
    pane: {
        startAngle: 0,
        endAngle: 360
    },
    legend: {
        x: 10
    },
    xAxis: {
        tickInterval: 45,
        min: 0,
        max: 360,
        labels: {
            format: '{value}°',
            style: {
                //color: Highcharts.theme.colors[3]
            }
        }
    },
    plotOptions: {
        series: {
            pointStart: 0,
            pointInterval: 45
        },
        column: {
            pointPadding: 0,
            groupPadding: 0
        }
    },
    tooltip: {
        formatter: function() {
            return windDirection(this.x)
        }
    },
    series: [{
        type: 'area',
        name: 'Роза ветров',
        color: Highcharts.theme.colors[3],
        tooltip: {
            valueSuffix: ''
        }
    }]
}

export default winddir