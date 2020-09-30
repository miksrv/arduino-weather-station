import React, { Component } from 'react'
import { Grid } from 'semantic-ui-react'

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMore from 'highcharts/highcharts-more'

import chart_config from '../data/chart_config'

import windDirection from '../data/windDirection'

HighchartsMore(Highcharts)

Highcharts.setOptions(Highcharts.theme = chart_config)

class ShortStats extends Component {

  state = {
    chartTempHumd: {
      chart: {
        height: 350,
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
          format: '{value}°C',
          style: {
            color: Highcharts.theme.colors[7]
          }
        },
        title: {
          text: 'Температура',
          style: {
            color: Highcharts.theme.colors[7]
          }
        },
        opposite: false,
      }, {
        gridLineWidth: 0,
        title: {
          text: 'Влажность',
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
      }, {
        gridLineWidth: 0,
        title: {
          text: 'Скорость ветра',
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
        max: 15,
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
    },
    chartLuxPress: {
      chart: {
        height: 350,
      },
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
          text: 'Освещенность (lux)',
          style: {
            color: Highcharts.theme.colors[9]
          }
        },
        opposite: false,
      }, {
        gridLineWidth: 0,
        title: {
          text: 'UV (мВт/см^2)',
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
          text: 'Атмосферное давление (мм.рт.ст.)',
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
    chartWindDir: {
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
    },
    chartWindRose: {
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
    }
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
    const { data } = this.props

    this.setState({
      chartTempHumd: {
        ...this.state.chartTempHumd,
        series: [
          { data: data.sensors.h },
          { data: data.sensors.t2 },
          { data: data.sensors.dp },
          { data: data.sensors.ws }
        ]
      },
      chartLuxPress: {
        series: [
          { data: data.sensors.lux },
          { data: data.sensors.uv },
          { data: data.sensors.p }
        ]
      },
      chartWindDir: {
        series: [
          { data: data.sensors.wd }
        ]
      },
      chartWindRose: {
        series: [{
          "name": "&lt; 1 м/с",
          "data": data.sensors.wr[0],
          "_colorIndex": 0
        }, {
          "name": "1-3 м/с",
          "data": data.sensors.wr[1],
          "_colorIndex": 1
        }, {
          "name": "3-5 м/с",
          "data": data.sensors.wr[2],
          "_colorIndex": 2
        }, {
          "name": "5-7 м/с",
          "data": data.sensors.wr[3],
          "_colorIndex": 3
        }, {
          "name": "7-9 м/с",
          "data": data.sensors.wr[4],
          "_colorIndex": 4
        }, {
          "name": "&gt; 9 м/с",
          "data": data.sensors.wr[5],
          "_colorIndex": 5
        }]
      }
    })
  }

  setPeriodHandler = ( period ) => {
    this.props.onChangePeriod( period )
  }

  render() {
    const { chartTempHumd, chartLuxPress, chartWindDir, chartWindRose } = this.state

    return (
        <section className='chart'>
          <HighchartsReact
              highcharts={Highcharts}
              options={chartTempHumd}
          />
          <br />
          <HighchartsReact
              highcharts={Highcharts}
              options={chartLuxPress}
          />
          <br />
          <Grid>
            <Grid.Column computer={8} tablet={8} mobile={16} className='chart-container'>
              <HighchartsReact
                  highcharts={Highcharts}
                  options={chartWindDir}
              />
            </Grid.Column>
            <Grid.Column computer={8} tablet={8} mobile={16} className='chart-container'>
              <HighchartsReact
                  highcharts={Highcharts}
                  options={chartWindRose}
              />
            </Grid.Column>
          </Grid>
        </section>
    )
  }
}

export default ShortStats