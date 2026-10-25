<?php

use CodeIgniter\Test\CIUnitTestCase;
use Config\Services;

/**
 * Verifies the route-to-filter wiring declared in Config\Filters.
 *
 * @internal
 */
final class FiltersConfigTest extends CIUnitTestCase
{
    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function cachedRoutesProvider(): array
    {
        return [
            'current'  => ['current', 'cachecontrol:30'],
            'history'  => ['history', 'cachecontrol:300'],
            'forecast' => ['forecast/hourly', 'cachecontrol:300'],
            'climate'  => ['climate', 'cachecontrol:3600'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('cachedRoutesProvider')]
    public function testCacheControlFilterAppliedAfterGetRoutes(string $uri, string $expected): void
    {
        $filters = Services::filters()->reset();
        $filters->initialize($uri);

        $this->assertContains($expected, $filters->getFilters()['after'], $uri);
    }

    public function testSensorsIsNotCached(): void
    {
        $filters = Services::filters()->reset();
        $filters->initialize('sensors');

        foreach ($filters->getFilters()['after'] as $alias) {
            $this->assertStringStartsNotWith('cachecontrol', $alias);
        }
    }
}
