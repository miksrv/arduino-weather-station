<?php

namespace App\Commands;

use CodeIgniter\CLI\CLI;
use CodeIgniter\Commands\Server\Serve as BaseServe;
use Config\Database;
use Throwable;

/**
 * Class Serve
 *
 * Overrides the framework `serve` command: outside production it first runs DevWeatherSeeder,
 * so the local database is filled up to "now" before the development server starts.
 * A failing seed (e.g. the database is not running) is reported but does not block the server.
 *
 * Usage:
 *   php spark serve             # seed fresh data, then start the server
 *   php spark serve --no-seed   # start the server without seeding
 *
 * @package App\Commands
 */
class Serve extends BaseServe
{
    /** @var string Command description */
    protected $description = 'Fills fresh development weather data, then launches the CodeIgniter PHP-Development Server.';

    /** @var array<string, string> Command options */
    protected $options = [
        '--php'     => 'The PHP Binary [default: "PHP_BINARY"]',
        '--host'    => 'The HTTP Host [default: "localhost"]',
        '--port'    => 'The HTTP Host Port [default: "8080"]',
        '--no-seed' => 'Do not fill fresh development weather data before starting',
    ];

    /**
     * Seeds fresh development data (once, not on port retries), then starts the server.
     *
     * @param array $params CLI parameters
     * @return void
     */
    public function run(array $params): void
    {
        if ($this->portOffset === 0 && $this->_shouldSeed()) {
            $this->_seed();
        }

        parent::run($params);
    }

    /**
     * Whether the development seeder should run before the server starts.
     *
     * @return bool
     */
    private function _shouldSeed(): bool
    {
        return ENVIRONMENT !== 'production' && CLI::getOption('no-seed') === null;
    }

    /**
     * Runs DevWeatherSeeder; errors are logged and reported without stopping the server.
     *
     * @return void
     */
    private function _seed(): void
    {
        try {
            Database::seeder()->call('DevWeatherSeeder');
        } catch (Throwable $e) {
            log_message('error', 'Serve - DevWeatherSeeder failed: ' . $e->getMessage());
            CLI::write('[WARN] Could not seed development data: ' . $e->getMessage(), 'yellow');
        }
    }
}
