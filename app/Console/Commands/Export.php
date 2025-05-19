<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class Export extends Command
{
    /**
     * Le nom et la signature de la commande.
     *
     * @var string
     */
    protected $signature = 'app:export';

    /**
     * La description de la commande.
     *
     * @var string
     */
    protected $description = 'Commande d’export fictive sans base de données';

    /**
     * Exécution de la commande.
     *
     * @return int
     */
    public function handle(): int
    {
        $data = [
            'message' => 'Export réalisé avec succès',
            'timestamp' => now()->toDateTimeString(),
        ];

        $json = json_encode($data, JSON_PRETTY_PRINT);

        $path = storage_path('exports/export.json');
        File::ensureDirectoryExists(dirname($path));
        File::put($path, $json);

        $this->info("Fichier exporté avec succès : {$path}");

        return Command::SUCCESS;
    }
}
