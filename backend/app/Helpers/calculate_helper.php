<?php

/**
 * Return calculated dew point value by temperature and humidity
 * @param $humidity float
 * @param $temp float
 * @return false|float
 */
function calculate_dew_point($humidity, $temp)
{
    return round(((pow(($humidity / 100), 0.125)) * (112 + 0.9 * $temp) + (0.1 * $temp) - 112),1);
}

/**
 * Calculate wind rose
 * @param $_temp_wr
 * @param $_temp_wr_total
 * @return array|null
 */
function calculate_wind_rose($_temp_wr, $_temp_wr_total)
{
    //if ($_temp_wr_total == 0) return null;

    $new_wr_array = [];

    foreach ($_temp_wr as $key_wr_1 => $val_wr_direct) {
        foreach ($val_wr_direct as $key_wr_2 => $val_wr_speed) {
            $_tmp = $_temp_wr_total > 0 ? round((($val_wr_speed / $_temp_wr_total) * 100), 1) : 0;
            $new_wr_array[$key_wr_1][] = [
                convert_index_to_deegre($key_wr_2),
                $_tmp
            ];
        }
    }

    return $new_wr_array;
}