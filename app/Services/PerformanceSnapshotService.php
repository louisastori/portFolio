<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class PerformanceSnapshotService
{
    public function __construct(
        private readonly GarminCrawlerExportService $garminCrawlerExportService,
        private readonly OllamaPerformanceReportService $ollamaPerformanceReportService
    ) {
    }

    public function buildSnapshot(bool $forceLive = false): array
    {
        $warnings = [];

        $fitnessOverview = $this->fetchFitnessOverview($warnings, $forceLive);
        $garminCrawler = $this->garminCrawlerExportService->loadLatest($warnings);
        $nutritionEntries = $this->fetchNutritionEntries($warnings);

        $warnings = array_values(array_unique($warnings));

        $snapshot = [
            'generatedAt' => now()->toIso8601String(),
            'fitness' => $this->formatFitnessPayload($fitnessOverview, $garminCrawler),
            'nutrition' => $this->formatNutritionPayload($nutritionEntries),
            'garmin' => $garminCrawler ?? $this->emptyGarminPayload(),
        ];

        $snapshot['ai'] = $this->ollamaPerformanceReportService->generate($snapshot, $warnings);
        $warnings = array_values(array_unique($warnings));
        $snapshot['connections'] = $this->buildConnections($nutritionEntries, $garminCrawler, $warnings);
        $snapshot['warnings'] = $warnings;

        return $snapshot;
    }

    private function fetchFitnessOverview(array &$warnings, bool $forceLive): ?array
    {
        $baseUrl = trim((string) config('services.fitness_api.base_url', ''));
        if ($baseUrl === '') {
            $warnings[] = 'FITNESS_API_BASE_URL is not configured.';
            return null;
        }

        $timeout = max(1, (int) config('services.fitness_api.timeout', 10));
        $limit = max(1, (int) config('services.fitness_api.limit', 8));
        $token = trim((string) config('services.fitness_api.token', ''));

        $request = Http::acceptJson()->timeout($timeout);
        if ($token !== '') {
            $request = $request->withToken($token);
        }

        try {
            $response = $request->get(
                rtrim($baseUrl, '/') . '/api/overview',
                [
                    'limit' => $limit,
                    'source' => $forceLive ? 'live' : 'cache',
                ]
            );

            if (! $response->successful()) {
                $warnings[] = 'Fitness API request failed with status ' . $response->status() . '.';
                return null;
            }

            $payload = $response->json();
            if (! is_array($payload)) {
                $warnings[] = 'Fitness API returned an invalid payload.';
                return null;
            }

            return $payload;
        } catch (Throwable $exception) {
            $warnings[] = 'Fitness API error: ' . $exception->getMessage();
            return null;
        }
    }

    private function fetchNutritionEntries(array &$warnings): array
    {
        $baseUrl = trim((string) config('services.nutrition_api.base_url', ''));
        $apiKey = trim((string) config('services.nutrition_api.api_key', ''));
        $table = trim((string) config('services.nutrition_api.table', 'meals'));

        if ($baseUrl === '' || $apiKey === '') {
            $warnings[] = 'SUPABASE_URL or SUPABASE_ANON_KEY is missing for nutrition data.';
            return [];
        }

        $timeout = max(1, (int) config('services.nutrition_api.timeout', 10));
        $limit = max(1, (int) config('services.nutrition_api.limit', 20));

        try {
            $response = Http::acceptJson()
                ->withHeaders([
                    'apikey' => $apiKey,
                    'Authorization' => 'Bearer ' . $apiKey,
                ])
                ->timeout($timeout)
                ->get(
                    rtrim($baseUrl, '/') . '/rest/v1/' . ltrim($table, '/'),
                    [
                        'select' => 'id,name,grams,calories,capturedAt,imageUri',
                        'order' => 'capturedAt.desc',
                        'limit' => $limit,
                    ]
                );

            if (! $response->successful()) {
                $warnings[] = 'Nutrition API request failed with status ' . $response->status() . '.';
                return [];
            }

            $payload = $response->json();
            if (! is_array($payload)) {
                $warnings[] = 'Nutrition API returned an invalid payload.';
                return [];
            }

            return $payload;
        } catch (Throwable $exception) {
            $warnings[] = 'Nutrition API error: ' . $exception->getMessage();
            return [];
        }
    }

    private function formatFitnessPayload(?array $overview, ?array $garminCrawler): array
    {
        if ($overview === null && $garminCrawler === null) {
            return [
                'athlete' => null,
                'garminProfile' => null,
                'kpis' => [],
                'recentActivities' => [],
                'generatedAt' => null,
            ];
        }

        $stravaProfile = Arr::get($overview, 'strava.profile', []);
        $garminProfile = Arr::get($overview, 'garmin.profile', []);
        $localGarminProfile = Arr::get($garminCrawler, 'profile', []);
        $stravaStats = Arr::get($overview, 'strava.stats', []);
        $stravaActivities = Arr::get($overview, 'strava.activities', []);
        $garminActivities = Arr::get($overview, 'garmin.activities', []);

        $athleteName = trim(
            implode(' ', array_filter([
                Arr::get($stravaProfile, 'firstname'),
                Arr::get($stravaProfile, 'lastname'),
            ]))
        );

        if ($athleteName === '') {
            $athleteName = (string) Arr::get($stravaProfile, 'username', 'Athlete');
        }

        if ($athleteName === '' || $athleteName === 'Athlete') {
            $athleteName = (string) Arr::get($localGarminProfile, 'name', 'Athlete');
        }

        $garminName = (string) Arr::get($garminProfile, 'displayName', '');
        if ($garminName === '') {
            $garminName = trim(
                implode(' ', array_filter([
                    Arr::get($garminProfile, 'fullName'),
                    Arr::get($garminProfile, 'userName'),
                ]))
            );
        }

        if ($garminName === '') {
            $garminName = (string) Arr::get($localGarminProfile, 'name', 'Garmin profile');
        }

        $kpis = collect();

        if ($overview !== null) {
            $kpis = $kpis->merge([
                [
                    'label' => 'Distance 4 semaines',
                    'value' => $this->metersToKilometers(
                        $this->toFloat(Arr::get($stravaStats, 'recent_ride_totals.distance'))
                    ),
                    'unit' => 'km',
                ],
                [
                    'label' => 'Temps roulant 4 semaines',
                    'value' => $this->secondsToHours(
                        $this->toFloat(Arr::get($stravaStats, 'recent_ride_totals.moving_time'))
                    ),
                    'unit' => 'h',
                ],
                [
                    'label' => 'D+ annee',
                    'value' => (int) round(
                        $this->toFloat(Arr::get($stravaStats, 'ytd_ride_totals.elevation_gain'))
                    ),
                    'unit' => 'm',
                ],
                [
                    'label' => 'Sorties annee',
                    'value' => (int) $this->toFloat(Arr::get($stravaStats, 'ytd_ride_totals.count')),
                    'unit' => 'rides',
                ],
            ]);
        }

        $kpis = $kpis
            ->merge(Arr::get($garminCrawler, 'activityKpis', []))
            ->filter(fn ($kpi) => is_array($kpi))
            ->values()
            ->all();

        $garminTimeline = Arr::get($garminCrawler, 'recentActivities', []);
        if (! is_array($garminTimeline) || $garminTimeline === []) {
            $garminTimeline = $this->mapGarminActivities(is_array($garminActivities) ? $garminActivities : []);
        }

        $timeline = collect()
            ->merge($this->mapStravaActivities(is_array($stravaActivities) ? $stravaActivities : []))
            ->merge($garminTimeline)
            ->filter(fn ($activity) => is_array($activity))
            ->unique(function (array $activity): string {
                return implode('|', [
                    (string) Arr::get($activity, 'source'),
                    (string) Arr::get($activity, 'id'),
                    (string) Arr::get($activity, 'name'),
                    (string) Arr::get($activity, 'date'),
                ]);
            })
            ->sortByDesc('date')
            ->values()
            ->take(12)
            ->all();

        return [
            'athlete' => [
                'name' => $athleteName,
                'city' => Arr::get($stravaProfile, 'city'),
                'country' => Arr::get($stravaProfile, 'country'),
                'avatar' => Arr::get($stravaProfile, 'profile_medium', Arr::get($localGarminProfile, 'avatar')),
            ],
            'garminProfile' => [
                'name' => $garminName,
                'location' => Arr::get($garminProfile, 'location', Arr::get($localGarminProfile, 'location')),
                'avatar' => Arr::get($localGarminProfile, 'avatar'),
            ],
            'kpis' => $kpis,
            'recentActivities' => $timeline,
            'generatedAt' => Arr::get($overview, 'generatedAt', Arr::get($garminCrawler, 'generatedAt')),
        ];
    }

    private function formatNutritionPayload(array $entries): array
    {
        $normalizedEntries = collect($entries)
            ->filter(fn ($entry) => is_array($entry))
            ->map(function (array $entry): array {
                $capturedAt = $this->parseDate(Arr::get($entry, 'capturedAt'));

                return [
                    'id' => Arr::get($entry, 'id'),
                    'name' => Str::title((string) Arr::get($entry, 'name', 'Unknown')),
                    'grams' => (int) $this->toFloat(Arr::get($entry, 'grams')),
                    'calories' => (int) $this->toFloat(Arr::get($entry, 'calories')),
                    'capturedAt' => $capturedAt?->toIso8601String(),
                    'capturedAtLabel' => $capturedAt?->format('d/m H:i'),
                    'imageUri' => Arr::get($entry, 'imageUri'),
                ];
            })
            ->filter(fn (array $entry) => ! empty($entry['capturedAt']))
            ->values();

        $todayStart = CarbonImmutable::now()->startOfDay();
        $sevenDaysAgo = CarbonImmutable::now()->subDays(7);

        $todayCalories = $normalizedEntries
            ->filter(function (array $entry) use ($todayStart): bool {
                $capturedAt = $this->parseDate($entry['capturedAt']);
                return $capturedAt !== null && $capturedAt->greaterThanOrEqualTo($todayStart);
            })
            ->sum('calories');

        $weekCalories = $normalizedEntries
            ->filter(function (array $entry) use ($sevenDaysAgo): bool {
                $capturedAt = $this->parseDate($entry['capturedAt']);
                return $capturedAt !== null && $capturedAt->greaterThanOrEqualTo($sevenDaysAgo);
            })
            ->sum('calories');

        $mealCount = $normalizedEntries->count();

        return [
            'kpis' => [
                [
                    'label' => 'Calories aujourd hui',
                    'value' => (int) $todayCalories,
                    'unit' => 'kcal',
                ],
                [
                    'label' => 'Calories 7 jours',
                    'value' => (int) $weekCalories,
                    'unit' => 'kcal',
                ],
                [
                    'label' => 'Repas saisis',
                    'value' => $mealCount,
                    'unit' => 'entries',
                ],
                [
                    'label' => 'Moyenne par repas',
                    'value' => $mealCount > 0 ? (int) round($normalizedEntries->avg('calories')) : 0,
                    'unit' => 'kcal',
                ],
            ],
            'recentEntries' => $normalizedEntries->take(8)->all(),
            'lastEntryAt' => $normalizedEntries->first()['capturedAt'] ?? null,
        ];
    }

    private function buildConnections(array $nutritionEntries, ?array $garminCrawler, array $warnings): array
    {
        $hasNutritionWarning = collect($warnings)->contains(fn (string $warning): bool => str_starts_with($warning, 'Nutrition API') || str_starts_with($warning, 'SUPABASE_URL'));
        $hasGarminCrawlerWarning = collect($warnings)->contains(fn (string $warning): bool => str_starts_with($warning, 'GARMIN_CRAWLER') || str_starts_with($warning, 'Garmin crawler') || str_starts_with($warning, 'No Garmin crawler export'));

        return [
            [
                'name' => 'Garmin crawler local',
                'status' => $garminCrawler !== null && ! $hasGarminCrawlerWarning ? 'connected' : 'disconnected',
                'lastSync' => Arr::get($garminCrawler, 'generatedAt'),
            ],
            [
                'name' => 'Nutrition tracking',
                'status' => ! $hasNutritionWarning ? 'connected' : 'disconnected',
                'lastSync' => Arr::get($nutritionEntries, '0.capturedAt'),
            ],
        ];
    }

    private function mapStravaActivities(array $activities): array
    {
        return collect($activities)
            ->map(function (array $activity): array {
                $distanceKm = $this->metersToKilometers($this->toFloat(Arr::get($activity, 'distance')));
                $durationSeconds = $this->toFloat(Arr::get($activity, 'moving_time'));

                return [
                    'id' => Arr::get($activity, 'id'),
                    'source' => 'strava',
                    'name' => (string) Arr::get($activity, 'name', 'Strava activity'),
                    'type' => (string) Arr::get($activity, 'sport_type', Arr::get($activity, 'type', 'Ride')),
                    'date' => (string) Arr::get($activity, 'start_date_local', Arr::get($activity, 'start_date')),
                    'distanceKm' => $distanceKm,
                    'durationMin' => $this->secondsToMinutes($durationSeconds),
                    'elevationM' => (int) round($this->toFloat(Arr::get($activity, 'total_elevation_gain'))),
                    'avgSpeedKmh' => $this->metersPerSecondToKilometersPerHour($this->toFloat(Arr::get($activity, 'average_speed'))),
                    'maxSpeedKmh' => $this->metersPerSecondToKilometersPerHour($this->toFloat(Arr::get($activity, 'max_speed'))),
                    'paceMinPerKm' => $this->minutesPerKilometer($durationSeconds, $distanceKm),
                    'avgHr' => (int) round($this->toFloat(Arr::get($activity, 'average_heartrate'))),
                    'maxHr' => (int) round($this->toFloat(Arr::get($activity, 'max_heartrate'))),
                    'avgPower' => (int) round($this->toFloat(Arr::get($activity, 'average_watts'))),
                    'calories' => (int) round($this->toFloat(Arr::get($activity, 'calories'))),
                    'trainingLoad' => (int) round($this->toFloat(Arr::get($activity, 'suffer_score'))),
                    'isDetailed' => false,
                    'splits' => [],
                ];
            })
            ->all();
    }

    private function mapGarminActivities(array $activities): array
    {
        return collect($activities)
            ->map(function (array $activity): array {
                $durationRaw = $this->toFloat(Arr::get($activity, 'duration'));
                $durationSeconds = $durationRaw > 1000000 ? $durationRaw / 1000 : $durationRaw;

                return [
                    'id' => Arr::get($activity, 'activityId', Arr::get($activity, 'id')),
                    'source' => 'garmin',
                    'name' => (string) Arr::get($activity, 'activityName', 'Garmin activity'),
                    'type' => (string) Arr::get($activity, 'activityType.typeKey', 'Ride'),
                    'date' => (string) Arr::get($activity, 'startTimeLocal', Arr::get($activity, 'startTimeGMT')),
                    'distanceKm' => $this->metersToKilometers($this->toFloat(Arr::get($activity, 'distance'))),
                    'durationMin' => $this->secondsToMinutes($durationSeconds),
                    'elevationM' => (int) round($this->toFloat(Arr::get($activity, 'elevationGain'))),
                    'calories' => (int) round($this->toFloat(Arr::get($activity, 'calories'))),
                    'avgHr' => (int) round($this->toFloat(Arr::get($activity, 'averageHR'))),
                    'maxHr' => (int) round($this->toFloat(Arr::get($activity, 'maxHR'))),
                    'avgSpeedKmh' => $this->metersPerSecondToKilometersPerHour($this->toFloat(Arr::get($activity, 'averageSpeed'))),
                    'maxSpeedKmh' => $this->metersPerSecondToKilometersPerHour($this->toFloat(Arr::get($activity, 'maxSpeed'))),
                    'paceMinPerKm' => $this->minutesPerKilometer($durationSeconds, $this->metersToKilometers($this->toFloat(Arr::get($activity, 'distance')))),
                    'steps' => (int) round($this->toFloat(Arr::get($activity, 'steps'))),
                    'trainingLoad' => (int) round($this->toFloat(Arr::get($activity, 'activityTrainingLoad'))),
                    'trainingEffectLabel' => (string) Arr::get($activity, 'trainingEffectLabel', ''),
                    'isDetailed' => false,
                    'splits' => [],
                ];
            })
            ->all();
    }

    private function emptyGarminPayload(): array
    {
        return [
            'available' => false,
            'generatedAt' => null,
            'sourceDir' => null,
            'coverage' => [
                'startDate' => null,
                'endDate' => null,
            ],
            'profile' => null,
            'activityKpis' => [],
            'today' => [
                'kpis' => [],
            ],
            'sleep' => [
                'recent' => [],
                'kpis' => [],
            ],
            'weekly' => [],
            'recentActivities' => [],
        ];
    }

    private function toFloat(mixed $value): float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }

        return 0.0;
    }

    private function metersToKilometers(float $meters): float
    {
        return round($meters / 1000, 1);
    }

    private function secondsToHours(float $seconds): float
    {
        return round($seconds / 3600, 1);
    }

    private function secondsToMinutes(float $seconds): int
    {
        return (int) round($seconds / 60);
    }

    private function metersPerSecondToKilometersPerHour(float $metersPerSecond): float
    {
        if ($metersPerSecond <= 0) {
            return 0.0;
        }

        return round($metersPerSecond * 3.6, 1);
    }

    private function minutesPerKilometer(float $durationSeconds, float $distanceKm): float
    {
        if ($durationSeconds <= 0 || $distanceKm <= 0) {
            return 0.0;
        }

        return round(($durationSeconds / 60) / $distanceKm, 1);
    }

    private function parseDate(mixed $value): ?CarbonImmutable
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse($value);
        } catch (Throwable) {
            return null;
        }
    }
}
