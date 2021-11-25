import translate from '../functions/translate'

const lang = translate().heatmap

const heatmap = {
    chart: {
        type: 'heatmap',
        height: 500,
        marginTop: 70,
    },

    boost: {
        useGPUTranslations: true
    },

    title: {
        text: lang.title,
        align: 'left',
        x: 40,
        y: 20
    },

    subtitle: {
        text: '',
        align: 'left',
        x: 40,
        y: 40
    },

    xAxis: {
        type: 'datetime',
        // min: Date.UTC(2021, 6, 23),
        // max: Date.UTC(2021, 6, 25),
        labels: {
            align: 'left',
            x: 5,
            y: 14,
            format: '{value:%B}' // long month
        },
        showLastLabel: false,
        tickLength: 16
    },

    yAxis: {
        title: {
            text: null
        },
        labels: {
            format: '{value}:00'
        },
        minPadding: 0,
        maxPadding: 0,
        startOnTick: false,
        endOnTick: false,
        tickPositions: [0, 6, 12, 18, 24],
        tickWidth: 1,
        min: 0,
        max: 23,
        reversed: true
    },

    colorAxis: {
        stops: [
            [0, '#0625cf'],
            [0.2, '#3751dc'],
            [0.3, '#08B8F4'],
            [0.5, '#fffbbc'],
            [0.7, '#e6a241'],
            [0.8, '#d87040'],
            [1, '#B22222']
        ],
        min: -35,
        max: 43,
        startOnTick: false,
        endOnTick: false,
        labels: {
            format: '{value}℃'
        }
    },

    legend: {
        layout: 'horizontal',
        align: 'right',
        verticalAlign: 'top',
        floating: false,
        x: 0,
        y: -65
    },

    series: [{
        boostThreshold: 100,
        borderWidth: 0,
        nullColor: '#4e4e4e',
        colsize: 24 * 36e5, // one day
        tooltip: {
            headerFormat: lang.legend + '<br/>',
            pointFormat: '{point.x:%e %b, %Y} {point.y}:00: <b>{point.value}</b> ℃'
        },
        data: [],
        turboThreshold: Number.MAX_VALUE // #3404, remove after 4.0.5 release
    }]
}

export default heatmap
