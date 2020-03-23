import React, { Component } from 'react'

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

import { Container } from 'semantic-ui-react'

import chart_config from '../data/chart_config'

Highcharts.setOptions(Highcharts.theme = chart_config);

class Stats extends Component {

  state = {
    liveUpdate: false,
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
            color: Highcharts.theme.colors[2]
          }
        },
        title: {
          text: 'Температура',
          style: {
            color: Highcharts.theme.colors[2]
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
      }],
      series: [{
        name: 'Влажность',
        type: 'area',
        yAxis: 1,
        // data: data.humd,
        tooltip: {
          valueSuffix: ' %'
        }

      }, {
        name: 'На улице',
        type: 'spline',
        // data: data.temp1,
        color: Highcharts.theme.colors[2],
        tooltip: {
          valueSuffix: ' °C'
        }
      }, {
        name: 'В помещении',
        type: 'spline',
        // data: data.temp2,
        color: Highcharts.theme.colors[5],
        tooltip: {
          valueSuffix: ' °C'
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
        tickInterval: 3600 * 1000 * 2,
        gridLineWidth: 1
      }],
      yAxis: [{
        labels: {
          style: {
            color: Highcharts.theme.colors[11]
          }
        },
        title: {
          text: 'Освещенность (lux)',
          style: {
            color: Highcharts.theme.colors[11]
          }
        },
        opposite: false,

      }, {
        gridLineWidth: 0,
        title: {
          text: 'UV (мВт/см^2)',
          style: {
            color: Highcharts.theme.colors[9]
          }
        },
        labels: {
          style: {
            color: Highcharts.theme.colors[9]
          }
        },
        opposite: true,
      }, {
        gridLineWidth: 0,
        title: {
          text: 'Атмосферное давление (мм.рт.ст.)',
          style: {
            color: Highcharts.theme.colors[1]
          }
        },
        labels: {
          style: {
            color: Highcharts.theme.colors[1]
          }
        },
        opposite: true,
      }],
      series: [{
        name: 'Освещенность',
        type: 'area',
        yAxis: 0,
        // data: data.light,
        color: Highcharts.theme.colors[11],
        tooltip: {
          valueSuffix: ' lux'
        }
      }, {
        name: 'UV',
        type: 'spline',
        yAxis: 1,
        // data: data.uv,
        color: Highcharts.theme.colors[9],
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
        color: Highcharts.theme.colors[1],
        marker: {
          enabled: false
        },
        tooltip: {
          valueSuffix: ' мм.рт.ст.'
        }

      }]
    }
  };

  componentDidMount() {
    const { data } = this.props

    this.setState({
      chart1_Options: {
        series: [
          { data: data.humd },
          { data: data.temp1 },
          { data: data.temp2 }
        ]
      },
      chart2_Options: {
        series: [
          { data: data.light },
          { data: data.uv },
          { data: data.press }
        ]
      }
    });
  }

  render() {
    const { chart1_Options, chart2_Options } = this.state

    return (
        <Container className='main-content'>
          <HighchartsReact
              highcharts={Highcharts}
              options={chart1_Options}
          />
          <br />
          <HighchartsReact
              highcharts={Highcharts}
              options={chart2_Options}
          />
        </Container>
    );
  }
}


export default Stats;