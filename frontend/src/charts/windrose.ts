const windrose = {
    chart: {
        polar: true,
        type: 'column',
        height: 300,
    },
    pane: {
        size: '85%'
    },
    legend: {
        // x: 10,
    },
    xAxis: {
        tickInterval: 45,
        tickmarkPlacement: 'on',
        // min: 0,
        // max: 360,
        labels: {
            format: '{value}°',
        }
    },
    yAxis: {
        // min: 0,
        endOnTick: false,
        showLastLabel: true,
        title: {
            text: ''
        },
        labels: {
            format: ' ',
            // formatter: function () {
            //     return this.value + '%';
            // }
        },
        reversedStacks: false
    },
    tooltip: {
        headerFormat: 'Direction: <b>{point.key}°</b><br/>',
        valueSuffix: '%',
        followPointer: true
    },
    plotOptions: {
        series: {
            stacking: 'normal',
            shadow: false,
            pointPlacement: 'on',
            groupPadding: 0,
        }
    },
    series: [
        { name: '&lt; 1 м/с', _colorIndex: 7 },
        { name: '1-3 м/с', _colorIndex: 5 },
        { name: '3-5 м/с', _colorIndex: 4 },
        { name: '5-7 м/с', _colorIndex: 3 },
        { name: '7-9 м/с', _colorIndex: 2 },
        { name: '9-11 м/с', _colorIndex: 1 },
        { name: '&gt; 11 м/с', _colorIndex: 0 }
        // { name: '&lt; 1 м/с', _colorIndex: 0 },
        // { name: '1-3 м/с', _colorIndex: 1 },
        // { name: '3-5 м/с', _colorIndex: 2 },
        // { name: '5-7 м/с', _colorIndex: 3 },
        // { name: '7-9 м/с', _colorIndex: 4 },
        // { name: '&gt; 9 м/с', _colorIndex: 5 }
    ]
}

export default windrose