const data = [
  {
    type: 'sensors',
    source: 't1',
    name: 'Температура 1 (℃)',
    color: 'red',
    icon: 'temp',
    trend: true
  },
  {
    type: 'sensors',
    source: 't2',
    name: 'Температура 2 (℃)',
    color: 'red',
    icon: 'temp',
    trend: true
  },
  {
    type: 'sensors',
    source: 'h',
    name: 'Влажность воздуха',
    color: 'blue',
    icon: 'humd',
    trend: true
  },
  {
    type: 'sensors',
    source: 'p',
    name: 'Давление (мм)',
    color: 'cobalt',
    icon: 'press',
    trend: true
  },
  {
    type: 'sensors',
    source: 'lux',
    name: 'Освещенность (lx)',
    color: 'green',
    icon: 'light',
    trend: true
  },
  {
    type: 'sensors',
    source: 'uv',
    name: 'UV индекс',
    color: 'green',
    icon: 'uvindex',
    trend: true
  },
  // {
  //   type: 'sensors',
  //   source: 'wd',
  //   name: 'Направление ветра',
  //   color: 'purple',
  //   icon: 'windir',
  //   trend: false
  // },
  {
    type: 'sensors',
    source: 'ws',
    name: 'Скорость ветра',
    color: 'brown',
    icon: 'winspeed',
    trend: true
  },
  {
    type: 'sun',
    name: 'Солнечный день',
    color: 'yellow',
    icon: 'sunrise',
  },
  {
    type: 'moon',
  }
]

export default data