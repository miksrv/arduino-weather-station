import React, { Component } from 'react'
import { Grid } from 'semantic-ui-react'

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMore from 'highcharts/highcharts-more'

import chart_config from '../data/chart_config'

HighchartsMore(Highcharts)

Highcharts.setOptions(Highcharts.theme = chart_config)

class ShortStats extends Component {

  state = {
    chartTempHumd: {
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
          format: '{value}°C',
          style: {
            color: Highcharts.theme.colors[7]
          }
        },
        title: {
          text: '', // Температура
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
        max: 90,
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
      }]
    },
    chartLuxPress: {
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
    },
    chartWindSpeed: {
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
            color: Highcharts.theme.colors[12]
          }
        },
        labels: {
          format: '{value} м/с',
          style: {
            color: Highcharts.theme.colors[12]
          }
        },
      }],
      series: [{
        name: 'Скорость ветра',
        type: 'column',
        pointWidth: 4,
        borderWidth: 0.4,
        // data: data.ws,
        color: Highcharts.theme.colors[12],
        tooltip: {
          valueSuffix: ' м/с'
        }
      }]
    },
    chartKIndex: {
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
    },
    // chartWindRose: {
    //   chart: {
    //     polar: true,
    //     type: 'column'
    //   },
    //   pane: {
    //     size: '90%'
    //   },
    //   legend: {
    //     x: 10,
    //   },
    //   xAxis: {
    //     tickInterval: 45,
    //     min: 0,
    //     max: 360,
    //     labels: {
    //       format: '{value}°',
    //       style: {
    //       }
    //     }
    //   },
    //   yAxis: {
    //     min: 0,
    //     endOnTick: false,
    //     showLastLabel: true,
    //     title: {
    //       text: ''
    //     },
    //     labels: {
    //       formatter: function () {
    //         return this.value + '%';
    //       }
    //     },
    //     reversedStacks: false
    //   },
    //   tooltip: {
    //     valueSuffix: '%',
    //     followPointer: true
    //   },
    //   plotOptions: {
    //     series: {
    //       stacking: 'normal',
    //       shadow: false,
    //       groupPadding: 0,
    //       pointPlacement: 'on'
    //     }
    //   },
    // }
  }

  componentDidMount() {
    this.handleUpdateCharts()
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.data !== prevProps.data) {
      this.handleUpdateCharts()
    }
  }

  handleUpdateCharts() {
    const { storeStatistic, storeKIndex } = this.props

    this.setState({
      chartTempHumd: {
        ...this.state.chartTempHumd,
        series: [
          { data: storeStatistic.data.h },
          { data: storeStatistic.data.t2 }
        ]
      },
      chartLuxPress: {
        series: [
          { data: storeStatistic.data.lux },
          { data: storeStatistic.data.uv },
          { data: storeStatistic.data.p }
        ]
      },
      chartWindSpeed: {
        series: [
          { data: storeStatistic.data.ws }
        ]
      },
      chartKIndex: {
        series: [
          { data: storeKIndex.data }
        ]
      },
      // chartWindRose: {
      //   series: [{
      //     "name": "&lt; 1 м/с",
      //     "data": storeStatistic.data.wr[0],
      //     "_colorIndex": 0
      //   }, {
      //     "name": "1-3 м/с",
      //     "data": storeStatistic.data.wr[1],
      //     "_colorIndex": 1
      //   }, {
      //     "name": "3-5 м/с",
      //     "data": storeStatistic.data.wr[2],
      //     "_colorIndex": 2
      //   }, {
      //     "name": "5-7 м/с",
      //     "data": storeStatistic.data.wr[3],
      //     "_colorIndex": 3
      //   }, {
      //     "name": "7-9 м/с",
      //     "data": storeStatistic.data.wr[4],
      //     "_colorIndex": 4
      //   }, {
      //     "name": "&gt; 9 м/с",
      //     "data": storeStatistic.data.wr[5],
      //     "_colorIndex": 5
      //   }]
      // }
    })
  }

  render() {
    const { chartTempHumd, chartLuxPress, chartWindSpeed, chartKIndex } = this.state // chartWindRose

    return (
        <section className='chart'>
          <Grid>
            {/*<Grid.Column computer={8} tablet={16} mobile={16} className='chart-container'>*/}
            {/*  <HighchartsReact*/}
            {/*      highcharts={Highcharts}*/}
            {/*      options={chartTempHumd}*/}
            {/*  />*/}
            {/*</Grid.Column>*/}
            <Grid.Column computer={8} tablet={16} mobile={16} className='chart-container'>
              {/*<HighchartsReact*/}
              {/*    highcharts={Highcharts}*/}
              {/*    options={chartWindSpeed}*/}
              {/*/>*/}
            </Grid.Column>
          </Grid>
          <Grid>
            {/*<Grid.Column computer={10} tablet={8} mobile={16} className='chart-container'>*/}
            {/*  <HighchartsReact*/}
            {/*      highcharts={Highcharts}*/}
            {/*      options={chartLuxPress}*/}
            {/*  />*/}
            {/*</Grid.Column>*/}
            <Grid.Column computer={6} tablet={8} mobile={16} className='chart-container'>
              {/*<HighchartsReact*/}
              {/*    highcharts={Highcharts}*/}
              {/*    options={chartKIndex}*/}
              {/*/>*/}

              {/*<HighchartsReact*/}
              {/*    highcharts={Highcharts}*/}
              {/*    options={chartWindRose}*/}
              {/*/>*/}
            </Grid.Column>
          </Grid>
        </section>
    )
  }
}

export default ShortStats