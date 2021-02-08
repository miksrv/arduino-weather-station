const data = [
  {
    source: 't2',
    name: 'Температура',
    color: 'red',
    icon: 'temp',
    trend: true,
    sign: '℃'
  },
  // {
  //   source: 't2',
  //   name: 'Температура 2 (℃)',
  //   color: 'red',
  //   icon: 'temp',
  //   trend: true
  // },
  {
    source: 'dp',
    name: 'Точка росы',
    color: 'orange',
    icon: 'dewpoint',
    trend: true,
    sign: '℃'
  },
  {
    source: 'h',
    name: 'Влажность воздуха',
    color: 'blue',
    icon: 'humd',
    trend: true,
    sign: '%'
  },
  {
    source: 'p',
    name: 'Давление (мм)',
    color: 'cobalt',
    icon: 'press',
    trend: true
  },
  {
    source: 'lux',
    name: 'Освещенность (lux)',
    color: 'green',
    icon: 'light',
    trend: true
  },
  {
    source: 'uv',
    name: 'УФ интенсивность',
    color: 'green',
    icon: 'uvindex',
    trend: true,
    sign: 'мВт/м2'
  },
  {
    source: 'wd',
    name: 'Направление ветра',
    color: 'purple',
    icon: 'windir',
    trend: false,
    sign: '°'
  },
  {
    source: 'ws',
    name: 'Скорость ветра',
    color: 'purple',
    icon: 'winspeed',
    trend: true,
    sign: 'м/с'
  }
]

export default data