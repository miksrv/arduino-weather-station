const getSeason = () => {
    const date = new Date(),
          month = date.getMonth() + 1

    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'

    return 'winter'
}

export default getSeason