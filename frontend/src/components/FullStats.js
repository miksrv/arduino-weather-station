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
            color: Highcharts.theme.colors[1]
          }
        },
        title: {
          text: 'Температура',
          style: {
            color: Highcharts.theme.colors[1]
          }
        },
        opposite: false,
      }, {
        gridLineWidth: 0,
        title: {
          text: 'Влажность',
          style: {
            color: Highcharts.theme.colors[0]
          }
        },
        labels: {
          format: '{value} %',
          style: {
            color: Highcharts.theme.colors[0]
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
            color: Highcharts.theme.colors[6]
          }
        },
        labels: {
          format: '{value} м/с',
          style: {
            color: Highcharts.theme.colors[6]
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
        color: Highcharts.theme.colors[0],
        // data: data.humd,
        tooltip: {
          valueSuffix: ' %'
        }
      }, {
        name: 'Температура',
        type: 'spline',
        yAxis: 0,
        // data: data.temp1,
        color: Highcharts.theme.colors[1],
        tooltip: {
          valueSuffix: ' °C'
        }
      }, {
        name: 'Точка росы',
        type: 'spline',
        yAxis: 0,
        // data: data.temp1,
        color: Highcharts.theme.colors[2],
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
        color: Highcharts.theme.colors[6],
        tooltip: {
          valueSuffix: ' м/с'
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
            color: Highcharts.theme.colors[3]
          }
        },
        title: {
          text: 'Освещенность (lux)',
          style: {
            color: Highcharts.theme.colors[3]
          }
        },
        opposite: false,
      }, {
        gridLineWidth: 0,
        title: {
          text: 'UV (мВт/см^2)',
          style: {
            color: Highcharts.theme.colors[5]
          }
        },
        labels: {
          style: {
            color: Highcharts.theme.colors[5]
          }
        },
        opposite: true,
      }, {
        gridLineWidth: 0,
        title: {
          text: 'Атмосферное давление (мм.рт.ст.)',
          style: {
            color: Highcharts.theme.colors[4]
          }
        },
        labels: {
          style: {
            color: Highcharts.theme.colors[4]
          }
        },
        opposite: true,
      }],
      series: [{
        name: 'Освещенность',
        type: 'area',
        yAxis: 0,
        // data: data.light,
        color: Highcharts.theme.colors[3],
        tooltip: {
          valueSuffix: ' lux'
        }
      }, {
        name: 'UV',
        type: 'spline',
        yAxis: 1,
        // data: data.uv,
        color: Highcharts.theme.colors[5],
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
        color: Highcharts.theme.colors[4],
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
      xAxis: {
        tickInterval: 45,
        min: 0,
        max: 360,
        labels: {
          format: '{value}°',
          style: {
            color: Highcharts.theme.colors[0]
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
        color: Highcharts.theme.colors[0],
        tooltip: {
          valueSuffix: ''
        }
      }]
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
      }
    })
  }

  setPeriodHandler = ( period ) => {
    this.props.onChangePeriod( period )
  }

  render() {
    const { chartTempHumd, chartLuxPress, chartWindDir } = this.state

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
          </Grid>
        </section>
    )
  }
}

export default ShortStats