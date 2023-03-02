import translate from 'functions/translate'

const lang = translate().heatmap

const heatmap = {
    boost: {
        useGPUTranslations: true
    },

    chart: {
        height: 500,
        marginTop: 70,
        type: 'heatmap'
    },

    colorAxis: {
        endOnTick: false,
        labels: {
            format: '{value}℃'
        },
        max: 43,
        min: -35,
        startOnTick: false,
        stops: [
            [0, '#0625cf'],
            [0.2, '#3751dc'],
            [0.3, '#08B8F4'],
            [0.5, '#fffbbc'],
            [0.7, '#e6a241'],
            [0.8, '#d87040'],
            [1, '#B22222']
        ]
    },

    legend: {
        align: 'right',
        floating: false,
        layout: 'horizontal',
        verticalAlign: 'top',
        x: 0,
        y: -65
    },

    series: [
        {
            boostThreshold: 100,
            borderWidth: 0,
            colsize: 24 * 36e5, // one day
            data: [],
            nullColor: '#4e4e4e',
            tooltip: {
                headerFormat: lang.legend + '<br/>',
                pointFormat:
                    '{point.x:%e %b, %Y} {point.y}:00: <b>{point.value}</b> ℃'
            },
            turboThreshold: Number.MAX_VALUE // #3404, remove after 4.0.5 release
        }
    ],

    subtitle: {
        align: 'left',
        text: '',
        x: 40,
        y: 40
    },

    title: {
        align: 'left',
        text: lang.title,
        x: 40,
        y: 20
    },

    xAxis: {
        // min: Date.UTC(2021, 6, 23),
        // max: Date.UTC(2021, 6, 25),
        labels: {
            align: 'left',
            format: '{value:%B}', // long month
            x: 5,
            y: 14
        },
        showLastLabel: false,
        tickLength: 16,
        type: 'datetime'
    },

    yAxis: {
        endOnTick: false,
        labels: {
            format: '{value}:00'
        },
        max: 23,
        maxPadding: 0,
        min: 0,
        minPadding: 0,
        reversed: true,
        startOnTick: false,
        tickPositions: [0, 6, 12, 18, 24],
        tickWidth: 1,
        title: {
            text: null
        }
    }
}

export default heatmap
