import Highcharts from 'highcharts/highmaps'

import colors from './colors'

const config: Highcharts.Options = {
    chart: {
        backgroundColor: '#373737',
        // backgroundColor: {
        //   linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
        //   stops: [
        //     [0, '#2a2a2b'],
        //     [1, '#3e3e40']
        //   ]
        // },
        borderRadius: 5,
        height: 300,
        marginTop: 30,
        plotBorderColor: '#373737',
        shadow: false,
        style: {
            // fontFamily: '\'Unica One\', sans-serif'
        }
    },
    colors: colors,
    credits: {
        enabled: false,
        style: {
            color: '#666'
        }
    },
    // labels: {
    //     style: {
    //         color: '#707073'
    //     }
    // },
    drilldown: {
        activeAxisLabelStyle: {
            color: '#F0F0F3'
        },
        activeDataLabelStyle: {
            color: '#F0F0F3'
        }
    },
    lang: {
        loading: 'Загрузка...',
        months: [
            'Январь',
            'Февраль',
            'Март',
            'Апрель',
            'Май',
            'Июнь',
            'Июль',
            'Август',
            'Сентябрь',
            'Октябрь',
            'Ноябрь',
            'Декабрь'
        ],
        shortMonths: [
            'Янв',
            'Фев',
            'Март',
            'Апр',
            'Май',
            'Июнь',
            'Июль',
            'Авг',
            'Сент',
            'Окт',
            'Нояб',
            'Дек'
        ],
        weekdays: [
            'Воскресенье',
            'Понедельник',
            'Вторник',
            'Среда',
            'Четверг',
            'Пятница',
            'Суббота'
        ]
        // exportButtonTitle: "Экспорт",
        // printButtonTitle: "Печать",
        // rangeSelectorFrom: "С",
        // rangeSelectorTo: "По",
        // rangeSelectorZoom: "Период",
        // downloadPNG: 'Скачать PNG',
        // downloadJPEG: 'Скачать JPEG',
        // downloadPDF: 'Скачать PDF',
        // downloadSVG: 'Скачать SVG',
        // printChart: 'Напечатать график'
    },
    legend: {
        align: 'left',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        floating: true,
        itemHiddenStyle: {
            color: '#606063'
        },
        itemHoverStyle: {
            color: '#FFF'
        },
        itemStyle: {
            color: '#E0E0E3',
            fontSize: '11px',
            fontWeight: '400'
        },
        layout: 'vertical',
        title: {
            style: {
                color: '#C0C0C0'
            }
        },
        verticalAlign: 'top',
        x: 50,
        y: 8
    },
    navigation: {
        buttonOptions: {
            // symbolStroke: '#DDDDDD',
            theme: {
                fill: '#505053'
            }
        }
    },
    navigator: {
        handles: {
            backgroundColor: '#666',
            borderColor: '#AAA'
        },
        maskFill: 'rgba(255,255,255,0.1)',
        outlineColor: '#CCC',
        series: {
            color: '#7798BF',
            lineColor: '#A6C7ED'
        },
        xAxis: {
            gridLineColor: '#505053'
        }
    },
    plotOptions: {
        boxplot: {
            fillColor: '#505053'
        },
        candlestick: {
            lineColor: 'white'
        },
        errorbar: {
            color: 'white'
        },
        series: {
            dataLabels: {
                color: '#F0F0F3',
                style: {
                    fontSize: '13px'
                }
            },
            marker: {
                lineColor: '#333'
            }
        }
    },
    // scroll charts
    rangeSelector: {
        buttonTheme: {
            fill: '#505053',
            states: {
                hover: {
                    fill: '#707073',
                    stroke: '#000000',
                    style: {
                        color: 'white'
                    }
                },
                select: {
                    fill: '#000003',
                    stroke: '#000000',
                    style: {
                        color: 'white'
                    }
                }
            },
            stroke: '#000000',
            style: {
                color: '#CCC'
            }
        },
        inputBoxBorderColor: '#505053',
        inputStyle: {
            backgroundColor: '#333',
            color: 'silver'
        },
        labelStyle: {
            color: 'silver'
        }
    },
    scrollbar: {
        barBackgroundColor: '#808083',
        barBorderColor: '#808083',
        buttonArrowColor: '#CCC',
        buttonBackgroundColor: '#606063',
        buttonBorderColor: '#606063',
        rifleColor: '#FFF',
        trackBackgroundColor: '#404043',
        trackBorderColor: '#404043'
    },
    subtitle: {
        style: {
            color: '#E0E0E3',
            textTransform: 'uppercase'
        }
    },
    title: {
        style: {
            color: '#E0E0E3',
            fontSize: '20px',
            textTransform: 'uppercase'
        },
        text: ''
    },
    tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        shared: true,
        style: {
            color: '#F0F0F0',
            fontSize: '11px'
        },
        xDateFormat: '%A, %d %B %Y, %H:%M'
    },
    xAxis: {
        gridLineColor: '#707073',
        labels: {
            style: {
                color: '#E0E0E3'
            }
        },
        lineColor: '#707073',
        minorGridLineColor: '#505053',
        tickColor: '#707073',
        title: {
            style: {
                color: '#A0A0A3'
            }
        }
    },
    yAxis: {
        gridLineColor: '#707073',
        labels: {
            style: {
                color: '#E0E0E3'
            }
        },
        lineColor: '#707073',
        minorGridLineColor: '#505053',
        tickColor: '#707073',
        tickWidth: 1,
        title: {
            style: {
                color: '#A0A0A3'
            }
        }
    }
}

export default config
