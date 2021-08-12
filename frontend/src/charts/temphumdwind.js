import Highcharts from 'highcharts'
import _config from './_config'

Highcharts.setOptions(Highcharts.theme = _config)

const temphumdwind = {
    chart: {
        height: 350,
        // events: {
        //   load: function () {
        //     // set up the updating of the chart each second
        //     let series = this.series
        //     let getRandomInt = (min, max) => {
        //       min = Math.ceil(min)
        //       max = Math.floor(max)
        //       return Math.floor(Math.random() * (max - min)) + min
        //     }
        //
        //
        //     setInterval(function () {
        //       let time = new Date().getTime()
        //
        //       series[0].addPoint([time, getRandomInt(30, 70)], true, true) // H
        //       series[1].addPoint([time, getRandomInt(-10, 30)], true, true) // T2
        //       series[2].addPoint([time, getRandomInt(1, 10)], true, true) // DP
        //       series[3].addPoint([time, getRandomInt(0, 10)], true, true) // WS
        //     }, 1000)
        //   }
        // }
    },
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
            format: '{value}°C',  // Температура
            style: {
                color: Highcharts.theme.colors[7]
            }
        },
        title: {
            text: '',
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
        max: 90
    }, {
        gridLineWidth: 0,
        title: {
            text: '', // Скорость ветра
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
        opposite: true,
        min: 0,
        max: 15
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
    }, {
        name: 'Точка росы',
        type: 'spline',
        yAxis: 0,
        // data: data.temp1,
        color: Highcharts.theme.colors[8],
        tooltip: {
            valueSuffix: ' °C'
        }
    }, {
        name: 'Скорость ветра',
        type: 'column',
        yAxis: 2,
        pointWidth: 4,
        borderWidth: 0.4,
        // data: data.ws,
        color: Highcharts.theme.colors[12],
        tooltip: {
            valueSuffix: ' м/с'
        }
    }]
}

export default temphumdwind