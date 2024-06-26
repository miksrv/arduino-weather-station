<?php

/**
 * Вычисляем количество дней между датами
 * @param string $start
 * @param string $stop
 * @return int
 */
function calc_days_in_period(string $start, string $stop): int
{
    $datetime1 = date_create($start);
    $datetime2 = date_create($stop);

    $interval = date_diff($datetime1, $datetime2);

    return (int) $interval->format('%a');
}

/**
 * В зависимости от количества дней между датами, устанавливаем интервал в минутах для обобщения данных
 * @param int $days
 * @return int
 */
function get_means_minutes(int $days): int {
    if ($days === 0) { return 1; } // 1 min
    if ($days >= 1 && $days <= 2) { return 10; } // 5 min
    if ($days >= 3 && $days <= 5) { return 15; } // 30 min
    if ($days >= 6 && $days <= 30) { return 60; } // 1 hour
//    if ($days >= 8 && $days <= 14) return 60; // 5 hour
    return 5*60; // 5 hour
}