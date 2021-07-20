const chart_windrose = {
    chart: {
        polar: true,
        type: 'column'
    },
    pane: {
        size: '90%'
    },
    legend: {
        x: 10,
    },
    xAxis: {
        tickInterval: 45,
        min: 0,
        max: 360,
        labels: {
            format: '{value}°',
            style: {
            }
        }
    },
    yAxis: {
        min: 0,
        endOnTick: false,
        showLastLabel: true,
        title: {
            text: ''
        },
        labels: {
            formatter: function () {
                return this.value + '%';
            }
        },
        reversedStacks: false
    },
    tooltip: {
        valueSuffix: '%',
        followPointer: true
    },
    plotOptions: {
        series: {
            stacking: 'normal',
            shadow: false,
            groupPadding: 0,
            pointPlacement: 'on'
        }
    },
    series: [
        { name: '&lt; 1 м/с', _colorIndex: 0 },
        { name: '1-3 м/с', _colorIndex: 1 },
        { name: '3-5 м/с', _colorIndex: 2 },
        { name: '5-7 м/с', _colorIndex: 3 },
        { name: '7-9 м/с', _colorIndex: 4 },
        { name: '&gt; 9 м/с', _colorIndex: 5 }
    ]
}

export default chart_windrose