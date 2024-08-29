<?php

if (!function_exists('kmh_to_ms')) {
    /**
     * Convert speed from kilometers per hour to meters per second.
     *
     * @param float $speed Speed in kilometers per hour.
     * @return float Speed in meters per second.
     */
    function kmh_to_ms(float $speed): float
    {
        return $speed * 1000 / 3600;
    }
}

if (!function_exists('calculateDewPoint')) {
    /**
     * To calculate the dew point, you can use the Magnus-Tetens equation.
     * This is one of the most accurate methods for calculating the dew point, especially at air temperatures above 0°C.
     * Here, a and b are empirical coefficients that depend on the chosen formula.
     * For the standard Magnus-Tetens formula, a=17.27 and b=237.7.
     *
     * @param float $temperature
     * @param float $humidity
     * @return float
     */
    function calculateDewPoint(float $temperature, float $humidity): float
    {
        $a = 17.27;
        $b = 237.7;

        $alpha = ($a * $temperature) / ($b + $temperature) + log($humidity / 100);
        $dewPoint = ($b * $alpha) / ($a - $alpha);

        return round($dewPoint, 2);
    }
}

if (!function_exists('mmHg_to_hPa')) {
    /**
     * @param float $pressure
     * @return int
     */
    function mmHg_to_hPa(float $pressure): int
    {
        return round($pressure * 1.33322);
    }
}