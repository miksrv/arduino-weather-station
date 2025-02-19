<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

/** System Controller **/
$routes->group('system', static function ($routes) {
    $routes->cli('current', 'System::getCurrentWeather'); // php index.php system current
    $routes->cli('forecast', 'System::getForecastWeather'); // php index.php system forecast
    $routes->cli('narodmon', 'System::sendNarodmonData'); // php index.php system narodmon
});

/** Current Controller **/
$routes->group('current', static function ($routes) {
    $routes->get('/', 'Current::getCurrentWeather');
    $routes->get('text', 'Current::getCurrentTextWeather');
    $routes->options('/', static function () {});
    $routes->options('text', static function () {});
});

/** Forecast Controller **/
$routes->group('forecast', static function ($routes) {
    $routes->get('daily', 'Forecast::getForecastDaily');
    $routes->get('hourly', 'Forecast::getForecastHourly');
    $routes->options('daily', static function () {});
    $routes->options('hourly', static function () {});
});

/** History Controller **/
$routes->group('history', static function ($routes) {
    $routes->get('/', 'History::getHistoryWeather');
    $routes->get('export', 'History::getHistoryWeatherCSV');
    $routes->options('/', static function () {});
});

/** Heatmap Controller **/
$routes->group('heatmap', static function ($routes) {
    $routes->get('/', 'Heatmap::getHeatmapData');
    $routes->options('/', static function () {});
});

/** Sensors Controller **/
$routes->group('sensors', static function ($routes) {
    $routes->post('/', 'Sensors::setWeather');
    $routes->options('/', static function () {});
});
