<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->cli('system/current', 'System::getCurrentWeather'); // php index.php system current
$routes->cli('system/forecast', 'System::getForecastWeather'); // php index.php system forecast
$routes->cli('system/narodmon', 'System::sendNarodmonData'); // php index.php system narodmon

$routes->get('current', 'Current::getCurrentWeather');
$routes->get('current/text', 'Current::getCurrentTextWeather');
$routes->options('current', 'Current');
$routes->options('current/text', 'Current');

$routes->get('forecast/daily', 'Forecast::getForecastDaily');
$routes->get('forecast/hourly', 'Forecast::getForecastHourly');
$routes->options('forecast/(:alphanum)', 'Forecast');

$routes->get('history', 'History::getHistoryWeather');
$routes->get('history/export', 'History::getHistoryWeatherCSV');
$routes->options('history', 'History');

$routes->get('heatmap', 'Heatmap::getHeatmapData');
$routes->options('heatmap', 'Heatmap');
