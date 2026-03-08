<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class OllamaPerformanceReportService
{
    public function generate(array $snapshot, array &$warnings): array
    {
        $enabled = (bool) config('services.ollama.enabled', true);
        $baseUrl = rtrim((string) config('services.ollama.base_url', 'http://127.0.0.1:11434'), '/');
        $model = trim((string) config('services.ollama.model', 'gemma3:4b'));
        $timeout = max(5, (int) config('services.ollama.timeout', 90));
        $ttl = max(60, (int) config('services.ollama.cache_ttl', 1800));

        if (! $enabled) {
            return $this->emptyPayload('disabled', 'Ollama desactive.');
        }

        if ($baseUrl === '' || $model === '') {
            $warnings[] = 'OLLAMA_BASE_URL or OLLAMA_MODEL is missing for AI insights.';

            return $this->emptyPayload('misconfigured', 'Configuration Ollama incomplete.');
        }

        $analysis = $this->buildAnalysisPayload($snapshot);
        $cacheKey = 'performance-ai:' . sha1(json_encode($analysis, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: 'snapshot');

        try {
            return Cache::remember($cacheKey, $ttl, function () use ($analysis, $baseUrl, $model, $timeout): array {
                $response = Http::acceptJson()
                    ->timeout($timeout)
                    ->post($baseUrl . '/api/generate', [
                        'model' => $model,
                        'stream' => false,
                        'format' => $this->responseSchema(),
                        'prompt' => $this->buildPrompt($analysis),
                    ]);

                if (! $response->successful()) {
                    throw new \RuntimeException('Ollama request failed with status ' . $response->status() . '.');
                }

                $payload = $response->json();
                $decoded = json_decode((string) Arr::get($payload, 'response', ''), true);

                if (! is_array($decoded)) {
                    throw new \RuntimeException('Ollama returned an invalid JSON response.');
                }

                return [
                    'available' => true,
                    'status' => 'ready',
                    'provider' => 'ollama',
                    'model' => $model,
                    'generatedAt' => now()->toIso8601String(),
                    'report' => [
                        'headline' => $this->sanitizeLine((string) Arr::get($decoded, 'headline', 'Compte-rendu IA')),
                        'summary' => $this->sanitizeParagraph((string) Arr::get($decoded, 'summary', '')),
                        'highlights' => $this->sanitizeList(Arr::get($decoded, 'highlights', []), 3),
                        'watchouts' => $this->sanitizeList(Arr::get($decoded, 'watchouts', []), 3),
                        'nextSteps' => $this->sanitizeList(Arr::get($decoded, 'nextSteps', []), 3),
                    ],
                ];
            });
        } catch (Throwable $exception) {
            $warnings[] = 'Ollama insight error: ' . $exception->getMessage();

            return $this->emptyPayload('error', 'Compte-rendu IA indisponible.');
        }
    }

    private function buildAnalysisPayload(array $snapshot): array
    {
        $sleep = Arr::get($snapshot, 'garmin.sleep', []);
        $sleepRecent = collect(Arr::get($sleep, 'recent', []))
            ->take(5)
            ->map(fn (array $night): array => [
                'date' => Arr::get($night, 'date'),
                'hours' => Arr::get($night, 'hours'),
                'score' => Arr::get($night, 'score'),
                'hrvStatus' => Arr::get($night, 'hrvStatus'),
                'bodyBatteryChange' => Arr::get($night, 'bodyBatteryChange'),
                'avgSleepStress' => Arr::get($night, 'avgSleepStress'),
            ])
            ->values()
            ->all();

        $activities = collect(Arr::get($snapshot, 'fitness.recentActivities', []))
            ->take(5)
            ->map(fn (array $activity): array => [
                'date' => Arr::get($activity, 'date'),
                'name' => Arr::get($activity, 'name'),
                'type' => Arr::get($activity, 'type'),
                'distanceKm' => Arr::get($activity, 'distanceKm'),
                'durationMin' => Arr::get($activity, 'durationMin'),
                'trainingLoad' => Arr::get($activity, 'trainingLoad'),
                'avgHr' => Arr::get($activity, 'avgHr'),
                'trainingEffectLabel' => Arr::get($activity, 'trainingEffectLabel'),
            ])
            ->values()
            ->all();

        $weekly = collect(Arr::get($snapshot, 'garmin.weekly', []))
            ->take(7)
            ->map(fn (array $day): array => [
                'date' => Arr::get($day, 'date'),
                'steps' => Arr::get($day, 'steps'),
                'activeCalories' => Arr::get($day, 'activeCalories'),
                'sleepHours' => Arr::get($day, 'sleepHours'),
                'restingHeartRate' => Arr::get($day, 'restingHeartRate'),
            ])
            ->values()
            ->all();

        $nutrition = [
            'todayCalories' => Arr::get($snapshot, 'nutrition.kpis.0.value'),
            'weekCalories' => Arr::get($snapshot, 'nutrition.kpis.1.value'),
            'mealCount' => Arr::get($snapshot, 'nutrition.kpis.2.value'),
            'avgMealCalories' => Arr::get($snapshot, 'nutrition.kpis.3.value'),
        ];

        return [
            'athlete' => [
                'name' => Arr::get($snapshot, 'fitness.athlete.name'),
            ],
            'garmin' => [
                'coverage' => Arr::get($snapshot, 'garmin.coverage'),
                'today' => Arr::only(Arr::get($snapshot, 'garmin.today', []), [
                    'date',
                    'steps',
                    'distanceKm',
                    'activeCalories',
                    'restingHeartRate',
                    'stress',
                    'bodyBattery',
                ]),
                'sleep' => Arr::only($sleep, [
                    'date',
                    'hours',
                    'score',
                    'scoreLabel',
                    'avgOvernightHrv',
                    'hrvStatus',
                    'bodyBatteryChange',
                    'efficiencyPercent',
                    'awakeCount',
                    'avgSleepStress',
                ]),
                'sleepRecent' => $sleepRecent,
                'weekly' => $weekly,
            ],
            'activities' => $activities,
            'nutrition' => $nutrition,
        ];
    }

    private function buildPrompt(array $analysis): string
    {
        $json = json_encode($analysis, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';

        return <<<PROMPT
Tu es un analyste de performance sportive.
Tu produis un compte-rendu tres concis en francais a partir d'un snapshot Garmin, activites et nutrition.

Regles:
- Pas de markdown.
- Pas de diagnostic medical.
- Sois direct, utile et specifique aux donnees.
- Limite chaque element de liste a 120 caracteres.
- Base-toi uniquement sur les donnees fournies.

Donnees:
{$json}
PROMPT;
    }

    private function responseSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'headline' => ['type' => 'string'],
                'summary' => ['type' => 'string'],
                'highlights' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
                'watchouts' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
                'nextSteps' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
            ],
            'required' => ['headline', 'summary', 'highlights', 'watchouts', 'nextSteps'],
        ];
    }

    private function sanitizeList(mixed $items, int $limit = 3): array
    {
        return collect(is_array($items) ? $items : [])
            ->map(fn ($item): string => $this->sanitizeLine((string) $item))
            ->filter(fn (string $item): bool => $item !== '')
            ->take($limit)
            ->values()
            ->all();
    }

    private function sanitizeLine(string $value, int $limit = 140): string
    {
        return Str::of($value)
            ->replace('**', '')
            ->replace('*', '')
            ->replace('•', '')
            ->replace("\r", ' ')
            ->replace("\n", ' ')
            ->squish()
            ->limit($limit, '...')
            ->value();
    }

    private function sanitizeParagraph(string $value, int $limit = 280): string
    {
        return Str::of($this->sanitizeLine($value, $limit))
            ->trim()
            ->value();
    }

    private function emptyPayload(string $status, string $message): array
    {
        return [
            'available' => false,
            'status' => $status,
            'provider' => 'ollama',
            'model' => trim((string) config('services.ollama.model', 'gemma3:4b')),
            'generatedAt' => null,
            'message' => $message,
            'report' => null,
        ];
    }
}
