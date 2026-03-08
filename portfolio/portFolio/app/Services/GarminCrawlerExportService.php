<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use JsonException;
use RuntimeException;
use Throwable;

class GarminCrawlerExportService
{
    public function loadLatest(array &$warnings): ?array
    {
        $exportsPath = trim((string) config('services.garmin_crawler.exports_path', ''));

        if ($exportsPath === '') {
            $warnings[] = 'GARMIN_CRAWLER_EXPORTS_PATH is not configured.';

            return null;
        }

        if (! File::isDirectory($exportsPath)) {
            $warnings[] = 'Garmin crawler exports directory not found: ' . $exportsPath . '.';

            return null;
        }

        $latestExportDir = $this->findLatestExportDirectory($exportsPath);

        if ($latestExportDir === null) {
            $warnings[] = 'No Garmin crawler export found in ' . $exportsPath . '.';

            return null;
        }

        try {
            $metadata = $this->readJsonFile($latestExportDir . DIRECTORY_SEPARATOR . 'metadata.json');
            $profilePayload = $this->readJsonFile($latestExportDir . DIRECTORY_SEPARATOR . 'profile.json');
            $activitiesPayload = $this->readJsonFile($latestExportDir . DIRECTORY_SEPARATOR . 'activities.json');
            $activityDetailsPayload = $this->readJsonFile($latestExportDir . DIRECTORY_SEPARATOR . 'activity-details.json', false) ?? [];
            $dailySummariesPayload = $this->readJsonFile($latestExportDir . DIRECTORY_SEPARATOR . 'daily-summaries.json', false) ?? [];
            $sleepPayload = $this->readJsonFile($latestExportDir . DIRECTORY_SEPARATOR . 'sleep.json', false) ?? [];
        } catch (Throwable $exception) {
            $warnings[] = 'Garmin crawler export error: ' . $exception->getMessage();

            return null;
        }

        $profile = is_array(Arr::get($profilePayload, 'data')) ? Arr::get($profilePayload, 'data') : [];
        $activities = is_array(Arr::get($activitiesPayload, 'data')) ? Arr::get($activitiesPayload, 'data') : [];
        $activityDetails = is_array($activityDetailsPayload) ? $activityDetailsPayload : [];
        $dailySummaries = is_array($dailySummariesPayload) ? $dailySummariesPayload : [];
        $sleepEntries = is_array($sleepPayload) ? $sleepPayload : [];

        $normalizedActivities = $this->normalizeActivities($activities, $activityDetails);
        $normalizedSleep = $this->normalizeSleepEntries($sleepEntries);
        $normalizedDaily = $this->normalizeDailyEntries($dailySummaries, $normalizedSleep);

        $latestDaily = collect($normalizedDaily)->first();
        $latestSleep = collect($normalizedSleep)->first();
        $recentSleep = collect($normalizedSleep)->take(7)->values()->all();

        $weeklyActivities = collect($normalizedActivities)->take(7);
        $weeklyDaily = collect($normalizedDaily)->take(7);

        $weeklyDistanceKm = round($weeklyActivities->sum('distanceKm'), 1);
        $weeklyDurationHours = round($weeklyActivities->sum('durationMin') / 60, 1);
        $weeklyTrainingLoad = (int) round($weeklyActivities->sum('trainingLoad'));
        $weeklyActiveCalories = (int) round($weeklyDaily->sum('activeCalories'));
        $analytics = $this->buildAnalytics($normalizedActivities, $normalizedSleep, $normalizedDaily);

        return [
            'available' => true,
            'generatedAt' => Arr::get($metadata, 'generatedAt'),
            'sourceDir' => $latestExportDir,
            'coverage' => [
                'startDate' => Arr::get($metadata, 'startDate'),
                'endDate' => Arr::get($metadata, 'endDate'),
            ],
            'profile' => [
                'name' => $this->firstNonEmpty([
                    Arr::get($profile, 'fullName'),
                    Arr::get($profile, 'displayName'),
                    Arr::get($profile, 'userName'),
                ], 'Garmin athlete'),
                'displayName' => Arr::get($profile, 'displayName'),
                'username' => Arr::get($profile, 'userName'),
                'avatar' => Arr::get($profile, 'profileImageUrlMedium', Arr::get($profile, 'profileImageUrlLarge')),
                'location' => Arr::get($profile, 'location'),
            ],
            'activityKpis' => [
                [
                    'label' => 'Distance Garmin 7 jours',
                    'value' => $weeklyDistanceKm,
                    'unit' => 'km',
                ],
                [
                    'label' => 'Duree Garmin 7 jours',
                    'value' => $weeklyDurationHours,
                    'unit' => 'h',
                ],
                [
                    'label' => 'Charge Garmin 7 jours',
                    'value' => $weeklyTrainingLoad,
                    'unit' => 'load',
                ],
                [
                    'label' => 'Calories actives 7 jours',
                    'value' => $weeklyActiveCalories,
                    'unit' => 'kcal',
                ],
            ],
            'today' => [
                'date' => Arr::get($latestDaily, 'date'),
                'steps' => (int) Arr::get($latestDaily, 'steps', 0),
                'distanceKm' => (float) Arr::get($latestDaily, 'distanceKm', 0),
                'activeCalories' => (int) Arr::get($latestDaily, 'activeCalories', 0),
                'restingHeartRate' => (int) Arr::get($latestDaily, 'restingHeartRate', 0),
                'stress' => (int) Arr::get($latestDaily, 'stress', 0),
                'bodyBattery' => (int) Arr::get($latestDaily, 'bodyBattery', 0),
                'spo2' => (int) Arr::get($latestDaily, 'spo2', 0),
                'respiration' => (int) Arr::get($latestDaily, 'respiration', 0),
                'kpis' => [
                    [
                        'label' => 'Pas aujourd hui',
                        'value' => (int) Arr::get($latestDaily, 'steps', 0),
                        'unit' => 'steps',
                    ],
                    [
                        'label' => 'Distance aujourd hui',
                        'value' => (float) Arr::get($latestDaily, 'distanceKm', 0),
                        'unit' => 'km',
                    ],
                    [
                        'label' => 'Calories actives',
                        'value' => (int) Arr::get($latestDaily, 'activeCalories', 0),
                        'unit' => 'kcal',
                    ],
                    [
                        'label' => 'Body battery',
                        'value' => (int) Arr::get($latestDaily, 'bodyBattery', 0),
                        'unit' => '/100',
                    ],
                    [
                        'label' => 'Stress moyen',
                        'value' => (int) Arr::get($latestDaily, 'stress', 0),
                        'unit' => '/100',
                    ],
                    [
                        'label' => 'FC repos',
                        'value' => (int) Arr::get($latestDaily, 'restingHeartRate', 0),
                        'unit' => 'bpm',
                    ],
                ],
            ],
            'sleep' => [
                'date' => Arr::get($latestSleep, 'date'),
                'hours' => (float) Arr::get($latestSleep, 'hours', 0),
                'score' => Arr::get($latestSleep, 'score'),
                'scoreLabel' => Arr::get($latestSleep, 'scoreLabel'),
                'startAt' => Arr::get($latestSleep, 'startAt'),
                'endAt' => Arr::get($latestSleep, 'endAt'),
                'timeInBedMinutes' => (int) Arr::get($latestSleep, 'timeInBedMinutes', 0),
                'efficiencyPercent' => Arr::get($latestSleep, 'efficiencyPercent'),
                'napMinutes' => (int) Arr::get($latestSleep, 'napMinutes', 0),
                'deepMinutes' => (int) Arr::get($latestSleep, 'deepMinutes', 0),
                'lightMinutes' => (int) Arr::get($latestSleep, 'lightMinutes', 0),
                'remMinutes' => (int) Arr::get($latestSleep, 'remMinutes', 0),
                'awakeMinutes' => (int) Arr::get($latestSleep, 'awakeMinutes', 0),
                'awakeCount' => (int) Arr::get($latestSleep, 'awakeCount', 0),
                'avgSleepStress' => (int) Arr::get($latestSleep, 'avgSleepStress', 0),
                'avgHeartRate' => (int) Arr::get($latestSleep, 'avgHeartRate', 0),
                'restingHeartRate' => (int) Arr::get($latestSleep, 'restingHeartRate', 0),
                'avgSpO2' => (int) Arr::get($latestSleep, 'avgSpO2', 0),
                'minSpO2' => (int) Arr::get($latestSleep, 'minSpO2', 0),
                'maxSpO2' => (int) Arr::get($latestSleep, 'maxSpO2', 0),
                'avgRespiration' => (int) Arr::get($latestSleep, 'avgRespiration', 0),
                'minRespiration' => (int) Arr::get($latestSleep, 'minRespiration', 0),
                'maxRespiration' => (int) Arr::get($latestSleep, 'maxRespiration', 0),
                'avgOvernightHrv' => (int) Arr::get($latestSleep, 'avgOvernightHrv', 0),
                'hrvStatus' => Arr::get($latestSleep, 'hrvStatus'),
                'bodyBatteryChange' => (int) Arr::get($latestSleep, 'bodyBatteryChange', 0),
                'avgSkinTempDeviationC' => Arr::get($latestSleep, 'avgSkinTempDeviationC'),
                'breathingDisruptionSeverity' => Arr::get($latestSleep, 'breathingDisruptionSeverity'),
                'sleepNeedMinutes' => (int) Arr::get($latestSleep, 'sleepNeedMinutes', 0),
                'sleepNeedBaselineMinutes' => (int) Arr::get($latestSleep, 'sleepNeedBaselineMinutes', 0),
                'sleepNeedDeltaMinutes' => (int) Arr::get($latestSleep, 'sleepNeedDeltaMinutes', 0),
                'sleepNeedFeedback' => Arr::get($latestSleep, 'sleepNeedFeedback'),
                'durationLabel' => Arr::get($latestSleep, 'durationLabel'),
                'stressLabel' => Arr::get($latestSleep, 'stressLabel'),
                'awakeLabel' => Arr::get($latestSleep, 'awakeLabel'),
                'remLabel' => Arr::get($latestSleep, 'remLabel'),
                'lightLabel' => Arr::get($latestSleep, 'lightLabel'),
                'deepLabel' => Arr::get($latestSleep, 'deepLabel'),
                'restlessnessLabel' => Arr::get($latestSleep, 'restlessnessLabel'),
                'insight' => Arr::get($latestSleep, 'insight'),
                'personalizedInsight' => Arr::get($latestSleep, 'personalizedInsight'),
                'recent' => $recentSleep,
                'kpis' => [
                    [
                        'label' => 'Sommeil nuit',
                        'value' => (float) Arr::get($latestSleep, 'hours', 0),
                        'unit' => 'h',
                    ],
                    [
                        'label' => 'Sleep score',
                        'value' => (int) Arr::get($latestSleep, 'score', 0),
                        'unit' => '/100',
                    ],
                    [
                        'label' => 'Efficacite',
                        'value' => Arr::get($latestSleep, 'efficiencyPercent'),
                        'unit' => '%',
                    ],
                    [
                        'label' => 'HRV nuit',
                        'value' => (int) Arr::get($latestSleep, 'avgOvernightHrv', 0),
                        'unit' => 'ms',
                    ],
                    [
                        'label' => 'SpO2 nuit',
                        'value' => (int) Arr::get($latestSleep, 'avgSpO2', 0),
                        'unit' => '%',
                    ],
                    [
                        'label' => 'FC sommeil',
                        'value' => (int) Arr::get($latestSleep, 'avgHeartRate', 0),
                        'unit' => 'bpm',
                    ],
                    [
                        'label' => 'Body battery +',
                        'value' => (int) Arr::get($latestSleep, 'bodyBatteryChange', 0),
                        'unit' => 'pts',
                    ],
                    [
                        'label' => 'Reveils',
                        'value' => (int) Arr::get($latestSleep, 'awakeCount', 0),
                        'unit' => '',
                    ],
                ],
            ],
            'analytics' => $analytics,
            'weekly' => $weeklyDaily->all(),
            'recentActivities' => collect($normalizedActivities)->take(8)->all(),
        ];
    }

    private function findLatestExportDirectory(string $exportsPath): ?string
    {
        return collect(File::directories($exportsPath))
            ->filter(fn (string $directory): bool => File::exists($directory . DIRECTORY_SEPARATOR . 'metadata.json'))
            ->sortByDesc(fn (string $directory): int => File::lastModified($directory))
            ->first();
    }

    private function readJsonFile(string $path, bool $required = true): mixed
    {
        if (! File::exists($path)) {
            if ($required) {
                throw new RuntimeException('Missing Garmin export file: ' . $path);
            }

            return null;
        }

        try {
            return json_decode(File::get($path), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException('Invalid JSON in ' . $path . ': ' . $exception->getMessage(), 0, $exception);
        }
    }

    private function normalizeActivities(array $activities, array $activityDetails): array
    {
        $detailsById = collect($activityDetails)
            ->filter(fn ($entry): bool => is_array($entry))
            ->mapWithKeys(function (array $entry): array {
                $activityId = (string) ($entry['activityId'] ?? Arr::get($entry, 'data.activityId', ''));
                $data = Arr::get($entry, 'data', []);

                if ($activityId === '' || ! is_array($data)) {
                    return [];
                }

                return [$activityId => $data];
            });

        return collect($activities)
            ->filter(fn ($activity): bool => is_array($activity))
            ->map(function (array $activity) use ($detailsById): array {
                $activityId = (string) Arr::get($activity, 'activityId', Arr::get($activity, 'id', ''));
                $detail = $activityId !== '' ? $detailsById->get($activityId, []) : [];
                $summary = is_array(Arr::get($detail, 'summaryDTO')) ? Arr::get($detail, 'summaryDTO') : [];
                $metadata = is_array(Arr::get($detail, 'metadataDTO')) ? Arr::get($detail, 'metadataDTO') : [];
                $distanceKm = round($this->toFloat(Arr::get($summary, 'distance', Arr::get($activity, 'distance'))) / 1000, 1);

                $duration = $this->normalizeDurationSeconds(
                    $summary['duration'] ?? $activity['duration'] ?? 0
                );

                $durationMin = (int) round($duration / 60);
                $avgSpeedKmh = $this->metersPerSecondToKilometersPerHour(
                    $this->toFloat(Arr::get($summary, 'averageSpeed', Arr::get($activity, 'averageSpeed')))
                );
                $maxSpeedKmh = $this->metersPerSecondToKilometersPerHour(
                    $this->toFloat(Arr::get($summary, 'maxSpeed', Arr::get($activity, 'maxSpeed')))
                );
                $paceMinPerKm = $this->minutesPerKilometer($duration, $distanceKm);
                $splits = collect(Arr::get($detail, 'splitSummaries', []))
                    ->filter(fn ($split): bool => is_array($split))
                    ->map(function (array $split): array {
                        $splitDistanceKm = round($this->toFloat(Arr::get($split, 'distance')) / 1000, 1);
                        $splitDurationSeconds = $this->normalizeDurationSeconds(Arr::get($split, 'duration'));

                        return [
                            'label' => $this->humanizeSplitType((string) Arr::get($split, 'splitType', 'split')),
                            'type' => (string) Arr::get($split, 'splitType', 'split'),
                            'count' => (int) round($this->toFloat(Arr::get($split, 'noOfSplits'))),
                            'distanceKm' => $splitDistanceKm,
                            'durationMin' => round($splitDurationSeconds / 60, 1),
                            'avgSpeedKmh' => $this->metersPerSecondToKilometersPerHour($this->toFloat(Arr::get($split, 'averageSpeed'))),
                            'avgHr' => (int) round($this->toFloat(Arr::get($split, 'averageHR'))),
                            'avgPower' => (int) round($this->toFloat(Arr::get($split, 'averagePower'))),
                            'calories' => (int) round($this->toFloat(Arr::get($split, 'calories'))),
                            'paceMinPerKm' => $this->minutesPerKilometer($splitDurationSeconds, $splitDistanceKm),
                        ];
                    })
                    ->values()
                    ->all();

                return [
                    'id' => $activityId,
                    'source' => 'garmin',
                    'name' => (string) Arr::get($activity, 'activityName', Arr::get($detail, 'activityName', 'Garmin activity')),
                    'type' => $this->humanizeType(
                        (string) Arr::get($detail, 'activityTypeDTO.typeKey', Arr::get($activity, 'activityType.typeKey', 'activity'))
                    ),
                    'date' => $this->normalizeDateString(
                        Arr::get($summary, 'startTimeLocal', Arr::get($activity, 'startTimeLocal', Arr::get($summary, 'startTimeGMT', Arr::get($activity, 'startTimeGMT'))))
                    ),
                    'eventType' => $this->humanizeType((string) Arr::get($detail, 'eventTypeDTO.typeKey', Arr::get($activity, 'eventType.typeKey', 'activity'))),
                    'distanceKm' => $distanceKm,
                    'durationMin' => $durationMin,
                    'elevationM' => (int) round($this->toFloat(Arr::get($summary, 'elevationGain', Arr::get($activity, 'elevationGain')))),
                    'calories' => (int) round($this->toFloat(Arr::get($summary, 'calories', Arr::get($activity, 'calories')))),
                    'avgHr' => (int) round($this->toFloat(Arr::get($summary, 'averageHR', Arr::get($activity, 'averageHR')))),
                    'maxHr' => (int) round($this->toFloat(Arr::get($summary, 'maxHR', Arr::get($activity, 'maxHR')))),
                    'minHr' => (int) round($this->toFloat(Arr::get($summary, 'minHR'))),
                    'steps' => (int) round($this->toFloat(Arr::get($summary, 'steps', Arr::get($activity, 'steps')))),
                    'trainingLoad' => (int) round($this->toFloat(Arr::get($summary, 'activityTrainingLoad', Arr::get($activity, 'activityTrainingLoad')))),
                    'trainingEffectLabel' => (string) Arr::get($summary, 'trainingEffectLabel', Arr::get($activity, 'trainingEffectLabel', '')),
                    'trainingEffect' => round($this->toFloat(Arr::get($summary, 'trainingEffect')), 1),
                    'anaerobicTrainingEffect' => round($this->toFloat(Arr::get($summary, 'anaerobicTrainingEffect')), 1),
                    'aerobicMessage' => $this->humanizeType((string) Arr::get($summary, 'aerobicTrainingEffectMessage', '')),
                    'anaerobicMessage' => $this->humanizeType((string) Arr::get($summary, 'anaerobicTrainingEffectMessage', '')),
                    'avgSpeedKmh' => $avgSpeedKmh,
                    'maxSpeedKmh' => $maxSpeedKmh,
                    'paceMinPerKm' => $paceMinPerKm,
                    'avgPower' => (int) round($this->toFloat(Arr::get($summary, 'averagePower', Arr::get($activity, 'avgPower')))),
                    'maxPower' => (int) round($this->toFloat(Arr::get($summary, 'maxPower', Arr::get($activity, 'maxPower')))),
                    'normalizedPower' => (int) round($this->toFloat(Arr::get($summary, 'normalizedPower', Arr::get($activity, 'normPower')))),
                    'avgCadence' => (int) round($this->toFloat(Arr::get($summary, 'averageRunCadence', Arr::get($activity, 'averageRunningCadenceInStepsPerMinute')))),
                    'maxCadence' => (int) round($this->toFloat(Arr::get($summary, 'maxRunCadence', Arr::get($activity, 'maxRunningCadenceInStepsPerMinute')))),
                    'moderateIntensityMinutes' => (int) round($this->toFloat(Arr::get($summary, 'moderateIntensityMinutes', Arr::get($activity, 'moderateIntensityMinutes')))),
                    'vigorousIntensityMinutes' => (int) round($this->toFloat(Arr::get($summary, 'vigorousIntensityMinutes', Arr::get($activity, 'vigorousIntensityMinutes')))),
                    'waterEstimatedMl' => (int) round($this->toFloat(Arr::get($summary, 'waterEstimated', Arr::get($activity, 'waterEstimated')))),
                    'groundContactTimeMs' => round($this->toFloat(Arr::get($summary, 'groundContactTime')), 1),
                    'strideLengthCm' => round($this->toFloat(Arr::get($summary, 'strideLength')), 1),
                    'verticalOscillationCm' => round($this->toFloat(Arr::get($summary, 'verticalOscillation')), 1),
                    'verticalRatio' => round($this->toFloat(Arr::get($summary, 'verticalRatio')), 1),
                    'staminaStart' => (int) round($this->toFloat(Arr::get($summary, 'beginPotentialStamina'))),
                    'staminaEnd' => (int) round($this->toFloat(Arr::get($summary, 'endPotentialStamina'))),
                    'staminaMin' => (int) round($this->toFloat(Arr::get($summary, 'minAvailableStamina'))),
                    'bodyBatteryDelta' => (int) round($this->toFloat(Arr::get($summary, 'differenceBodyBattery', Arr::get($activity, 'differenceBodyBattery')))),
                    'lapCount' => (int) round($this->toFloat(Arr::get($metadata, 'lapCount', Arr::get($activity, 'lapCount')))),
                    'device' => (string) Arr::get($metadata, 'manufacturer', Arr::get($activity, 'manufacturer', 'GARMIN')),
                    'uploadedAt' => $this->normalizeDateString(Arr::get($metadata, 'uploadedDate')),
                    'isDetailed' => ! empty($detail),
                    'splits' => $splits,
                ];
            })
            ->sortByDesc(function (array $activity): int {
                return $this->parseDate($activity['date'])?->getTimestamp() ?? 0;
            })
            ->values()
            ->all();
    }

    private function normalizeSleepEntries(array $sleepEntries): array
    {
        return collect($sleepEntries)
            ->filter(fn ($entry): bool => is_array($entry))
            ->map(function (array $entry): array {
                $sleep = is_array(Arr::get($entry, 'data.dailySleepDTO')) ? Arr::get($entry, 'data.dailySleepDTO') : [];
                $sleepTimeSeconds = $this->toFloat(Arr::get($sleep, 'sleepTimeSeconds'));
                $sleepStartTimestamp = Arr::get($sleep, 'sleepStartTimestampGMT');
                $sleepEndTimestamp = Arr::get($sleep, 'sleepEndTimestampGMT');
                $timeInBedSeconds = 0.0;

                if (is_numeric($sleepStartTimestamp) && is_numeric($sleepEndTimestamp)) {
                    $timeInBedSeconds = max(0.0, ($this->toFloat($sleepEndTimestamp) - $this->toFloat($sleepStartTimestamp)) / 1000);
                }

                return [
                    'date' => (string) Arr::get($entry, 'date', Arr::get($sleep, 'calendarDate')),
                    'hours' => round($sleepTimeSeconds / 3600, 1),
                    'score' => Arr::get($sleep, 'sleepScores.overall.value'),
                    'scoreLabel' => $this->humanizeType((string) Arr::get($sleep, 'sleepScores.overall.qualifierKey', '')),
                    'startAt' => $this->timestampMsToIsoString($sleepStartTimestamp),
                    'endAt' => $this->timestampMsToIsoString($sleepEndTimestamp),
                    'timeInBedMinutes' => (int) round($timeInBedSeconds / 60),
                    'efficiencyPercent' => $timeInBedSeconds > 0 ? (int) round(($sleepTimeSeconds / $timeInBedSeconds) * 100) : null,
                    'napMinutes' => (int) round($this->toFloat(Arr::get($sleep, 'napTimeSeconds')) / 60),
                    'deepMinutes' => (int) round($this->toFloat(Arr::get($sleep, 'deepSleepSeconds')) / 60),
                    'lightMinutes' => (int) round($this->toFloat(Arr::get($sleep, 'lightSleepSeconds')) / 60),
                    'remMinutes' => (int) round($this->toFloat(Arr::get($sleep, 'remSleepSeconds')) / 60),
                    'awakeMinutes' => (int) round($this->toFloat(Arr::get($sleep, 'awakeSleepSeconds')) / 60),
                    'awakeCount' => (int) round($this->toFloat(Arr::get($sleep, 'awakeCount'))),
                    'avgSleepStress' => (int) round($this->toFloat(Arr::get($sleep, 'avgSleepStress'))),
                    'avgHeartRate' => (int) round($this->toFloat(Arr::get($sleep, 'avgHeartRate'))),
                    'restingHeartRate' => (int) round($this->toFloat(Arr::get($entry, 'data.restingHeartRate'))),
                    'avgSpO2' => (int) round($this->toFloat(Arr::get($sleep, 'averageSpO2Value'))),
                    'minSpO2' => (int) round($this->toFloat(Arr::get($sleep, 'lowestSpO2Value'))),
                    'maxSpO2' => (int) round($this->toFloat(Arr::get($sleep, 'highestSpO2Value'))),
                    'avgRespiration' => (int) round($this->toFloat(Arr::get($sleep, 'averageRespirationValue'))),
                    'minRespiration' => (int) round($this->toFloat(Arr::get($sleep, 'lowestRespirationValue'))),
                    'maxRespiration' => (int) round($this->toFloat(Arr::get($sleep, 'highestRespirationValue'))),
                    'avgOvernightHrv' => (int) round($this->toFloat(Arr::get($entry, 'data.avgOvernightHrv'))),
                    'hrvStatus' => $this->humanizeType((string) Arr::get($entry, 'data.hrvStatus', '')),
                    'bodyBatteryChange' => (int) round($this->toFloat(Arr::get($entry, 'data.bodyBatteryChange'))),
                    'avgSkinTempDeviationC' => round($this->toFloat(Arr::get($entry, 'data.avgSkinTempDeviationC')), 1),
                    'breathingDisruptionSeverity' => $this->humanizeType((string) Arr::get($sleep, 'breathingDisruptionSeverity', Arr::get($entry, 'data.breathingDisruptionSeverity', ''))),
                    'sleepNeedMinutes' => (int) round($this->toFloat(Arr::get($sleep, 'sleepNeed.actual'))),
                    'sleepNeedBaselineMinutes' => (int) round($this->toFloat(Arr::get($sleep, 'sleepNeed.baseline'))),
                    'sleepNeedDeltaMinutes' => (int) round(
                        $this->toFloat(Arr::get($sleep, 'sleepNeed.actual')) - $this->toFloat(Arr::get($sleep, 'sleepNeed.baseline'))
                    ),
                    'sleepNeedFeedback' => $this->humanizeType((string) Arr::get($sleep, 'sleepNeed.feedback', '')),
                    'durationLabel' => $this->humanizeType((string) Arr::get($sleep, 'sleepScores.totalDuration.qualifierKey', '')),
                    'stressLabel' => $this->humanizeType((string) Arr::get($sleep, 'sleepScores.stress.qualifierKey', '')),
                    'awakeLabel' => $this->humanizeType((string) Arr::get($sleep, 'sleepScores.awakeCount.qualifierKey', '')),
                    'remLabel' => $this->humanizeType((string) Arr::get($sleep, 'sleepScores.remPercentage.qualifierKey', '')),
                    'lightLabel' => $this->humanizeType((string) Arr::get($sleep, 'sleepScores.lightPercentage.qualifierKey', '')),
                    'deepLabel' => $this->humanizeType((string) Arr::get($sleep, 'sleepScores.deepPercentage.qualifierKey', '')),
                    'restlessnessLabel' => $this->humanizeType((string) Arr::get($sleep, 'sleepScores.restlessness.qualifierKey', '')),
                    'insight' => $this->humanizeType((string) Arr::get($sleep, 'sleepScoreInsight', '')),
                    'personalizedInsight' => $this->humanizeType((string) Arr::get($sleep, 'sleepScorePersonalizedInsight', '')),
                ];
            })
            ->filter(fn (array $entry): bool => $entry['date'] !== '')
            ->sortByDesc(fn (array $entry): int => $this->parseDate($entry['date'])?->getTimestamp() ?? 0)
            ->values()
            ->all();
    }

    private function normalizeDailyEntries(array $dailySummaries, array $normalizedSleep): array
    {
        $sleepByDate = collect($normalizedSleep)->keyBy('date');

        return collect($dailySummaries)
            ->filter(fn ($entry): bool => is_array($entry))
            ->map(function (array $entry) use ($sleepByDate): array {
                $summary = is_array(Arr::get($entry, 'usersummary.data')) ? Arr::get($entry, 'usersummary.data') : [];
                $date = (string) Arr::get($entry, 'date', Arr::get($summary, 'calendarDate'));
                $sleep = $sleepByDate->get($date, []);

                return [
                    'date' => $date,
                    'steps' => (int) round($this->toFloat(Arr::get($summary, 'totalSteps'))),
                    'distanceKm' => round($this->toFloat(Arr::get($summary, 'totalDistanceMeters')) / 1000, 1),
                    'activeCalories' => (int) round($this->toFloat(Arr::get($summary, 'activeKilocalories'))),
                    'restingHeartRate' => (int) round($this->toFloat(Arr::get($summary, 'restingHeartRate'))),
                    'stress' => (int) round($this->toFloat(Arr::get($summary, 'averageStressLevel'))),
                    'bodyBattery' => (int) round($this->toFloat(Arr::get($summary, 'bodyBatteryMostRecentValue'))),
                    'spo2' => (int) round($this->toFloat(Arr::get($summary, 'averageSpo2'))),
                    'respiration' => (int) round($this->toFloat(Arr::get($summary, 'latestRespirationValue'))),
                    'sleepHours' => (float) Arr::get($sleep, 'hours', round($this->toFloat(Arr::get($summary, 'sleepingSeconds')) / 3600, 1)),
                    'sleepScore' => Arr::get($sleep, 'score'),
                ];
            })
            ->filter(fn (array $entry): bool => $entry['date'] !== '')
            ->sortByDesc(fn (array $entry): int => $this->parseDate($entry['date'])?->getTimestamp() ?? 0)
            ->values()
            ->all();
    }

    private function buildAnalytics(array $activities, array $sleepEntries, array $dailyEntries): array
    {
        return [
            'recovery' => $this->buildRecoveryAnalytics($sleepEntries),
            'correlations' => $this->buildCorrelationAnalytics($sleepEntries),
            'fatigue' => $this->buildFatigueAnalytics($activities, $sleepEntries, $dailyEntries),
            'runningQuality' => $this->buildRunningQualityAnalytics($activities),
            'temperature' => $this->buildTemperatureAnalytics($sleepEntries),
            'weeklyBlocks' => $this->buildWeeklyBlocks($activities, $sleepEntries, $dailyEntries),
        ];
    }

    private function buildRecoveryAnalytics(array $sleepEntries): array
    {
        $nights = collect($sleepEntries)->take(14)->values();
        $sampleSize = $nights->count();
        $sleepHours = $this->collectNumericField($nights->all(), 'hours');
        $sleepScores = $this->collectNumericField($nights->all(), 'score');
        $overnightHrv = $this->collectNumericField($nights->all(), 'avgOvernightHrv');
        $bodyBatteryGain = $this->collectNumericField($nights->all(), 'bodyBatteryChange', true);
        $sleepStress = $this->collectNumericField($nights->all(), 'avgSleepStress', true);
        $sleepNeedHours = $nights
            ->map(fn (array $night): ?float => $this->resolveSleepNeedHours($night))
            ->filter(fn (?float $value): bool => $value !== null)
            ->values();

        $targetSleepHours = $sleepNeedHours->isNotEmpty()
            ? round((float) $sleepNeedHours->avg(), 1)
            : 8.0;
        $sleepDebtHours = $this->sumSleepDebt($nights->all(), $targetSleepHours);
        $nightsBelowTarget = (int) $nights
            ->filter(function (array $night) use ($targetSleepHours): bool {
                $hours = $this->numericOrNull(Arr::get($night, 'hours'));
                $needHours = $this->resolveSleepNeedHours($night) ?? $targetSleepHours;

                return $hours !== null && $hours < $needHours;
            })
            ->count();
        $averageSleepHours = $sleepHours->isNotEmpty() ? round((float) $sleepHours->avg(), 1) : null;
        $averageSleepScore = $sleepScores->isNotEmpty() ? (int) round((float) $sleepScores->avg()) : null;
        $averageHrv = $overnightHrv->isNotEmpty() ? (int) round((float) $overnightHrv->avg()) : null;
        $averageBodyBatteryGain = $bodyBatteryGain->isNotEmpty() ? (int) round((float) $bodyBatteryGain->avg()) : null;
        $averageSleepStress = $sleepStress->isNotEmpty() ? (int) round((float) $sleepStress->avg()) : null;
        $sleepHoursDelta = $this->calculateWindowDelta($nights->all(), 'hours');
        $sleepScoreDelta = $this->calculateWindowDelta($nights->all(), 'score');
        $bodyBatteryDelta = $this->calculateWindowDelta($nights->all(), 'bodyBatteryChange', 3, true);

        $status = 'Recuperation en construction';
        if ($sampleSize > 0) {
            if ($sleepDebtHours >= 5 || ($averageSleepScore !== null && $averageSleepScore < 60) || ($averageBodyBatteryGain !== null && $averageBodyBatteryGain < 45)) {
                $status = 'Recuperation fragile';
            } elseif ($sleepDebtHours >= 2.5 || ($averageSleepScore !== null && $averageSleepScore < 72) || ($averageBodyBatteryGain !== null && $averageBodyBatteryGain < 60)) {
                $status = 'Recuperation surveillee';
            } else {
                $status = 'Recuperation solide';
            }
        }

        $summaryParts = [];
        if ($averageSleepHours !== null) {
            $summaryParts[] = $averageSleepHours . ' h de sommeil moyen';
        }
        if ($sleepDebtHours > 0) {
            $summaryParts[] = $sleepDebtHours . ' h de deficit cumule';
        }
        if ($averageBodyBatteryGain !== null) {
            $summaryParts[] = 'recharge nocturne +' . $averageBodyBatteryGain . ' pts';
        }

        return [
            'sampleSize' => $sampleSize,
            'targetSleepHours' => $targetSleepHours,
            'averageSleepHours' => $averageSleepHours,
            'sleepDebtHours' => $sleepDebtHours,
            'nightsBelowTarget' => $nightsBelowTarget,
            'averageSleepScore' => $averageSleepScore,
            'averageHrv' => $averageHrv,
            'averageBodyBatteryGain' => $averageBodyBatteryGain,
            'averageSleepStress' => $averageSleepStress,
            'sleepHoursDelta' => $sleepHoursDelta,
            'sleepScoreDelta' => $sleepScoreDelta,
            'bodyBatteryDelta' => $bodyBatteryDelta,
            'status' => $status,
            'summary' => $summaryParts !== []
                ? implode(' - ', $summaryParts)
                : 'Pas assez de nuits pour evaluer la recuperation.',
        ];
    }

    private function buildCorrelationAnalytics(array $sleepEntries): array
    {
        return [
            $this->buildCorrelationMetric($sleepEntries, 'hours', 'avgOvernightHrv', 'Sommeil vs HRV', 'positive'),
            $this->buildCorrelationMetric($sleepEntries, 'hours', 'bodyBatteryChange', 'Sommeil vs body battery', 'positive', true),
            $this->buildCorrelationMetric($sleepEntries, 'hours', 'avgSleepStress', 'Sommeil vs stress', 'negative', true),
        ];
    }

    private function buildCorrelationMetric(
        array $entries,
        string $leftKey,
        string $rightKey,
        string $label,
        string $favorableDirection,
        bool $allowZeroRight = false
    ): array {
        $pairs = collect($entries)
            ->map(function (array $entry) use ($leftKey, $rightKey, $allowZeroRight): ?array {
                $left = $this->numericOrNull(Arr::get($entry, $leftKey));
                $right = $this->numericOrNull(Arr::get($entry, $rightKey), $allowZeroRight);

                if ($left === null || $right === null) {
                    return null;
                }

                return [
                    'left' => $left,
                    'right' => $right,
                ];
            })
            ->filter(fn (?array $pair): bool => $pair !== null)
            ->values();

        $coefficient = $this->pearsonCorrelation(
            $pairs->pluck('left')->all(),
            $pairs->pluck('right')->all()
        );
        $favorable = $coefficient !== null
            ? match ($favorableDirection) {
                'negative' => $coefficient <= -0.2,
                default => $coefficient >= 0.2,
            }
            : null;

        return [
            'label' => $label,
            'coefficient' => $coefficient,
            'relationship' => $this->describeCorrelation($coefficient),
            'sampleSize' => $pairs->count(),
            'favorable' => $favorable,
            'insight' => $coefficient === null
                ? 'Donnees insuffisantes'
                : ($favorable === true
                    ? 'Signal coherent'
                    : (abs($coefficient) < 0.2 ? 'Signal faible' : 'Relation a surveiller')),
        ];
    }

    private function buildFatigueAnalytics(array $activities, array $sleepEntries, array $dailyEntries): array
    {
        $trackedDates = collect($dailyEntries)
            ->pluck('date')
            ->merge(collect($sleepEntries)->pluck('date'))
            ->merge(collect($activities)->pluck('date'))
            ->filter(fn ($date): bool => is_string($date) && $date !== '')
            ->unique()
            ->sortDesc()
            ->values();
        $recentDates = $trackedDates->take(7);
        $previousDates = $trackedDates->skip(7)->take(7);
        $recentActivities = collect($activities)
            ->filter(fn (array $activity): bool => $recentDates->contains($activity['date'] ?? null))
            ->values();
        $previousActivities = collect($activities)
            ->filter(fn (array $activity): bool => $previousDates->contains($activity['date'] ?? null))
            ->values();
        $recentSleep = collect($sleepEntries)
            ->filter(fn (array $night): bool => $recentDates->contains($night['date'] ?? null))
            ->values();
        $acuteLoad = (int) round($recentActivities->sum('trainingLoad'));
        $previousLoad = (int) round($previousActivities->sum('trainingLoad'));
        $loadRatio = $previousLoad > 0
            ? round($acuteLoad / max($previousLoad, 1), 2)
            : null;
        $highIntensitySessions = (int) $recentActivities
            ->filter(fn (array $activity): bool => $this->isHighIntensityActivity($activity))
            ->count();
        $activeDays = (int) $recentActivities
            ->pluck('date')
            ->filter()
            ->unique()
            ->count();
        $restDays = max($recentDates->count() - $activeDays, 0);
        $averageSleepHours = $this->roundCollectionAverage($recentSleep->all(), 'hours');
        $averageBodyBatteryGain = $this->roundCollectionAverage($recentSleep->all(), 'bodyBatteryChange', true, 0);
        $averageSleepStress = $this->roundCollectionAverage($recentSleep->all(), 'avgSleepStress', true, 0);
        $sleepDebtHours = $this->sumSleepDebt($recentSleep->all());

        $riskScore = 0;
        if ($acuteLoad >= 1200) {
            $riskScore += 35;
        } elseif ($acuteLoad >= 800) {
            $riskScore += 25;
        } elseif ($acuteLoad >= 500) {
            $riskScore += 15;
        }

        if ($loadRatio !== null) {
            if ($loadRatio >= 1.35) {
                $riskScore += 25;
            } elseif ($loadRatio >= 1.15) {
                $riskScore += 15;
            }
        }

        if ($highIntensitySessions >= 4) {
            $riskScore += 15;
        } elseif ($highIntensitySessions >= 2) {
            $riskScore += 8;
        }

        if ($restDays <= 1 && $recentDates->count() >= 5) {
            $riskScore += 10;
        }

        if ($sleepDebtHours >= 5) {
            $riskScore += 20;
        } elseif ($sleepDebtHours >= 2) {
            $riskScore += 10;
        }

        if ($averageBodyBatteryGain !== null) {
            if ($averageBodyBatteryGain < 50) {
                $riskScore += 10;
            } elseif ($averageBodyBatteryGain < 60) {
                $riskScore += 5;
            }
        }

        if ($averageSleepStress !== null) {
            if ($averageSleepStress >= 25) {
                $riskScore += 10;
            } elseif ($averageSleepStress >= 18) {
                $riskScore += 5;
            }
        }

        $riskScore = max(0, min($riskScore, 100));
        $status = $riskScore >= 60
            ? 'Risque eleve'
            : ($riskScore >= 35 ? 'Risque modere' : 'Charge controlee');

        $summaryParts = [];
        if ($acuteLoad > 0) {
            $summaryParts[] = 'charge recente ' . $acuteLoad;
        }
        if ($highIntensitySessions > 0) {
            $summaryParts[] = $highIntensitySessions . ' seances intenses';
        }
        if ($sleepDebtHours > 0) {
            $summaryParts[] = $sleepDebtHours . ' h de sommeil manquant';
        }

        return [
            'windowDays' => $recentDates->count(),
            'acuteLoad' => $acuteLoad,
            'previousLoad' => $previousLoad > 0 ? $previousLoad : null,
            'loadRatio' => $loadRatio,
            'highIntensitySessions' => $highIntensitySessions,
            'activeDays' => $activeDays,
            'restDays' => $restDays,
            'averageSleepHours' => $averageSleepHours,
            'sleepDebtHours' => $sleepDebtHours,
            'averageBodyBatteryGain' => is_int($averageBodyBatteryGain) ? $averageBodyBatteryGain : null,
            'averageSleepStress' => is_int($averageSleepStress) ? $averageSleepStress : null,
            'riskScore' => $riskScore,
            'status' => $status,
            'summary' => $summaryParts !== []
                ? implode(' - ', $summaryParts)
                : 'Pas assez de charge recente pour evaluer la fatigue.',
        ];
    }

    private function buildRunningQualityAnalytics(array $activities): array
    {
        $runs = collect($activities)
            ->filter(fn (array $activity): bool => $this->isRunningActivity($activity))
            ->take(10)
            ->values();
        $sampleSize = $runs->count();
        $averageCadence = $this->roundCollectionAverage($runs->all(), 'avgCadence');
        $averageGroundContactTime = $this->roundCollectionAverage($runs->all(), 'groundContactTimeMs', false, 1);
        $averageVerticalOscillation = $this->roundCollectionAverage($runs->all(), 'verticalOscillationCm', false, 1);
        $averageStrideLength = $this->roundCollectionAverage($runs->all(), 'strideLengthCm', false, 1);
        $averagePace = $this->roundCollectionAverage($runs->all(), 'paceMinPerKm', false, 1);
        $cadenceDelta = $this->calculateWindowDelta($runs->all(), 'avgCadence');
        $groundContactDelta = $this->calculateWindowDelta($runs->all(), 'groundContactTimeMs', 3, false, 1);
        $verticalOscillationDelta = $this->calculateWindowDelta($runs->all(), 'verticalOscillationCm', 3, false, 1);
        $strideLengthDelta = $this->calculateWindowDelta($runs->all(), 'strideLengthCm', 3, false, 1);
        $series = $runs
            ->take(7)
            ->reverse()
            ->map(function (array $activity): array {
                return [
                    'date' => Arr::get($activity, 'date'),
                    'cadence' => $this->numericOrNull(Arr::get($activity, 'avgCadence')),
                    'groundContactTimeMs' => $this->numericOrNull(Arr::get($activity, 'groundContactTimeMs')),
                    'verticalOscillationCm' => $this->numericOrNull(Arr::get($activity, 'verticalOscillationCm')),
                    'strideLengthCm' => $this->numericOrNull(Arr::get($activity, 'strideLengthCm')),
                ];
            })
            ->values()
            ->all();

        $qualityScore = 0;
        if ($averageCadence !== null && $averageCadence >= 165 && $averageCadence <= 185) {
            $qualityScore += 15;
        }
        if ($averageGroundContactTime !== null && $averageGroundContactTime <= 280) {
            $qualityScore += 15;
        }
        if ($averageVerticalOscillation !== null && $averageVerticalOscillation <= 9.5) {
            $qualityScore += 10;
        }
        if ($cadenceDelta !== null && $cadenceDelta >= 0) {
            $qualityScore += 15;
        }
        if ($groundContactDelta !== null && $groundContactDelta <= 0) {
            $qualityScore += 15;
        }
        if ($verticalOscillationDelta !== null && $verticalOscillationDelta <= 0) {
            $qualityScore += 10;
        }
        if ($strideLengthDelta !== null && $strideLengthDelta >= 0) {
            $qualityScore += 10;
        }

        $status = 'Qualite non evaluee';
        if ($sampleSize > 0) {
            if ($qualityScore >= 55) {
                $status = 'Mecanique efficace';
            } elseif ($qualityScore >= 30) {
                $status = 'Mecanique stable';
            } else {
                $status = 'Mecanique a surveiller';
            }
        }

        $summaryParts = [];
        if ($averageCadence !== null) {
            $summaryParts[] = 'cadence ' . $averageCadence . ' spm';
        }
        if ($averageGroundContactTime !== null) {
            $summaryParts[] = 'contact sol ' . $averageGroundContactTime . ' ms';
        }
        if ($averageStrideLength !== null) {
            $summaryParts[] = 'foulee ' . $averageStrideLength . ' cm';
        }

        return [
            'sampleSize' => $sampleSize,
            'averageCadence' => $averageCadence,
            'averageGroundContactTimeMs' => $averageGroundContactTime,
            'averageVerticalOscillationCm' => $averageVerticalOscillation,
            'averageStrideLengthCm' => $averageStrideLength,
            'averagePaceMinPerKm' => $averagePace,
            'cadenceDelta' => $cadenceDelta,
            'groundContactDeltaMs' => $groundContactDelta,
            'verticalOscillationDeltaCm' => $verticalOscillationDelta,
            'strideLengthDeltaCm' => $strideLengthDelta,
            'status' => $status,
            'summary' => $summaryParts !== []
                ? implode(' - ', $summaryParts)
                : 'Pas assez de sorties course pour evaluer la mecanique.',
            'series' => $series,
        ];
    }

    private function buildTemperatureAnalytics(array $sleepEntries): array
    {
        $points = collect($sleepEntries)
            ->take(14)
            ->map(function (array $night): ?array {
                $value = $this->numericOrNull(Arr::get($night, 'avgSkinTempDeviationC'), true);

                if ($value === null) {
                    return null;
                }

                return [
                    'date' => Arr::get($night, 'date'),
                    'value' => round($value, 1),
                ];
            })
            ->filter(fn (?array $point): bool => $point !== null)
            ->values();
        $latestValue = $points->first()['value'] ?? null;
        $baselineValues = $points->skip(1)->take(6)->pluck('value');
        $baselineValue = $baselineValues->isNotEmpty()
            ? round((float) $baselineValues->avg(), 1)
            : null;
        $averageValue = $points->isNotEmpty()
            ? round((float) $points->avg('value'), 1)
            : null;
        $maxValue = $points->isNotEmpty()
            ? round((float) $points->max('value'), 1)
            : null;
        $minValue = $points->isNotEmpty()
            ? round((float) $points->min('value'), 1)
            : null;
        $drift = $latestValue !== null && $baselineValue !== null
            ? round($latestValue - $baselineValue, 1)
            : null;
        $elevatedNightCount = (int) $points
            ->filter(fn (array $point): bool => $point['value'] >= 0.3)
            ->count();

        $status = 'Stable';
        if ($latestValue === null) {
            $status = 'Non renseignee';
        } elseif ($drift !== null && $drift >= 0.4) {
            $status = 'Derive nette';
        } elseif ($drift !== null && $drift >= 0.2) {
            $status = 'Legere hausse';
        } elseif ($drift !== null && $drift <= -0.2) {
            $status = 'Retour sous baseline';
        }

        return [
            'sampleSize' => $points->count(),
            'latestDeviationC' => $latestValue,
            'baselineDeviationC' => $baselineValue,
            'averageDeviationC' => $averageValue,
            'maxDeviationC' => $maxValue,
            'minDeviationC' => $minValue,
            'driftC' => $drift,
            'elevatedNightCount' => $elevatedNightCount,
            'status' => $status,
            'summary' => $latestValue !== null
                ? 'Derniere nuit ' . $latestValue . ' deg C vs baseline'
                : 'Pas assez de nuits avec temperature cutanee.',
            'series' => $points->reverse()->values()->all(),
        ];
    }

    private function buildWeeklyBlocks(array $activities, array $sleepEntries, array $dailyEntries): array
    {
        $activitiesByWeek = collect($activities)
            ->filter(fn (array $activity): bool => $this->isoWeekKey($activity['date'] ?? null) !== null)
            ->groupBy(fn (array $activity): string => $this->isoWeekKey($activity['date']) ?? '');
        $sleepByWeek = collect($sleepEntries)
            ->filter(fn (array $night): bool => $this->isoWeekKey($night['date'] ?? null) !== null)
            ->groupBy(fn (array $night): string => $this->isoWeekKey($night['date']) ?? '');
        $dailyByWeek = collect($dailyEntries)
            ->filter(fn (array $day): bool => $this->isoWeekKey($day['date'] ?? null) !== null)
            ->groupBy(fn (array $day): string => $this->isoWeekKey($day['date']) ?? '');
        $weekKeys = collect(array_merge(
            $activitiesByWeek->keys()->all(),
            $sleepByWeek->keys()->all(),
            $dailyByWeek->keys()->all()
        ))
            ->filter(fn ($key): bool => is_string($key) && $key !== '')
            ->unique()
            ->sortDesc()
            ->take(8)
            ->values();

        return $weekKeys
            ->map(function (string $weekKey) use ($activitiesByWeek, $sleepByWeek, $dailyByWeek): array {
                [$isoYear, $isoWeek] = explode('-W', $weekKey);
                $weekStart = CarbonImmutable::now('UTC')->setISODate((int) $isoYear, (int) $isoWeek, 1);
                $weekEnd = $weekStart->addDays(6);
                $weekActivities = collect($activitiesByWeek->get($weekKey, []));
                $weekSleep = collect($sleepByWeek->get($weekKey, []));
                $weekDaily = collect($dailyByWeek->get($weekKey, []));
                $activeDays = (int) $weekActivities
                    ->pluck('date')
                    ->filter()
                    ->unique()
                    ->count();
                $sleepTrackedDays = (int) $weekSleep
                    ->pluck('date')
                    ->filter()
                    ->unique()
                    ->count();
                $trackedDays = collect($weekDaily->pluck('date'))
                    ->merge($weekSleep->pluck('date'))
                    ->merge($weekActivities->pluck('date'))
                    ->filter()
                    ->unique()
                    ->count();

                return [
                    'week' => $weekKey,
                    'label' => sprintf('S%02d %d', (int) $isoWeek, (int) $isoYear),
                    'rangeStart' => $weekStart->format('Y-m-d'),
                    'rangeEnd' => $weekEnd->format('Y-m-d'),
                    'distanceKm' => round((float) $weekActivities->sum('distanceKm'), 1),
                    'durationHours' => round((float) $weekActivities->sum('durationMin') / 60, 1),
                    'trainingLoad' => (int) round($weekActivities->sum('trainingLoad')),
                    'intensityMinutes' => (int) round($weekActivities->sum('moderateIntensityMinutes') + $weekActivities->sum('vigorousIntensityMinutes')),
                    'highIntensitySessions' => (int) $weekActivities
                        ->filter(fn (array $activity): bool => $this->isHighIntensityActivity($activity))
                        ->count(),
                    'activityCount' => $weekActivities->count(),
                    'activeDays' => $activeDays,
                    'avgSleepHours' => $this->roundCollectionAverage($weekSleep->all(), 'hours'),
                    'avgSleepScore' => $this->roundCollectionAverage($weekSleep->all(), 'score', false, 0),
                    'avgBodyBatteryGain' => $this->roundCollectionAverage($weekSleep->all(), 'bodyBatteryChange', true, 0),
                    'sleepDebtHours' => $this->sumSleepDebt($weekSleep->all()),
                    'sleepTrackedDays' => $sleepTrackedDays,
                    'regularityPercent' => $trackedDays > 0
                        ? (int) round((($activeDays + $sleepTrackedDays) / ($trackedDays * 2)) * 100)
                        : null,
                    'steps' => (int) round($weekDaily->sum('steps')),
                    'activeCalories' => (int) round($weekDaily->sum('activeCalories')),
                ];
            })
            ->all();
    }

    private function collectNumericField(array $entries, string $key, bool $allowZero = false)
    {
        return collect($entries)
            ->map(fn (array $entry): ?float => $this->numericOrNull(Arr::get($entry, $key), $allowZero))
            ->filter(fn (?float $value): bool => $value !== null)
            ->values();
    }

    private function roundCollectionAverage(array $entries, string $key, bool $allowZero = false, int $precision = 1): int|float|null
    {
        $values = $this->collectNumericField($entries, $key, $allowZero);

        if ($values->isEmpty()) {
            return null;
        }

        $average = round((float) $values->avg(), $precision);

        return $precision === 0 ? (int) $average : $average;
    }

    private function resolveSleepNeedHours(array $night): ?float
    {
        $sleepNeedMinutes = $this->numericOrNull(Arr::get($night, 'sleepNeedMinutes'), true);
        if ($sleepNeedMinutes !== null && $sleepNeedMinutes > 0) {
            return round($sleepNeedMinutes / 60, 1);
        }

        $baselineMinutes = $this->numericOrNull(Arr::get($night, 'sleepNeedBaselineMinutes'), true);
        if ($baselineMinutes !== null && $baselineMinutes > 0) {
            return round($baselineMinutes / 60, 1);
        }

        return null;
    }

    private function sumSleepDebt(array $nights, float $fallbackTargetHours = 8.0): float
    {
        return round((float) collect($nights)->sum(function (array $night) use ($fallbackTargetHours): float {
            $hours = $this->numericOrNull(Arr::get($night, 'hours'));

            if ($hours === null) {
                return 0.0;
            }

            $targetHours = $this->resolveSleepNeedHours($night) ?? $fallbackTargetHours;

            return max($targetHours - $hours, 0);
        }), 1);
    }

    private function calculateWindowDelta(
        array $entries,
        string $key,
        int $window = 3,
        bool $allowZero = false,
        int $precision = 1
    ): ?float {
        $recentValues = $this->collectNumericField(collect($entries)->take($window)->all(), $key, $allowZero);
        $previousValues = $this->collectNumericField(collect($entries)->skip($window)->take($window)->all(), $key, $allowZero);

        if ($recentValues->isEmpty() || $previousValues->isEmpty()) {
            return null;
        }

        return round((float) $recentValues->avg() - (float) $previousValues->avg(), $precision);
    }

    private function numericOrNull(mixed $value, bool $allowZero = false): ?float
    {
        if (! is_numeric($value)) {
            return null;
        }

        $number = (float) $value;
        if (! $allowZero && $number <= 0) {
            return null;
        }

        return $number;
    }

    private function pearsonCorrelation(array $xValues, array $yValues): ?float
    {
        $count = min(count($xValues), count($yValues));
        if ($count < 3) {
            return null;
        }

        $meanX = array_sum($xValues) / $count;
        $meanY = array_sum($yValues) / $count;
        $numerator = 0.0;
        $denominatorX = 0.0;
        $denominatorY = 0.0;

        for ($index = 0; $index < $count; $index++) {
            $deltaX = $xValues[$index] - $meanX;
            $deltaY = $yValues[$index] - $meanY;
            $numerator += $deltaX * $deltaY;
            $denominatorX += $deltaX ** 2;
            $denominatorY += $deltaY ** 2;
        }

        if ($denominatorX <= 0 || $denominatorY <= 0) {
            return null;
        }

        return round($numerator / sqrt($denominatorX * $denominatorY), 2);
    }

    private function describeCorrelation(?float $coefficient): ?string
    {
        if ($coefficient === null) {
            return null;
        }

        $strength = match (true) {
            abs($coefficient) >= 0.7 => 'forte',
            abs($coefficient) >= 0.45 => 'moderee',
            abs($coefficient) >= 0.2 => 'legere',
            default => 'faible',
        };

        if (abs($coefficient) < 0.1) {
            return 'plate';
        }

        return ($coefficient > 0 ? 'positive ' : 'negative ') . $strength;
    }

    private function isHighIntensityActivity(array $activity): bool
    {
        return $this->numericOrNull(Arr::get($activity, 'vigorousIntensityMinutes'), true) >= 20
            || $this->numericOrNull(Arr::get($activity, 'trainingEffect')) >= 3.5
            || $this->numericOrNull(Arr::get($activity, 'anaerobicTrainingEffect')) >= 2.0
            || $this->numericOrNull(Arr::get($activity, 'trainingLoad'), true) >= 150;
    }

    private function isRunningActivity(array $activity): bool
    {
        $type = Str::lower((string) Arr::get($activity, 'type', ''));
        if (Str::contains($type, 'run')) {
            return true;
        }

        return $this->numericOrNull(Arr::get($activity, 'groundContactTimeMs')) !== null
            || $this->numericOrNull(Arr::get($activity, 'verticalOscillationCm')) !== null
            || $this->numericOrNull(Arr::get($activity, 'strideLengthCm')) !== null;
    }

    private function isoWeekKey(?string $date): ?string
    {
        $parsed = $this->parseDate($date);
        if ($parsed === null) {
            return null;
        }

        return sprintf('%d-W%02d', $parsed->isoWeekYear, $parsed->isoWeek);
    }

    private function firstNonEmpty(array $values, string $fallback): string
    {
        return collect($values)
            ->filter(fn ($value): bool => is_string($value) && trim($value) !== '')
            ->map(fn (string $value): string => trim($value))
            ->first() ?? $fallback;
    }

    private function normalizeDurationSeconds(mixed $value): float
    {
        $duration = $this->toFloat($value);

        return $duration > 1000000 ? $duration / 1000 : $duration;
    }

    private function humanizeType(string $value): string
    {
        return trim((string) Str::of($value)->replace('_', ' ')->replace('-', ' ')->title());
    }

    private function humanizeSplitType(string $value): string
    {
        return match ($value) {
            'RWD_RUN' => 'Blocs course',
            'RWD_WALK' => 'Blocs marche',
            'RWD_STAND' => 'Pauses',
            'INTERVAL_ACTIVE' => 'Intervalles actifs',
            'INTERVAL_RECOVERY' => 'Recuperation',
            'INTERVAL_WARMUP' => 'Echauffement',
            'INTERVAL_COOLDOWN' => 'Retour au calme',
            default => $this->humanizeType($value),
        };
    }

    private function normalizeDateString(mixed $value): ?string
    {
        return $this->parseDate($value)?->toIso8601String();
    }

    private function timestampMsToIsoString(mixed $value): ?string
    {
        if (! is_numeric($value)) {
            return null;
        }

        try {
            return CarbonImmutable::createFromTimestampMs((int) round($this->toFloat($value)), 'UTC')->toIso8601String();
        } catch (Throwable) {
            return null;
        }
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

    private function toFloat(mixed $value): float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }

        return 0.0;
    }
}
