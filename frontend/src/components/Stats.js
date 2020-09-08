import React, { Component } from 'react'
import { Container, Grid, Button } from 'semantic-ui-react'

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMore from 'highcharts/highcharts-more'

import chart_config from '../data/chart_config'

HighchartsMore(Highcharts)

Highcharts.setOptions(Highcharts.theme = chart_config);

class Stats extends Component {

  state = {
    liveUpdate: true,
    chart1_Options: {
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
          max: 10,
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

    chart2_Options: {
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

    chart3_Options: {
      chart: {
        polar: true
      },

      title: {
        //text: 'Highcharts Polar Chart'
      },

      subtitle: {
        //text: 'Also known as Radar Chart'
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

      // yAxis: {
      //   min: 0
      // },

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
          var tooltip = '111';

          if (this.x == '0') {
            return 'Север';
          } else if (this.x == '45') {
            return 'Северо-восток';
          } else if (this.x == '90') {
            return 'Восток';
          } else if (this.x == '135') {
            return 'Юго-восток';
          } else if (this.x == '180') {
            return 'Юг';
          } else if (this.x == '225') {
            return 'Юго-запад';
          } else if (this.x == '270') {
            return 'Запад';
          } else {
            return 'Северо-запад';
          }

          return tooltip;
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
      chart1_Options: {
        ...this.state.chart1_Options,
        series: [
          { data: data.sensors.h },
          { data: data.sensors.t2 },
          { data: data.sensors.dp },
          { data: data.sensors.ws }
        ]
      },
      chart2_Options: {
        series: [
          { data: data.sensors.lux },
          { data: data.sensors.uv },
          { data: data.sensors.p }
        ]
      },
      chart3_Options: {
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
    const { chart1_Options, chart2_Options, chart3_Options } = this.state

    return (
        <Container className='main-content'>
          <div className='toolBar'>
            <Button.Group size='mini'>
              <Button onClick={() => this.setPeriodHandler('today')}>Сегодня</Button>
              <Button onClick={() => this.setPeriodHandler('yesterday')}>Вчера</Button>
              <Button onClick={() => this.setPeriodHandler('week')}>Неделя</Button>
              <Button onClick={() => this.setPeriodHandler('month')}>Месяц</Button>
            </Button.Group>
          </div>
          <HighchartsReact
              highcharts={Highcharts}
              options={chart1_Options}
          />
          <br />
          <HighchartsReact
              highcharts={Highcharts}
              options={chart2_Options}
          />
          <br />
          <Grid>
            <Grid.Row>
              <Grid.Column computer={8} tablet={8} mobile={16}>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={chart3_Options}
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Container>
    )
  }
}

export default Stats