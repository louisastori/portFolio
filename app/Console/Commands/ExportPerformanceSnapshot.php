<?php

namespace App\Console\Commands;

use App\Services\PerformanceSnapshotService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use JsonException;

class ExportPerformanceSnapshot extends Command
{
    protected $signature = 'performance:export-snapshot {--live : Force live upstream refresh} {--output= : Output JSON file path}';

    protected $description = 'Exports the performance snapshot to a JSON file for the portfolio frontend.';

    public function __construct(
        private readonly PerformanceSnapshotService $snapshotService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $snapshot = $this->snapshotService->buildSnapshot(
            (bool) $this->option('live')
        );

        $outputPath = $this->option('output');
        if (! is_string($outputPath) || trim($outputPath) === '') {
            $outputPath = base_path('dist/data/performance-live.json');
        }

        File::ensureDirectoryExists(dirname($outputPath));

        try {
            $json = json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            $this->error('Unable to encode performance snapshot: ' . $exception->getMessage());

            return self::FAILURE;
        }

        File::put($outputPath, $json . PHP_EOL);

        $this->info('Performance snapshot exported: ' . $outputPath);

        return self::SUCCESS;
    }
}
