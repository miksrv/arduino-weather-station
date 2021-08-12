import Highcharts from 'highcharts'

const kindex = {
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
                color: Highcharts.theme.colors[8]
            }
        },
        labels: {
            format: '{value}',
            style: {
                color: Highcharts.theme.colors[8]
            }
        },
    }],
    plotOptions: {
        series: {
            zones: [{
                value: 0,
                color: Highcharts.theme.kindex[0]
            }, {
                value: 1,
                color: Highcharts.theme.kindex[1]
            }, {
                value: 2,
                color: Highcharts.theme.kindex[2]
            }, {
                value: 3,
                color: Highcharts.theme.kindex[3]
            }, {
                value: 4,
                color: Highcharts.theme.kindex[4]
            }, {
                value: 5,
                color: Highcharts.theme.kindex[5]
            }, {
                value: 6,
                color: Highcharts.theme.kindex[6]
            }, {
                value: 7,
                color: Highcharts.theme.kindex[7]
            }, {
                value: 8,
                color: Highcharts.theme.kindex[8]
            }, {
                value: 9,
                color: Highcharts.theme.kindex[9]
            }, {
                value: 10,
                color: Highcharts.theme.kindex[10]
            }, {
                value: 11,
                color: Highcharts.theme.kindex[11]
            }],
        }
    },
    series: [{
        name: 'K-индекс',
        type: 'column',
        pointWidth: 2,
        borderWidth: 0,
        // data: data.ws,
        color: Highcharts.theme.colors[8],
    }]
}

export default kindex