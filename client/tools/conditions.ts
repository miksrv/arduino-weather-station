// Match weather IDs with i18n keys
const weatherIdToI18nKeyMap: Record<number, string> = {
    // Group 2xx: Thunderstorm
    200: 'conditions.thunderstorm_with_light_rain',
    201: 'conditions.thunderstorm_with_rain',
    202: 'conditions.thunderstorm_with_heavy_rain',
    210: 'conditions.light_thunderstorm',
    211: 'conditions.thunderstorm',
    212: 'conditions.heavy_thunderstorm',
    221: 'conditions.ragged_thunderstorm',
    230: 'conditions.thunderstorm_with_light_drizzle',
    231: 'conditions.thunderstorm_with_drizzle',
    232: 'conditions.thunderstorm_with_heavy_drizzle',

    // Group 3xx: Drizzle
    300: 'conditions.light_intensity_drizzle',
    301: 'conditions.drizzle',
    302: 'conditions.heavy_intensity_drizzle',
    310: 'conditions.light_intensity_drizzle_rain',
    311: 'conditions.drizzle_rain',
    312: 'conditions.heavy_intensity_drizzle_rain',
    313: 'conditions.shower_rain_and_drizzle',
    314: 'conditions.heavy_shower_rain_and_drizzle',
    321: 'conditions.shower_drizzle',

    // Group 5xx: Rain
    500: 'conditions.light_rain',
    501: 'conditions.moderate_rain',
    502: 'conditions.heavy_intensity_rain',
    503: 'conditions.very_heavy_rain',
    504: 'conditions.extreme_rain',
    511: 'conditions.freezing_rain',
    520: 'conditions.light_intensity_shower_rain',
    521: 'conditions.shower_rain',
    522: 'conditions.heavy_intensity_shower_rain',
    531: 'conditions.ragged_shower_rain',

    // Group 6xx: Snow
    600: 'conditions.light_snow',
    601: 'conditions.snow',
    602: 'conditions.heavy_snow',
    611: 'conditions.sleet',
    612: 'conditions.light_shower_sleet',
    613: 'conditions.shower_sleet',
    615: 'conditions.light_rain_and_snow',
    616: 'conditions.rain_and_snow',
    620: 'conditions.light_shower_snow',
    621: 'conditions.shower_snow',
    622: 'conditions.heavy_shower_snow',

    // Group 7xx: Atmosphere
    701: 'conditions.mist',
    711: 'conditions.smoke',
    721: 'conditions.haze',
    731: 'conditions.sand_dust_whirls',
    741: 'conditions.fog',
    751: 'conditions.sand',
    761: 'conditions.dust',
    762: 'conditions.volcanic_ash',
    771: 'conditions.squalls',
    781: 'conditions.tornado',

    // Group 800: Clear
    800: 'conditions.clear_sky',

    // Group 80x: Clouds
    801: 'conditions.few_clouds',
    802: 'conditions.scattered_clouds',
    803: 'conditions.broken_clouds',
    804: 'conditions.overcast_clouds'
}

/**
 * Converts weather ID to i18n key.
 * @param weatherId Weather ID.
 * @returns String with i18n key or 'conditions.unknown' if ID not found.
 */
export const getWeatherI18nKey = (weatherId?: number | string): string => {
    if (!weatherId) {
        return 'conditions.unknown'
    }

    return weatherIdToI18nKeyMap[Number(weatherId)] || 'conditions.unknown'
}
