<?php

namespace App\Commands;

use App\Libraries\NarodMonLibrary;
use App\Models\RawWeatherDataModel;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Exception;

/**
 * Class SendNarodmonData
 *
 * Spark CLI command that retrieves the latest sensor reading and pushes it
 * to the narodmon.ru monitoring service.
 *
 * Usage:
 *   php spark system:sendNarodmonData
 *
 * @package App\Commands
 */
class SendNarodmonData extends BaseCommand
{
    /** @var string Command group */
    protected $group = 'system';

    /** @var string Command name */
    protected $name = 'system:sendNarodmonData';

    /** @var string Command description */
    protected $description = 'Sends the current weather sensor reading to the narodmon.ru monitoring service.';

    /**
     * Fetches the latest weather data from the database and pushes it to
     * narodmon.ru via NarodMonLibrary.
     *
     * @param array $params CLI parameters (unused)
     * @return void
     */
    public function run(array $params): void
    {
        try {
            $weatherDataModel = new RawWeatherDataModel();
            $NarodMonLibrary  = new NarodMonLibrary();

            $weatherData = $weatherDataModel->getCurrentActualWeatherData();

            if (empty($weatherData)) {
                CLI::write('[SKIP]  No current weather data available', 'yellow');
                log_message('info', 'system:sendNarodmonData skipped — no current weather data available.');
                return;
            }

            $NarodMonLibrary->send($weatherData);

            CLI::write('[OK]    Data sent to narodmon.ru', 'green');

            $summary = 'system:sendNarodmonData completed — data sent to narodmon.ru.';
            CLI::write($summary, 'white');
            log_message('info', $summary);
        } catch (Exception $e) {
            $msg = 'system:sendNarodmonData failed: ' . $e->getMessage();
            log_message('error', $msg);
            CLI::write('[ERROR] ' . $msg, 'red');
        }
    }
}
