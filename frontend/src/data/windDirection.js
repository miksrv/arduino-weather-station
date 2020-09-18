const windDirection = value => {
    if (value === 0) {
        return 'Север'
    } else if (value === 45) {
        return 'Северо-восток'
    } else if (value === 90) {
        return 'Восток'
    } else if (value === 135) {
        return 'Юго-восток'
    } else if (value === 180) {
        return 'Юг'
    } else if (value === 225) {
        return 'Юго-запад'
    } else if (value === 270) {
        return 'Запад'
    } else {
        return 'Северо-запад'
    }
}

export default windDirection