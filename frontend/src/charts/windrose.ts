const windrose = {
    chart: {
        height: 300,
        polar: true,
        type: 'column'
    },
    legend: {
        x: 10,
        y: 8
    },
    pane: {
        size: '85%'
    },
    plotOptions: {
        series: {
            groupPadding: 0,
            pointPlacement: 'on',
            shadow: false,
            stacking: 'normal'
        }
    },
    series: [
        { _colorIndex: 6, name: '&lt; 1 м/с' },
        { _colorIndex: 5, name: '1-3 м/с' },
        { _colorIndex: 4, name: '3-5 м/с' },
        { _colorIndex: 3, name: '5-7 м/с' },
        { _colorIndex: 2, name: '7-9 м/с' },
        { _colorIndex: 1, name: '9-11 м/с' },
        { _colorIndex: 0, name: '&gt; 11 м/с' }
        // { name: '&lt; 1 м/с', _colorIndex: 0 },
        // { name: '1-3 м/с', _colorIndex: 1 },
        // { name: '3-5 м/с', _colorIndex: 2 },
        // { name: '5-7 м/с', _colorIndex: 3 },
        // { name: '7-9 м/с', _colorIndex: 4 },
        // { name: '&gt; 9 м/с', _colorIndex: 5 }
    ],
    tooltip: {
        followPointer: true,
        headerFormat: 'Direction: <b>{point.key}°</b><br/>',
        valueSuffix: '%'
    },
    xAxis: {
        // min: 0,
        // max: 360,
        labels: {
            format: '{value}°'
        },
        tickInterval: 45,
        tickmarkPlacement: 'on'
    },
    yAxis: {
        // min: 0,
        endOnTick: false,
        labels: {
            format: ' '
            // formatter: function () {
            //     return this.value + '%';
            // }
        },
        reversedStacks: false,
        showLastLabel: true,
        title: {
            text: ''
        }
    }
}

export default windrose
