<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Lab | Louis Astori</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #f8f5ef;
            --ink: #10241d;
            --muted: #4b635a;
            --card: #ffffff;
            --line: #d7e0d9;
            --accent: #eb5e28;
            --accent-2: #1f8a70;
            --danger: #b63f3f;
            --connected: #1f8a70;
            --disconnected: #b63f3f;
            --shadow: 0 14px 30px rgba(16, 36, 29, 0.08);
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            color: var(--ink);
            background:
                radial-gradient(circle at 10% 20%, rgba(235, 94, 40, 0.15), transparent 45%),
                radial-gradient(circle at 85% 15%, rgba(31, 138, 112, 0.16), transparent 40%),
                var(--bg);
            font-family: "DM Sans", sans-serif;
        }

        .page-shell {
            padding: 88px 18px 32px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            gap: 18px;
        }

        .panel {
            background: var(--card);
            border-radius: 20px;
            border: 1px solid var(--line);
            box-shadow: var(--shadow);
            padding: 20px;
        }

        .tab-shell {
            padding: 16px 20px;
        }

        .tab-bar {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .tab-button {
            border: 1px solid var(--line);
            background: #fbfffc;
            color: var(--ink);
            border-radius: 999px;
            padding: 8px 14px;
            font-family: "Space Grotesk", sans-serif;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
            transition: transform 120ms ease, border-color 120ms ease, background 120ms ease, color 120ms ease;
        }

        .tab-button:hover {
            transform: translateY(-1px);
            border-color: rgba(31, 138, 112, 0.45);
        }

        .tab-button.is-active {
            background: var(--ink);
            color: #ffffff;
            border-color: var(--ink);
        }

        [data-tab-panel][hidden] {
            display: none !important;
        }

        .hero {
            display: grid;
            gap: 20px;
            grid-template-columns: 1.3fr 1fr;
            align-items: stretch;
        }

        .hero-main {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 16px;
            align-items: start;
        }

        .avatar-shell {
            width: 58px;
            height: 58px;
            border-radius: 18px;
            border: 1px solid var(--line);
            background: linear-gradient(160deg, rgba(31, 138, 112, 0.12), rgba(235, 94, 40, 0.18));
            overflow: hidden;
            display: grid;
            place-items: center;
            flex-shrink: 0;
        }

        .avatar-shell img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .avatar-fallback {
            font-family: "Space Grotesk", sans-serif;
            font-size: 1.15rem;
            font-weight: 700;
        }

        .eyebrow {
            text-transform: uppercase;
            letter-spacing: 0.09em;
            font-size: 0.74rem;
            font-weight: 700;
            color: var(--accent);
            margin: 0 0 8px;
        }

        h1, h2, h3 {
            margin: 0;
            font-family: "Space Grotesk", sans-serif;
        }

        h1 {
            font-size: clamp(1.8rem, 3.2vw, 2.7rem);
            line-height: 1.05;
        }

        .hero-text {
            color: var(--muted);
            margin: 12px 0 0;
            max-width: 64ch;
            line-height: 1.5;
        }

        .chip-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 14px;
        }

        .chip {
            font-size: 0.82rem;
            font-weight: 600;
            padding: 6px 10px;
            border-radius: 999px;
            border: 1px solid var(--line);
            background: #fbfffc;
        }

        .refresh-block {
            display: grid;
            gap: 10px;
            align-content: start;
            background: linear-gradient(160deg, rgba(31, 138, 112, 0.08), rgba(235, 94, 40, 0.12));
            border-radius: 16px;
            border: 1px solid var(--line);
            padding: 16px;
        }

        .btn {
            border: 0;
            cursor: pointer;
            color: #ffffff;
            background: var(--ink);
            border-radius: 12px;
            padding: 10px 14px;
            font-family: "Space Grotesk", sans-serif;
            font-weight: 700;
            font-size: 0.9rem;
            transition: transform 120ms ease, opacity 120ms ease;
        }

        .btn:hover {
            transform: translateY(-1px);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .muted {
            color: var(--muted);
            margin: 0;
            font-size: 0.9rem;
            line-height: 1.5;
        }

        .grid-2 {
            display: grid;
            gap: 18px;
            grid-template-columns: 1fr 1fr;
        }

        .section-grid {
            margin-top: 14px;
            align-items: start;
        }

        .kpi-grid {
            margin-top: 14px;
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .kpi {
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 12px;
            background: #fcfffd;
        }

        .kpi-label {
            color: var(--muted);
            font-size: 0.84rem;
            margin: 0 0 7px;
        }

        .kpi-value {
            font-family: "Space Grotesk", sans-serif;
            font-size: 1.7rem;
            line-height: 1;
            margin: 0;
        }

        .kpi-unit {
            color: var(--muted);
            font-size: 0.82rem;
            margin-left: 4px;
        }

        .section-title {
            font-size: 1.2rem;
        }

        .timeline {
            display: grid;
            gap: 10px;
            margin-top: 12px;
        }

        .timeline-item {
            display: grid;
            grid-template-columns: 90px 1fr auto;
            align-items: center;
            gap: 12px;
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 10px 12px;
            background: #ffffff;
            transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
            cursor: pointer;
        }

        .timeline-item:hover {
            transform: translateY(-1px);
            border-color: rgba(31, 138, 112, 0.45);
        }

        .timeline-item.is-active {
            border-color: var(--accent-2);
            box-shadow: 0 10px 22px rgba(31, 138, 112, 0.14);
        }

        .source {
            display: inline-block;
            text-transform: uppercase;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            border-radius: 999px;
            padding: 5px 8px;
            text-align: center;
        }

        .source-strava {
            background: rgba(235, 94, 40, 0.15);
            color: #a94920;
        }

        .source-garmin {
            background: rgba(31, 138, 112, 0.15);
            color: #176854;
        }

        .item-name {
            margin: 0;
            font-weight: 700;
        }

        .item-meta {
            margin: 3px 0 0;
            color: var(--muted);
            font-size: 0.86rem;
        }

        .item-distance {
            font-family: "Space Grotesk", sans-serif;
            font-weight: 700;
            font-size: 1.05rem;
        }

        .detail-list,
        .week-list {
            display: grid;
            gap: 10px;
            margin-top: 12px;
        }

        .chart-grid {
            margin-top: 14px;
            display: grid;
            gap: 12px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .chart-card {
            border: 1px solid var(--line);
            border-radius: 16px;
            background: #fcfffd;
            padding: 14px;
        }

        .chart-card h3 {
            font-size: 1rem;
        }

        .chart-meta {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: end;
            margin-top: 10px;
        }

        .chart-value {
            margin: 0;
            font-family: "Space Grotesk", sans-serif;
            font-size: 1.45rem;
            line-height: 1;
        }

        .chart-hint {
            margin: 4px 0 0;
            color: var(--muted);
            font-size: 0.8rem;
        }

        .chart-frame {
            margin-top: 12px;
        }

        .chart-svg {
            width: 100%;
            height: 150px;
            display: block;
        }

        .chart-axis {
            margin-top: 10px;
            display: grid;
            gap: 8px;
            font-size: 0.74rem;
            color: var(--muted);
        }

        .chart-axis span {
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .inspector-shell {
            display: grid;
            gap: 16px;
            margin-top: 12px;
        }

        .inspector-hero {
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 16px;
            background: linear-gradient(160deg, rgba(31, 138, 112, 0.08), rgba(235, 94, 40, 0.1));
        }

        .inspector-meta {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 10px;
        }

        .inspector-grid {
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .inspector-card {
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 12px;
            background: #fcfffd;
        }

        .inspector-label {
            margin: 0 0 6px;
            color: var(--muted);
            font-size: 0.8rem;
        }

        .inspector-value {
            margin: 0;
            font-family: "Space Grotesk", sans-serif;
            font-weight: 700;
            font-size: 1.1rem;
        }

        .inspector-list {
            display: grid;
            gap: 8px;
        }

        .inspector-list.columns-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .inspector-line {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 12px;
            border: 1px solid var(--line);
            border-radius: 12px;
            background: #fff;
        }

        .inspector-line-label {
            color: var(--muted);
            font-size: 0.86rem;
        }

        .inspector-line-value {
            font-weight: 700;
            text-align: right;
        }

        .split-list {
            display: grid;
            gap: 10px;
        }

        .split-card {
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 12px;
            background: #fff;
        }

        .split-head {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: flex-start;
        }

        .split-title {
            margin: 0;
            font-weight: 700;
        }

        .split-subtitle {
            margin: 3px 0 0;
            color: var(--muted);
            font-size: 0.82rem;
        }

        .split-metrics {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 10px;
        }

        .detail-card,
        .week-row {
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 12px;
            background: #ffffff;
        }

        .detail-card.is-selectable {
            cursor: pointer;
            transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
        }

        .detail-card.is-selectable:hover {
            transform: translateY(-1px);
            border-color: rgba(31, 138, 112, 0.45);
        }

        .detail-card.is-selectable.is-active {
            border-color: var(--accent-2);
            box-shadow: 0 10px 22px rgba(31, 138, 112, 0.14);
        }

        .detail-head {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: flex-start;
        }

        .detail-title {
            margin: 0;
            font-weight: 700;
        }

        .detail-subtitle {
            margin: 3px 0 0;
            color: var(--muted);
            font-size: 0.84rem;
        }

        .detail-metrics {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 10px;
        }

        .mini-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            border-radius: 999px;
            border: 1px solid var(--line);
            background: #fbfffc;
            font-size: 0.78rem;
        }

        .week-row {
            display: grid;
            grid-template-columns: 110px repeat(4, minmax(0, 1fr));
            gap: 10px;
            align-items: center;
        }

        .week-date {
            margin: 0;
            font-family: "Space Grotesk", sans-serif;
            font-weight: 700;
        }

        .week-metric-label {
            margin: 0 0 3px;
            color: var(--muted);
            font-size: 0.74rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .week-metric-value {
            margin: 0;
            font-weight: 700;
        }

        .connections {
            display: grid;
            gap: 10px;
            margin-top: 10px;
        }

        .connection-card {
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 10px 12px;
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: center;
        }

        .status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-size: 0.72rem;
            font-weight: 700;
        }

        .status-dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            display: inline-block;
        }

        .status-connected .status-dot {
            background: var(--connected);
        }

        .status-disconnected .status-dot {
            background: var(--disconnected);
        }

        .nutrition-list {
            margin-top: 12px;
            display: grid;
            gap: 8px;
        }

        .meal {
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 10px 12px;
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            gap: 10px;
        }

        .meal-name {
            margin: 0;
            font-weight: 700;
        }

        .meal-meta {
            margin: 3px 0 0;
            color: var(--muted);
            font-size: 0.84rem;
        }

        .meal-calories {
            font-family: "Space Grotesk", sans-serif;
            font-weight: 700;
            font-size: 1.05rem;
        }

        .warning-box {
            border: 1px solid rgba(182, 63, 63, 0.32);
            background: rgba(182, 63, 63, 0.08);
            border-radius: 12px;
            padding: 12px 14px;
        }

        .warning-box h3 {
            color: var(--danger);
            margin: 0 0 8px;
            font-size: 1rem;
        }

        .warning-list {
            margin: 0;
            padding-left: 18px;
            color: #7b3030;
            line-height: 1.5;
        }

        .raw {
            margin: 0;
            background: #0f1714;
            color: #d4ffe9;
            border-radius: 12px;
            padding: 14px;
            max-height: 300px;
            overflow: auto;
            font-size: 0.78rem;
            line-height: 1.55;
        }

        .empty {
            color: var(--muted);
            margin: 14px 0 0;
        }

        @media (max-width: 980px) {
            .hero,
            .grid-2,
            .chart-grid {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 640px) {
            .timeline-item,
            .detail-head,
            .week-row {
                grid-template-columns: 1fr;
                align-items: start;
            }

            .kpi-grid,
            .inspector-grid,
            .inspector-list.columns-2 {
                grid-template-columns: 1fr;
            }

            .page-shell {
                padding-top: 80px;
            }
        }
    </style>
</head>
<body>
    @include('partials.navbar')

    @php
        $fitness = $snapshot['fitness'] ?? [];
        $garmin = $snapshot['garmin'] ?? [];
        $nutrition = $snapshot['nutrition'] ?? [];
        $warnings = $snapshot['warnings'] ?? [];
        $connections = $snapshot['connections'] ?? [];
        $fitnessKpis = $fitness['kpis'] ?? [];
        $nutritionKpis = $nutrition['kpis'] ?? [];
        $garminTodayKpis = data_get($garmin, 'today.kpis', []);
        $garminSleepKpis = data_get($garmin, 'sleep.kpis', []);
        $garminWeekly = $garmin['weekly'] ?? [];
        $activities = $fitness['recentActivities'] ?? [];
        $meals = $nutrition['recentEntries'] ?? [];
        $athlete = $fitness['athlete'] ?? [];
        $garminProfile = $fitness['garminProfile'] ?? [];
        $garminExportLabel = ! empty($garmin['sourceDir']) ? basename($garmin['sourceDir']) : 'n/a';
        $formatValue = static function ($value): string {
            if (! is_numeric($value)) {
                return '-';
            }

            $number = (float) $value;
            if (fmod($number, 1.0) === 0.0) {
                return number_format((int) $number, 0, ',', ' ');
            }

            return number_format($number, 1, ',', ' ');
        };
        $snapshotJson = json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: '{}';
    @endphp

    <div class="page-shell">
        <main class="container">
            <section class="panel hero">
                <div>
                    <div class="hero-main">
                        <div class="avatar-shell" id="hero-avatar">
                            @if (! empty($athlete['avatar']) || ! empty($garminProfile['avatar']) || ! empty(data_get($garmin, 'profile.avatar')))
                                <img src="{{ $athlete['avatar'] ?? $garminProfile['avatar'] ?? data_get($garmin, 'profile.avatar') }}" alt="Avatar athlete">
                            @else
                                <span class="avatar-fallback">LA</span>
                            @endif
                        </div>
                        <div>
                            <p class="eyebrow">Portfolio Data-Driven</p>
                            <h1>Performance Lab: sport + nutrition en un dashboard complet</h1>
                            <p class="hero-text">
                                Cette page agrege Strava, Garmin, le crawler local et la nutrition pour montrer une approche produit complete:
                                collecte API, export automatise, normalisation backend et visualisation front responsive.
                            </p>
                            <div class="chip-row" id="hero-chips">
                                <span class="chip">{{ $athlete['name'] ?? 'Athlete name unavailable' }}</span>
                                <span class="chip">{{ $athlete['city'] ?? 'City n/a' }}</span>
                                <span class="chip">{{ $garminProfile['name'] ?? data_get($garmin, 'profile.name', 'Garmin profile n/a') }}</span>
                                @if (data_get($garmin, 'coverage.startDate') && data_get($garmin, 'coverage.endDate'))
                                    <span class="chip">Crawler {{ data_get($garmin, 'coverage.startDate') }} -> {{ data_get($garmin, 'coverage.endDate') }}</span>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
                <div class="refresh-block">
                    <h2 class="section-title">Live sync</h2>
                    <button id="refresh-live" class="btn" type="button">Rafraichir en live</button>
                    <p class="muted" id="generated-at">Snapshot: {{ $snapshot['generatedAt'] ?? 'n/a' }}</p>
                    <p class="muted" id="crawler-generated-at">Crawler: {{ data_get($garmin, 'generatedAt', 'n/a') }}</p>
                    <p class="muted" id="crawler-export-label">Export Garmin: {{ $garminExportLabel }}</p>
                    <p class="muted" id="crawler-coverage">
                        Couverture Garmin: {{ data_get($garmin, 'coverage.startDate', 'n/a') }} -> {{ data_get($garmin, 'coverage.endDate', 'n/a') }}
                    </p>
                    <p class="muted">Le mode live recharge le dernier export local du crawler Garmin, le snapshot de la page et la table `meals` Supabase.</p>
                </div>
            </section>

            <section class="panel tab-shell">
                <div class="tab-bar" role="tablist" aria-label="Vues performance">
                    <button class="tab-button is-active" type="button" data-tab-trigger="general" aria-selected="true">General</button>
                    <button class="tab-button" type="button" data-tab-trigger="sleep" aria-selected="false">Sommeil</button>
                    <button class="tab-button" type="button" data-tab-trigger="activity" aria-selected="false">Activites</button>
                </div>
                <p class="muted" style="margin-top:12px;">La page est maintenant rangee en mini onglets pour separer la vue generale, le sommeil et les activites.</p>
            </section>

            <section class="grid-2" data-tab-panel="general">
                <article class="panel">
                    <h2 class="section-title">Bloc Fitness</h2>
                    <p class="muted">Source: endpoint `/api/overview` du worker Garmin + Strava, complete par le crawler local.</p>

                    <div class="kpi-grid" id="fitness-kpi-grid">
                        @forelse ($fitnessKpis as $index => $kpi)
                            <div class="kpi">
                                <p class="kpi-label">{{ $kpi['label'] ?? 'Metric' }}</p>
                                <p class="kpi-value">
                                    <span data-kpi-group="fitness" data-kpi-index="{{ $index }}">{{ $formatValue($kpi['value'] ?? null) }}</span>
                                    <span class="kpi-unit">{{ $kpi['unit'] ?? '' }}</span>
                                </p>
                            </div>
                        @empty
                            <p class="empty">Aucune metrique fitness disponible pour le moment.</p>
                        @endforelse
                    </div>
                </article>

                <article class="panel">
                    <h2 class="section-title">Bloc Nutrition</h2>
                    <p class="muted">Source: table Supabase `meals` alimentee par ton app mobile.</p>

                    <div class="kpi-grid" id="nutrition-kpi-grid">
                        @forelse ($nutritionKpis as $index => $kpi)
                            <div class="kpi">
                                <p class="kpi-label">{{ $kpi['label'] ?? 'Metric' }}</p>
                                <p class="kpi-value">
                                    <span data-kpi-group="nutrition" data-kpi-index="{{ $index }}">{{ $formatValue($kpi['value'] ?? null) }}</span>
                                    <span class="kpi-unit">{{ $kpi['unit'] ?? '' }}</span>
                                </p>
                            </div>
                        @empty
                            <p class="empty">Aucune metrique nutrition disponible pour le moment.</p>
                        @endforelse
                    </div>
                </article>
            </section>

            <section class="grid-2" data-tab-panel="general">
                <article class="panel">
                    <h2 class="section-title">Garmin quotidien</h2>
                    <p class="muted" id="garmin-day-label">
                        Dernier resume quotidien Garmin: {{ data_get($garmin, 'today.date', 'n/a') }}
                    </p>
                    <div class="kpi-grid" id="garmin-today-kpi-grid">
                        @forelse ($garminTodayKpis as $index => $kpi)
                            <div class="kpi">
                                <p class="kpi-label">{{ $kpi['label'] ?? 'Metric' }}</p>
                                <p class="kpi-value">
                                    <span data-kpi-group="garmin-today" data-kpi-index="{{ $index }}">{{ $formatValue($kpi['value'] ?? null) }}</span>
                                    <span class="kpi-unit">{{ $kpi['unit'] ?? '' }}</span>
                                </p>
                            </div>
                        @empty
                            <p class="empty">Aucune metrique Garmin quotidienne disponible.</p>
                        @endforelse
                    </div>
                </article>

                <article class="panel">
                    <h2 class="section-title">Origine des donnees</h2>
                    <p class="muted">Le portfolio affiche maintenant l export Garmin local utilise et la fenetre de donnees effectivement chargee.</p>
                    <div id="data-source-list">
                        <p class="empty">Chargement de l origine des donnees...</p>
                    </div>
                </article>
            </section>

            <section class="panel" data-tab-panel="general">
                <h2 class="section-title">Tendances generales</h2>
                <p class="muted">Lecture rapide des 7 derniers jours Garmin: pas et calories actives.</p>
                <div class="chart-grid">
                    <article class="chart-card">
                        <h3>Pas 7 jours</h3>
                        <div id="general-steps-chart">
                            <p class="empty">Chargement du graphique...</p>
                        </div>
                    </article>
                    <article class="chart-card">
                        <h3>Calories actives 7 jours</h3>
                        <div id="general-calories-chart">
                            <p class="empty">Chargement du graphique...</p>
                        </div>
                    </article>
                </div>
            </section>

            <section class="panel" data-tab-panel="general">
                <h2 class="section-title">Tableaux hebdo</h2>
                <p class="muted">Volume, intensite, recuperation et regularite agregees par semaine ISO quand le crawler accumule plusieurs jours.</p>
                <div class="week-list" id="analytics-weekly-blocks">
                    <p class="empty">Chargement des tableaux hebdo...</p>
                </div>
            </section>

            <section class="panel" data-tab-panel="general">
                <h2 class="section-title">Compte-rendu IA</h2>
                <p class="muted" id="ai-report-meta">Analyse locale Ollama des performances, du sommeil et des activites recentes.</p>
                <div class="inspector-shell">
                    <div class="inspector-hero" id="ai-report-hero">
                        <p class="empty">Generation du compte-rendu IA...</p>
                    </div>
                    <div class="grid-2 section-grid">
                        <div>
                            <h3 class="section-title">Points forts</h3>
                            <div class="detail-list" id="ai-report-highlights">
                                <p class="empty">En attente des points forts...</p>
                            </div>
                        </div>
                        <div>
                            <h3 class="section-title">Points de vigilance</h3>
                            <div class="detail-list" id="ai-report-watchouts">
                                <p class="empty">En attente des points de vigilance...</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 class="section-title">Actions suggerees</h3>
                        <div class="detail-list" id="ai-report-next-steps">
                            <p class="empty">En attente des actions suggerees...</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="grid-2" data-tab-panel="sleep">
                <article class="panel">
                    <h2 class="section-title">Sommeil + recovery</h2>
                    <p class="muted" id="garmin-sleep-label">
                        Nuit du {{ data_get($garmin, 'sleep.date', 'n/a') }} - {{ $formatValue(data_get($garmin, 'sleep.hours', 0)) }} h - score {{ data_get($garmin, 'sleep.scoreLabel', 'n/a') }} - HRV {{ data_get($garmin, 'sleep.hrvStatus', 'n/a') }}
                    </p>
                    <div class="kpi-grid" id="garmin-sleep-kpi-grid">
                        @forelse ($garminSleepKpis as $index => $kpi)
                            <div class="kpi">
                                <p class="kpi-label">{{ $kpi['label'] ?? 'Metric' }}</p>
                                <p class="kpi-value">
                                    <span data-kpi-group="garmin-sleep" data-kpi-index="{{ $index }}">{{ $formatValue($kpi['value'] ?? null) }}</span>
                                    <span class="kpi-unit">{{ $kpi['unit'] ?? '' }}</span>
                                </p>
                            </div>
                        @empty
                            <p class="empty">Aucune metrique sommeil disponible.</p>
                        @endforelse
                    </div>
                </article>

                <article class="panel">
                    <h2 class="section-title">Tendances sommeil</h2>
                    <p class="muted">Heures de sommeil et score Garmin sur les dernieres nuits selectionnables.</p>
                    <div class="chart-grid">
                        <article class="chart-card">
                            <h3>Duree des nuits</h3>
                            <div id="sleep-hours-chart">
                                <p class="empty">Chargement du graphique...</p>
                            </div>
                        </article>
                        <article class="chart-card">
                            <h3>Sleep score</h3>
                            <div id="sleep-score-chart">
                                <p class="empty">Chargement du graphique...</p>
                            </div>
                        </article>
                    </div>
                </article>
            </section>

            <section class="grid-2" data-tab-panel="sleep">
                <article class="panel">
                    <h2 class="section-title">Deficit sommeil et recovery</h2>
                    <p class="muted">Lecture multi-nuits du manque de sommeil, du score moyen et de la recharge nocturne.</p>
                    <div id="sleep-recovery-analysis">
                        <p class="empty">Chargement de l analyse recovery...</p>
                    </div>
                </article>

                <article class="panel">
                    <h2 class="section-title">Correlations sommeil / recovery</h2>
                    <p class="muted">Relations entre duree de sommeil, HRV, body battery et stress sur la fenetre chargee par le crawler.</p>
                    <div id="sleep-correlation-analysis">
                        <p class="empty">Chargement des correlations sommeil...</p>
                    </div>
                </article>
            </section>

            <section class="panel" data-tab-panel="sleep">
                <h2 class="section-title">Temperature cutanee nocturne</h2>
                <p class="muted">Suivi de la derive thermique et des signaux physiologiques nocturnes utiles pour fatigue ou maladie.</p>
                <div class="grid-2 section-grid">
                    <div id="sleep-temperature-analysis">
                        <p class="empty">Chargement de la temperature cutanee...</p>
                    </div>
                    <div class="chart-grid">
                        <article class="chart-card">
                            <h3>HRV nocturne</h3>
                            <div id="sleep-hrv-chart">
                                <p class="empty">Chargement du graphique...</p>
                            </div>
                        </article>
                        <article class="chart-card">
                            <h3>Temperature cutanee</h3>
                            <div id="sleep-temp-chart">
                                <p class="empty">Chargement du graphique...</p>
                            </div>
                        </article>
                    </div>
                </div>
            </section>

            <section class="panel" data-tab-panel="sleep">
                <h2 class="section-title">Analyse sommeil detaillee</h2>
                <p class="muted">Horaires, stades, respiration, recharge nocturne et historique recent issus du crawler Garmin.</p>
                <div class="grid-2 section-grid">
                    <div class="inspector-shell">
                        <div class="inspector-hero" id="garmin-sleep-inspector">
                            <p class="empty">Selectionne une nuit pour afficher le detail.</p>
                        </div>
                        <div>
                            <h3 class="section-title">Cycle et stades</h3>
                            <div id="garmin-sleep-breakdown">
                                <p class="empty">Chargement des details sommeil...</p>
                            </div>
                        </div>
                        <div>
                            <h3 class="section-title">Recovery et physiologie</h3>
                            <div id="garmin-sleep-recovery">
                                <p class="empty">Chargement des details sommeil...</p>
                            </div>
                        </div>
                        <div>
                            <h3 class="section-title">Lecture Garmin</h3>
                            <div class="detail-metrics" id="garmin-sleep-insights">
                                <p class="empty">Chargement des insights sommeil...</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 class="section-title">Dernieres nuits</h3>
                        <p class="muted">Clique sur une nuit pour ouvrir l inspecteur detaille.</p>
                        <div class="detail-list" id="garmin-sleep-recent-list">
                            <p class="empty">Chargement de l historique sommeil...</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="panel" data-tab-panel="activity">
                <h2 class="section-title">Tendances activites</h2>
                <p class="muted">Distance et charge sur les dernieres activites visibles dans le portfolio.</p>
                <div class="chart-grid">
                    <article class="chart-card">
                        <h3>Distance par activite</h3>
                        <div id="activity-distance-chart">
                            <p class="empty">Chargement du graphique...</p>
                        </div>
                    </article>
                    <article class="chart-card">
                        <h3>Charge par activite</h3>
                        <div id="activity-load-chart">
                            <p class="empty">Chargement du graphique...</p>
                        </div>
                    </article>
                </div>
            </section>

            <section class="grid-2" data-tab-panel="activity">
                <article class="panel">
                    <h2 class="section-title">Charge et risque de fatigue</h2>
                    <p class="muted">Charge recente, intensite, jours de repos et signaux sommeil pour estimer le risque de fatigue.</p>
                    <div id="activity-fatigue-analysis">
                        <p class="empty">Chargement du risque de fatigue...</p>
                    </div>
                </article>

                <article class="panel">
                    <h2 class="section-title">Qualite de course</h2>
                    <p class="muted">Cadence, contact au sol, oscillation verticale et foulée agregees sur les sorties course recentes.</p>
                    <div id="running-quality-analysis">
                        <p class="empty">Chargement de la qualite de course...</p>
                    </div>
                </article>
            </section>

            <section class="panel" data-tab-panel="activity">
                <h2 class="section-title">Dynamiques de course</h2>
                <p class="muted">Graphiques de cadence et de temps de contact au sol sur les sorties course du snapshot.</p>
                <div class="chart-grid">
                    <article class="chart-card">
                        <h3>Cadence</h3>
                        <div id="running-cadence-chart">
                            <p class="empty">Chargement du graphique...</p>
                        </div>
                    </article>
                    <article class="chart-card">
                        <h3>Contact au sol</h3>
                        <div id="running-gct-chart">
                            <p class="empty">Chargement du graphique...</p>
                        </div>
                    </article>
                </div>
            </section>

            <section class="grid-2" data-tab-panel="activity">
                <article class="panel">
                    <h2 class="section-title">Charge Garmin 7 jours</h2>
                    <p class="muted">Pas, calories actives, sleep et FC repos sur la fenetre couverte par le crawler.</p>
                    <div class="week-list" id="garmin-weekly-list">
                        @forelse ($garminWeekly as $day)
                            <article class="week-row">
                                <div>
                                    <p class="week-date">{{ $day['date'] ?? 'n/a' }}</p>
                                    <p class="muted">Garmin</p>
                                </div>
                                <div>
                                    <p class="week-metric-label">Pas</p>
                                    <p class="week-metric-value">{{ $formatValue($day['steps'] ?? 0) }}</p>
                                </div>
                                <div>
                                    <p class="week-metric-label">Calories</p>
                                    <p class="week-metric-value">{{ $formatValue($day['activeCalories'] ?? 0) }} kcal</p>
                                </div>
                                <div>
                                    <p class="week-metric-label">Sommeil</p>
                                    <p class="week-metric-value">{{ $formatValue($day['sleepHours'] ?? 0) }} h</p>
                                </div>
                                <div>
                                    <p class="week-metric-label">FC repos</p>
                                    <p class="week-metric-value">{{ $formatValue($day['restingHeartRate'] ?? 0) }} bpm</p>
                                </div>
                            </article>
                        @empty
                            <p class="empty">Aucune fenetre Garmin disponible.</p>
                        @endforelse
                    </div>
                </article>

                <article class="panel">
                    <h2 class="section-title">Activites recentes</h2>
                    <p class="muted">Clique sur une activite pour ouvrir l inspecteur detaille.</p>
                    <div class="timeline" id="activity-list">
                        @forelse ($activities as $activity)
                            <article class="timeline-item" data-activity-id="{{ $activity['id'] ?? '' }}">
                                <span class="source source-{{ $activity['source'] ?? 'strava' }}">{{ strtoupper($activity['source'] ?? 'src') }}</span>
                                <div>
                                    <p class="item-name">{{ $activity['name'] ?? 'Activity' }}</p>
                                    <p class="item-meta">{{ $activity['type'] ?? 'Ride' }} - {{ $activity['date'] ?? 'n/a' }} - {{ $activity['durationMin'] ?? 0 }} min - D+ {{ $activity['elevationM'] ?? 0 }} m</p>
                                </div>
                                <p class="item-distance">{{ $formatValue($activity['distanceKm'] ?? 0) }} km</p>
                            </article>
                        @empty
                            <p class="empty">Aucune activite recente.</p>
                        @endforelse
                    </div>
                </article>
            </section>

            <section data-tab-panel="activity">
                <article class="panel">
                    <h2 class="section-title">Inspecteur d activite</h2>
                    <p class="muted">Vue detaillee de l activite selectionnee: performance, charge, cadence, puissance, splits et metadonnees.</p>
                    <div class="inspector-shell" id="activity-inspector">
                        <p class="empty">Selectionne une activite pour afficher le detail.</p>
                    </div>
                </article>
            </section>

            <section class="grid-2" data-tab-panel="general">
                <article class="panel">
                    <h2 class="section-title">Repas recents</h2>
                    <div class="nutrition-list" id="meal-list">
                        @forelse ($meals as $meal)
                            <article class="meal">
                                <div>
                                    <p class="meal-name">{{ $meal['name'] ?? 'Meal' }}</p>
                                    <p class="meal-meta">{{ $meal['grams'] ?? 0 }} g - {{ $meal['capturedAtLabel'] ?? ($meal['capturedAt'] ?? 'n/a') }}</p>
                                </div>
                                <p class="meal-calories">{{ $formatValue($meal['calories'] ?? 0) }} kcal</p>
                            </article>
                        @empty
                            <p class="empty">Aucune entree nutrition disponible.</p>
                        @endforelse
                    </div>
                </article>

                <article class="panel">
                    <h2 class="section-title">Etat des connexions</h2>
                    <div class="connections" id="connection-list">
                        @forelse ($connections as $index => $connection)
                            <article class="connection-card" data-connection-index="{{ $index }}">
                                <div>
                                    <h3>{{ $connection['name'] ?? 'Connection' }}</h3>
                                    <p class="muted">Dernier sync: {{ $connection['lastSync'] ?? 'n/a' }}</p>
                                </div>
                                @php
                                    $status = $connection['status'] ?? 'disconnected';
                                @endphp
                                <span class="status status-{{ $status }}">
                                    <span class="status-dot"></span>
                                    <span>{{ $status }}</span>
                                </span>
                            </article>
                        @empty
                            <p class="empty">Aucune information de connexion.</p>
                        @endforelse
                    </div>
                </article>
            </section>

            <section data-tab-panel="general">
                <article class="panel">
                    <h2 class="section-title">Payload brut</h2>
                    <p class="muted">Utilise cette vue brute pour valider rapidement les formats de donnees.</p>
                    <pre class="raw" id="raw-snapshot">{{ $snapshotJson }}</pre>
                </article>
            </section>

            @if (! empty($warnings))
                <section class="warning-box" id="warning-box">
                    <h3>Warnings</h3>
                    <ul class="warning-list" id="warning-list">
                        @foreach ($warnings as $warning)
                            <li>{{ $warning }}</li>
                        @endforeach
                    </ul>
                </section>
            @else
                <section class="warning-box" id="warning-box" style="display:none;">
                    <h3>Warnings</h3>
                    <ul class="warning-list" id="warning-list"></ul>
                </section>
            @endif
        </main>
    </div>

    <script>
        (() => {
            const endpoint = @json(route('api.performance.live'));
            const initialSnapshot = @json($snapshot);
            const refreshButton = document.getElementById('refresh-live');
            const generatedAt = document.getElementById('generated-at');
            const crawlerGeneratedAt = document.getElementById('crawler-generated-at');
            const crawlerExportLabel = document.getElementById('crawler-export-label');
            const crawlerCoverage = document.getElementById('crawler-coverage');
            const heroChips = document.getElementById('hero-chips');
            const heroAvatar = document.getElementById('hero-avatar');
            const garminDayLabel = document.getElementById('garmin-day-label');
            const garminSleepLabel = document.getElementById('garmin-sleep-label');
            const rawSnapshot = document.getElementById('raw-snapshot');
            const warningBox = document.getElementById('warning-box');
            const warningList = document.getElementById('warning-list');
            const fitnessKpiGrid = document.getElementById('fitness-kpi-grid');
            const nutritionKpiGrid = document.getElementById('nutrition-kpi-grid');
            const garminTodayKpiGrid = document.getElementById('garmin-today-kpi-grid');
            const garminSleepKpiGrid = document.getElementById('garmin-sleep-kpi-grid');
            const dataSourceList = document.getElementById('data-source-list');
            const aiReportMeta = document.getElementById('ai-report-meta');
            const aiReportHero = document.getElementById('ai-report-hero');
            const aiReportHighlights = document.getElementById('ai-report-highlights');
            const aiReportWatchouts = document.getElementById('ai-report-watchouts');
            const aiReportNextSteps = document.getElementById('ai-report-next-steps');
            const generalStepsChart = document.getElementById('general-steps-chart');
            const generalCaloriesChart = document.getElementById('general-calories-chart');
            const weeklyBlocksList = document.getElementById('analytics-weekly-blocks');
            const sleepHoursChart = document.getElementById('sleep-hours-chart');
            const sleepScoreChart = document.getElementById('sleep-score-chart');
            const sleepRecoveryAnalysis = document.getElementById('sleep-recovery-analysis');
            const sleepCorrelationAnalysis = document.getElementById('sleep-correlation-analysis');
            const sleepTemperatureAnalysis = document.getElementById('sleep-temperature-analysis');
            const sleepHrvChart = document.getElementById('sleep-hrv-chart');
            const sleepTempChart = document.getElementById('sleep-temp-chart');
            const activityDistanceChart = document.getElementById('activity-distance-chart');
            const activityLoadChart = document.getElementById('activity-load-chart');
            const activityFatigueAnalysis = document.getElementById('activity-fatigue-analysis');
            const runningQualityAnalysis = document.getElementById('running-quality-analysis');
            const runningCadenceChart = document.getElementById('running-cadence-chart');
            const runningGctChart = document.getElementById('running-gct-chart');
            const garminSleepInspector = document.getElementById('garmin-sleep-inspector');
            const garminSleepBreakdown = document.getElementById('garmin-sleep-breakdown');
            const garminSleepRecovery = document.getElementById('garmin-sleep-recovery');
            const garminSleepInsights = document.getElementById('garmin-sleep-insights');
            const garminSleepRecentList = document.getElementById('garmin-sleep-recent-list');
            const tabButtons = Array.from(document.querySelectorAll('[data-tab-trigger]'));
            const tabPanels = Array.from(document.querySelectorAll('[data-tab-panel]'));
            const activityList = document.getElementById('activity-list');
            const mealList = document.getElementById('meal-list');
            const connectionList = document.getElementById('connection-list');
            const garminWeeklyList = document.getElementById('garmin-weekly-list');
            const activityInspector = document.getElementById('activity-inspector');
            let currentSnapshot = initialSnapshot;
            let activeTab = ['general', 'sleep', 'activity'].includes(window.location.hash.replace('#', ''))
                ? window.location.hash.replace('#', '')
                : 'general';
            let selectedActivityKey = null;
            let selectedSleepKey = null;

            const escapeHtml = (value) => String(value ?? '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#39;');

            const formatNumber = (value) => {
                if (typeof value !== 'number' || Number.isNaN(value)) {
                    return '-';
                }

                return Number.isInteger(value)
                    ? value.toLocaleString('fr-FR')
                    : value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
            };

            const normalizeDateInput = (value) => {
                if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    return `${value}T00:00:00`;
                }

                return value;
            };

            const formatDate = (value) => {
                if (!value) {
                    return 'n/a';
                }

                const parsed = new Date(normalizeDateInput(value));
                if (Number.isNaN(parsed.getTime())) {
                    return escapeHtml(value);
                }

                return new Intl.DateTimeFormat('fr-FR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                }).format(parsed);
            };

            const formatDateOnly = (value) => {
                if (!value) {
                    return 'n/a';
                }

                const parsed = new Date(normalizeDateInput(value));
                if (Number.isNaN(parsed.getTime())) {
                    return escapeHtml(value);
                }

                return new Intl.DateTimeFormat('fr-FR', {
                    dateStyle: 'medium',
                }).format(parsed);
            };

            const formatClock = (value) => {
                if (!value) {
                    return 'n/a';
                }

                const parsed = new Date(value);
                if (Number.isNaN(parsed.getTime())) {
                    return escapeHtml(value);
                }

                return new Intl.DateTimeFormat('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                }).format(parsed);
            };

            const formatMetricValue = (value, unit = '') => {
                if (typeof value === 'number') {
                    const rendered = formatNumber(value);
                    return unit ? `${rendered} ${unit}` : rendered;
                }

                if (value === null || value === undefined || value === '') {
                    return 'n/a';
                }

                return unit ? `${value} ${unit}` : String(value);
            };

            const formatSignedMetricValue = (value, unit = '') => {
                if (typeof value !== 'number' || Number.isNaN(value)) {
                    return 'n/a';
                }

                const sign = value > 0 ? '+' : value < 0 ? '-' : '';
                const rendered = formatNumber(Math.abs(value));
                return unit ? `${sign}${rendered} ${unit}` : `${sign}${rendered}`;
            };

            const formatDurationMinutes = (value) => {
                if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
                    return 'n/a';
                }

                const rounded = Math.round(value);
                const hours = Math.floor(rounded / 60);
                const minutes = rounded % 60;

                if (!hours) {
                    return `${minutes} min`;
                }

                if (!minutes) {
                    return `${hours} h`;
                }

                return `${hours} h ${minutes}`;
            };

            const buildActivityKey = (activity = {}) => [
                activity.source || 'src',
                activity.id || activity.name || 'activity',
                activity.date || 'no-date',
            ].join(':');

            const buildSleepKey = (sleep = {}) => [
                sleep.date || 'no-date',
                sleep.startAt || 'no-start',
            ].join(':');

            const activityHasValue = (value) => {
                if (typeof value === 'number') {
                    return !Number.isNaN(value);
                }

                return value !== null && value !== undefined && value !== '';
            };

            const renderEmpty = (message) => `<p class="empty">${escapeHtml(message)}</p>`;

            const renderLineList = (lines, emptyMessage, columns = 2) => {
                const filteredLines = Array.isArray(lines)
                    ? lines.filter(([, value]) => value !== null && value !== undefined && value !== '')
                    : [];

                if (!filteredLines.length) {
                    return renderEmpty(emptyMessage);
                }

                const listClass = columns === 2
                    ? 'inspector-list columns-2'
                    : 'inspector-list';

                return `
                    <div class="${listClass}">
                        ${filteredLines.map(([label, value]) => `
                            <div class="inspector-line">
                                <span class="inspector-line-label">${escapeHtml(label)}</span>
                                <span class="inspector-line-value">${escapeHtml(value)}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            };

            const renderAnalysisPanel = (container, title, summary, lines, emptyMessage, columns = 2) => {
                if (!container) {
                    return;
                }

                const filteredLines = Array.isArray(lines)
                    ? lines.filter(([, value]) => value !== null && value !== undefined && value !== '')
                    : [];

                if (!filteredLines.length && !title && !summary) {
                    container.innerHTML = renderEmpty(emptyMessage);
                    return;
                }

                const heroMarkup = title || summary
                    ? `
                        <div class="inspector-hero">
                            ${title ? `<h3>${escapeHtml(title)}</h3>` : ''}
                            ${summary ? `<p class="muted">${escapeHtml(summary)}</p>` : ''}
                        </div>
                    `
                    : '';

                container.innerHTML = `
                    <div class="inspector-shell">
                        ${heroMarkup}
                        <div>${renderLineList(filteredLines, emptyMessage, columns)}</div>
                    </div>
                `;
            };

            const formatChartLabel = (value) => {
                if (!value) {
                    return 'n/a';
                }

                const parsed = new Date(normalizeDateInput(value));
                if (!Number.isNaN(parsed.getTime())) {
                    return new Intl.DateTimeFormat('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                    }).format(parsed);
                }

                const rendered = String(value);
                return rendered.length > 12 ? `${rendered.slice(0, 12)}...` : rendered;
            };

            const getExportLabel = (sourceDir) => {
                if (!sourceDir) {
                    return 'n/a';
                }

                const parts = String(sourceDir).split(/[\\/]/).filter(Boolean);
                return parts.length ? parts[parts.length - 1] : String(sourceDir);
            };

            const buildMiniChartMarkup = (points, config = {}) => {
                const filteredPoints = Array.isArray(points)
                    ? points.filter((point) => typeof point?.value === 'number' && !Number.isNaN(point.value))
                    : [];

                if (!filteredPoints.length) {
                    return renderEmpty(config.emptyMessage || 'Pas assez de donnees pour tracer un graphique.');
                }

                const width = 320;
                const height = 150;
                const padding = 16;
                const values = filteredPoints.map((point) => point.value);
                const min = Math.min(...values, 0);
                const max = Math.max(...values, 1);
                const range = max - min || 1;
                const stepX = filteredPoints.length > 1
                    ? (width - padding * 2) / (filteredPoints.length - 1)
                    : 0;
                const formatValue = typeof config.formatValue === 'function'
                    ? config.formatValue
                    : (value) => formatNumber(value);
                const accent = config.accent || '#1f8a70';
                const latestPoint = filteredPoints[filteredPoints.length - 1];
                const peakValue = Math.max(...values);
                const coords = filteredPoints.map((point, index) => {
                    const x = filteredPoints.length === 1
                        ? width / 2
                        : padding + stepX * index;
                    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);

                    return {
                        ...point,
                        x: Math.round(x * 10) / 10,
                        y: Math.round(y * 10) / 10,
                    };
                });

                const polyline = coords.map((point) => `${point.x},${point.y}`).join(' ');
                const area = `${coords[0].x},${height - padding} ${polyline} ${coords[coords.length - 1].x},${height - padding}`;
                const guides = [0.25, 0.5, 0.75].map((ratio) => {
                    const y = padding + (height - padding * 2) * ratio;
                    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(16, 36, 29, 0.08)" stroke-dasharray="4 4" />`;
                }).join('');

                return `
                    <div class="chart-meta">
                        <div>
                            <p class="chart-value">${escapeHtml(formatValue(latestPoint.value))}</p>
                            <p class="chart-hint">${escapeHtml(config.latestLabel || 'Dernier point')}</p>
                        </div>
                        <div>
                            <p class="chart-value">${escapeHtml(formatValue(peakValue))}</p>
                            <p class="chart-hint">${escapeHtml(config.peakLabel || 'Pic')}</p>
                        </div>
                    </div>
                    <div class="chart-frame">
                        <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
                            ${guides}
                            <polygon points="${area}" fill="${accent}" opacity="0.12"></polygon>
                            <polyline points="${polyline}" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
                            ${coords.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="3.5" fill="${accent}" />`).join('')}
                        </svg>
                    </div>
                    <div class="chart-axis" style="grid-template-columns: repeat(${coords.length}, minmax(0, 1fr));">
                        ${coords.map((point) => `<span>${escapeHtml(point.label || 'n/a')}</span>`).join('')}
                    </div>
                `;
            };

            const renderChart = (container, points, config = {}) => {
                if (!container) {
                    return;
                }

                container.innerHTML = buildMiniChartMarkup(points, config);
            };

            const setActiveTab = (tabName) => {
                activeTab = ['general', 'sleep', 'activity'].includes(tabName)
                    ? tabName
                    : 'general';

                tabButtons.forEach((button) => {
                    const isActive = button.dataset.tabTrigger === activeTab;
                    button.classList.toggle('is-active', isActive);
                    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
                });

                tabPanels.forEach((panel) => {
                    panel.hidden = panel.dataset.tabPanel !== activeTab;
                });

                if (window.location.hash !== `#${activeTab}`) {
                    window.history.replaceState(null, '', `${window.location.pathname}#${activeTab}`);
                }
            };

            const initializeTabs = () => {
                tabButtons.forEach((button) => {
                    button.addEventListener('click', () => {
                        setActiveTab(button.dataset.tabTrigger || 'general');
                    });
                });

                setActiveTab(activeTab);
            };

            const renderKpiGrid = (container, kpis, emptyMessage) => {
                if (!container) {
                    return;
                }

                if (!Array.isArray(kpis) || !kpis.length) {
                    container.innerHTML = renderEmpty(emptyMessage);
                    return;
                }

                container.innerHTML = kpis.map((kpi) => `
                    <div class="kpi">
                        <p class="kpi-label">${escapeHtml(kpi.label || 'Metric')}</p>
                        <p class="kpi-value">
                            ${escapeHtml(formatNumber(kpi.value))}
                            <span class="kpi-unit">${escapeHtml(kpi.unit || '')}</span>
                        </p>
                    </div>
                `).join('');
            };

            const renderHero = (payload) => {
                const athlete = payload?.fitness?.athlete || {};
                const garminProfile = payload?.garmin?.profile || payload?.fitness?.garminProfile || {};
                const avatar = athlete.avatar || garminProfile.avatar || '';
                const location = [athlete.city, athlete.country].filter(Boolean).join(', ');
                const coverage = payload?.garmin?.coverage || {};
                const chips = [
                    athlete.name,
                    location,
                    garminProfile.name,
                    coverage.startDate && coverage.endDate ? `Crawler ${coverage.startDate} -> ${coverage.endDate}` : null,
                ].filter(Boolean);

                heroChips.innerHTML = chips.length
                    ? chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join('')
                    : '<span class="chip">Aucune identite synchronisee</span>';

                heroAvatar.innerHTML = avatar
                    ? `<img src="${escapeHtml(avatar)}" alt="Avatar athlete">`
                    : '<span class="avatar-fallback">LA</span>';

                generatedAt.textContent = `Snapshot: ${payload?.generatedAt || 'n/a'}`;
                crawlerGeneratedAt.textContent = `Crawler: ${payload?.garmin?.generatedAt || 'n/a'}`;
                crawlerExportLabel.textContent = `Export Garmin: ${getExportLabel(payload?.garmin?.sourceDir)}`;
                crawlerCoverage.textContent = coverage.startDate && coverage.endDate
                    ? `Couverture Garmin: ${coverage.startDate} -> ${coverage.endDate}`
                    : 'Couverture Garmin: n/a';
            };

            const resolveActivities = (payload = {}) => {
                return Array.isArray(payload?.fitness?.recentActivities)
                    ? payload.fitness.recentActivities
                    : [];
            };

            const resolveSelectedActivity = (payload = {}) => {
                const activities = resolveActivities(payload);
                if (!activities.length) {
                    selectedActivityKey = null;
                    return null;
                }

                const selected = activities.find((activity) => buildActivityKey(activity) === selectedActivityKey);
                if (selected) {
                    return selected;
                }

                selectedActivityKey = buildActivityKey(activities[0]);
                return activities[0];
            };

            const resolveSleepEntries = (payload = {}) => {
                const recentSleep = Array.isArray(payload?.garmin?.sleep?.recent)
                    ? payload.garmin.sleep.recent
                    : [];

                if (recentSleep.length) {
                    return recentSleep;
                }

                const latestSleep = payload?.garmin?.sleep || {};
                return latestSleep?.date ? [latestSleep] : [];
            };

            const resolveSelectedSleep = (payload = {}) => {
                const nights = resolveSleepEntries(payload);
                if (!nights.length) {
                    selectedSleepKey = null;
                    return null;
                }

                const selected = nights.find((night) => buildSleepKey(night) === selectedSleepKey);
                if (selected) {
                    return selected;
                }

                selectedSleepKey = buildSleepKey(nights[0]);
                return nights[0];
            };

            const renderDataSources = (payload = {}) => {
                if (!dataSourceList) {
                    return;
                }

                const coverage = payload?.garmin?.coverage || {};
                const exportLabel = getExportLabel(payload?.garmin?.sourceDir);
                const lines = [
                    ['Export Garmin actif', exportLabel],
                    ['Dossier source', payload?.garmin?.sourceDir ? `garmin crawler/exports/${exportLabel}` : null],
                    ['Crawler genere', payload?.garmin?.generatedAt ? formatDate(payload.garmin.generatedAt) : null],
                    ['Snapshot page', payload?.generatedAt ? formatDate(payload.generatedAt) : null],
                    ['Couverture', coverage.startDate && coverage.endDate ? `${coverage.startDate} -> ${coverage.endDate}` : null],
                    ['Derniere sync nutrition', payload?.nutrition?.lastEntryAt ? formatDate(payload.nutrition.lastEntryAt) : null],
                    ['Activites visibles', Array.isArray(payload?.fitness?.recentActivities) ? formatMetricValue(payload.fitness.recentActivities.length) : null],
                ];

                dataSourceList.innerHTML = renderLineList(
                    lines,
                    'Aucune information de source disponible.'
                );
            };

            const renderAiCards = (container, items, emptyMessage) => {
                if (!container) {
                    return;
                }

                if (!Array.isArray(items) || !items.length) {
                    container.innerHTML = renderEmpty(emptyMessage);
                    return;
                }

                container.innerHTML = items.map((item) => `
                    <article class="detail-card">
                        <p class="detail-title">${escapeHtml(item)}</p>
                    </article>
                `).join('');
            };

            const renderAiReport = (payload = {}) => {
                const ai = payload?.ai || {};
                const report = ai?.report || null;

                if (!aiReportHero || !aiReportMeta) {
                    return;
                }

                const metaParts = [
                    ai?.provider ? `Moteur ${String(ai.provider).toUpperCase()}` : null,
                    ai?.model ? `Modele ${ai.model}` : null,
                    ai?.generatedAt ? `Genere ${formatDate(ai.generatedAt)}` : null,
                    ai?.status && ai.status !== 'ready' ? `Statut ${ai.status}` : null,
                ].filter(Boolean);

                aiReportMeta.textContent = metaParts.length
                    ? metaParts.join(' - ')
                    : 'Analyse locale Ollama des performances, du sommeil et des activites recentes.';

                if (!ai?.available || !report) {
                    aiReportHero.innerHTML = `
                        <h3>Compte-rendu IA indisponible</h3>
                        <p class="muted">${escapeHtml(ai?.message || 'Ollama ne repond pas encore sur cette machine.')}</p>
                    `;

                    renderAiCards(aiReportHighlights, [], 'Aucun point fort IA disponible.');
                    renderAiCards(aiReportWatchouts, [], 'Aucun point de vigilance IA disponible.');
                    renderAiCards(aiReportNextSteps, [], 'Aucune action IA disponible.');
                    return;
                }

                aiReportHero.innerHTML = `
                    <h3>${escapeHtml(report.headline || 'Compte-rendu IA')}</h3>
                    <p class="muted">${escapeHtml(report.summary || '')}</p>
                `;

                renderAiCards(aiReportHighlights, report.highlights || [], 'Aucun point fort IA disponible.');
                renderAiCards(aiReportWatchouts, report.watchouts || [], 'Aucun point de vigilance IA disponible.');
                renderAiCards(aiReportNextSteps, report.nextSteps || [], 'Aucune action IA disponible.');
            };

            const renderCharts = (payload = {}) => {
                const weeklyDays = Array.isArray(payload?.garmin?.weekly)
                    ? payload.garmin.weekly.slice(0, 7).reverse()
                    : [];
                const sleepDays = resolveSleepEntries(payload).slice(0, 7).reverse();
                const activities = resolveActivities(payload).slice(0, 7).reverse();

                renderChart(
                    generalStepsChart,
                    weeklyDays.map((day) => ({
                        label: formatChartLabel(day.date),
                        value: Number(day.steps || 0),
                    })),
                    {
                        accent: '#1f8a70',
                        formatValue: (value) => `${formatNumber(value)} pas`,
                        latestLabel: 'Dernier jour',
                        peakLabel: 'Max semaine',
                    }
                );

                renderChart(
                    generalCaloriesChart,
                    weeklyDays.map((day) => ({
                        label: formatChartLabel(day.date),
                        value: Number(day.activeCalories || 0),
                    })),
                    {
                        accent: '#eb5e28',
                        formatValue: (value) => `${formatNumber(value)} kcal`,
                        latestLabel: 'Dernier jour',
                        peakLabel: 'Pic calories',
                    }
                );

                renderChart(
                    sleepHoursChart,
                    sleepDays.map((night) => ({
                        label: formatChartLabel(night.date),
                        value: Number(night.hours || 0),
                    })),
                    {
                        accent: '#1f8a70',
                        formatValue: (value) => `${formatNumber(value)} h`,
                        latestLabel: 'Derniere nuit',
                        peakLabel: 'Plus longue',
                    }
                );

                renderChart(
                    sleepScoreChart,
                    sleepDays.map((night) => ({
                        label: formatChartLabel(night.date),
                        value: Number(night.score || 0),
                    })),
                    {
                        accent: '#eb5e28',
                        formatValue: (value) => `${formatNumber(value)} /100`,
                        latestLabel: 'Dernier score',
                        peakLabel: 'Meilleur score',
                    }
                );

                renderChart(
                    activityDistanceChart,
                    activities.map((activity) => ({
                        label: formatChartLabel(activity.date),
                        value: Number(activity.distanceKm || 0),
                    })),
                    {
                        accent: '#eb5e28',
                        formatValue: (value) => `${formatNumber(value)} km`,
                        latestLabel: 'Derniere activite',
                        peakLabel: 'Plus longue',
                    }
                );

                renderChart(
                    activityLoadChart,
                    activities.map((activity) => ({
                        label: formatChartLabel(activity.date),
                        value: Number(activity.trainingLoad || 0),
                    })),
                    {
                        accent: '#10241d',
                        formatValue: (value) => `${formatNumber(value)} load`,
                        latestLabel: 'Derniere charge',
                        peakLabel: 'Charge max',
                    }
                );
            };

            const renderWeeklyBlocks = (blocks = []) => {
                if (!weeklyBlocksList) {
                    return;
                }

                if (!Array.isArray(blocks) || !blocks.length) {
                    weeklyBlocksList.innerHTML = renderEmpty('Aucune semaine complete disponible dans le crawler.');
                    return;
                }

                weeklyBlocksList.innerHTML = blocks.map((week) => {
                    const recoveryParts = [
                        activityHasValue(week.avgSleepHours) ? `${formatMetricValue(week.avgSleepHours, 'h')}` : null,
                        activityHasValue(week.avgSleepScore) ? `score ${formatMetricValue(week.avgSleepScore)}` : null,
                        activityHasValue(week.avgBodyBatteryGain) ? `BB ${formatSignedMetricValue(week.avgBodyBatteryGain)}` : null,
                    ].filter(Boolean);
                    const regularityParts = [
                        activityHasValue(week.activeDays) ? `${formatMetricValue(week.activeDays)} j actifs` : null,
                        activityHasValue(week.sleepTrackedDays) ? `${formatMetricValue(week.sleepTrackedDays)} nuits` : null,
                        activityHasValue(week.regularityPercent) ? `${formatMetricValue(week.regularityPercent, '%')}` : null,
                    ].filter(Boolean);

                    return `
                        <article class="week-row">
                            <div>
                                <p class="week-date">${escapeHtml(week.label || 'Semaine')}</p>
                                <p class="muted">${escapeHtml(`${formatDateOnly(week.rangeStart)} -> ${formatDateOnly(week.rangeEnd)}`)}</p>
                            </div>
                            <div>
                                <p class="week-metric-label">Volume</p>
                                <p class="week-metric-value">${escapeHtml(formatMetricValue(week.distanceKm || 0, 'km'))} / ${escapeHtml(formatMetricValue(week.durationHours || 0, 'h'))}</p>
                            </div>
                            <div>
                                <p class="week-metric-label">Intensite</p>
                                <p class="week-metric-value">Load ${escapeHtml(formatMetricValue(week.trainingLoad || 0))} · ${escapeHtml(formatMetricValue(week.highIntensitySessions || 0))} HI</p>
                            </div>
                            <div>
                                <p class="week-metric-label">Recuperation</p>
                                <p class="week-metric-value">${escapeHtml(recoveryParts.join(' - ') || 'n/a')}</p>
                            </div>
                            <div>
                                <p class="week-metric-label">Regularite</p>
                                <p class="week-metric-value">${escapeHtml(regularityParts.join(' - ') || 'n/a')}</p>
                            </div>
                        </article>
                    `;
                }).join('');
            };

            const renderAdvancedAnalytics = (payload = {}) => {
                const analytics = payload?.garmin?.analytics || {};
                const recovery = analytics?.recovery || {};
                const correlations = Array.isArray(analytics?.correlations)
                    ? analytics.correlations
                    : [];
                const temperature = analytics?.temperature || {};
                const fatigue = analytics?.fatigue || {};
                const runningQuality = analytics?.runningQuality || {};
                const favorableCount = correlations.filter((entry) => entry?.favorable === true).length;

                renderAnalysisPanel(
                    sleepRecoveryAnalysis,
                    recovery.status || 'Recovery sommeil',
                    recovery.summary || '',
                    [
                        ['Fenetre', activityHasValue(recovery.sampleSize) ? `${formatMetricValue(recovery.sampleSize)} nuits` : null],
                        ['Sommeil moyen', activityHasValue(recovery.averageSleepHours) ? formatMetricValue(recovery.averageSleepHours, 'h') : null],
                        ['Cible moyenne', activityHasValue(recovery.targetSleepHours) ? formatMetricValue(recovery.targetSleepHours, 'h') : null],
                        ['Deficit cumule', activityHasValue(recovery.sleepDebtHours) ? formatMetricValue(recovery.sleepDebtHours, 'h') : null],
                        ['Nuits sous cible', activityHasValue(recovery.nightsBelowTarget) ? formatMetricValue(recovery.nightsBelowTarget) : null],
                        ['Score moyen', activityHasValue(recovery.averageSleepScore) ? formatMetricValue(recovery.averageSleepScore, '/100') : null],
                        ['HRV moyenne', activityHasValue(recovery.averageHrv) ? formatMetricValue(recovery.averageHrv, 'ms') : null],
                        ['Body battery +', activityHasValue(recovery.averageBodyBatteryGain) ? formatMetricValue(recovery.averageBodyBatteryGain, 'pts') : null],
                        ['Stress sommeil', activityHasValue(recovery.averageSleepStress) ? formatMetricValue(recovery.averageSleepStress, '/100') : null],
                        ['Delta sommeil', activityHasValue(recovery.sleepHoursDelta) ? formatSignedMetricValue(recovery.sleepHoursDelta, 'h') : null],
                        ['Delta score', activityHasValue(recovery.sleepScoreDelta) ? formatSignedMetricValue(recovery.sleepScoreDelta, 'pts') : null],
                        ['Delta body battery', activityHasValue(recovery.bodyBatteryDelta) ? formatSignedMetricValue(recovery.bodyBatteryDelta, 'pts') : null],
                    ],
                    'Aucune analyse recovery disponible.'
                );

                renderAnalysisPanel(
                    sleepCorrelationAnalysis,
                    'Correlations sommeil / recovery',
                    correlations.length
                        ? `${formatMetricValue(favorableCount)} relations sur ${formatMetricValue(correlations.length)} vont dans le sens attendu.`
                        : 'Pas assez de nuits pour calculer des correlations fiables.',
                    correlations.map((entry) => [
                        entry.label || 'Correlation',
                        [
                            entry.relationship || entry.insight || null,
                            typeof entry.coefficient === 'number' ? `r ${formatSignedMetricValue(entry.coefficient)}` : null,
                            activityHasValue(entry.sampleSize) ? `n ${formatMetricValue(entry.sampleSize)}` : null,
                        ].filter(Boolean).join(' - '),
                    ]),
                    'Pas assez de nuits pour calculer des correlations.'
                );

                renderAnalysisPanel(
                    sleepTemperatureAnalysis,
                    temperature.status || 'Temperature cutanee',
                    temperature.summary || '',
                    [
                        ['Fenetre', activityHasValue(temperature.sampleSize) ? `${formatMetricValue(temperature.sampleSize)} nuits` : null],
                        ['Derniere nuit', activityHasValue(temperature.latestDeviationC) ? formatSignedMetricValue(temperature.latestDeviationC, 'deg C') : null],
                        ['Baseline', activityHasValue(temperature.baselineDeviationC) ? formatSignedMetricValue(temperature.baselineDeviationC, 'deg C') : null],
                        ['Derive', activityHasValue(temperature.driftC) ? formatSignedMetricValue(temperature.driftC, 'deg C') : null],
                        ['Moyenne', activityHasValue(temperature.averageDeviationC) ? formatSignedMetricValue(temperature.averageDeviationC, 'deg C') : null],
                        ['Min / max', activityHasValue(temperature.minDeviationC) && activityHasValue(temperature.maxDeviationC) ? `${formatSignedMetricValue(temperature.minDeviationC, 'deg C')} / ${formatSignedMetricValue(temperature.maxDeviationC, 'deg C')}` : null],
                        ['Nuits elevees', activityHasValue(temperature.elevatedNightCount) ? formatMetricValue(temperature.elevatedNightCount) : null],
                    ],
                    'Aucune temperature cutanee exploitable.'
                );

                renderAnalysisPanel(
                    activityFatigueAnalysis,
                    fatigue.status || 'Charge entrainement',
                    fatigue.summary || '',
                    [
                        ['Fenetre', activityHasValue(fatigue.windowDays) ? `${formatMetricValue(fatigue.windowDays)} jours` : null],
                        ['Charge recente', activityHasValue(fatigue.acuteLoad) ? formatMetricValue(fatigue.acuteLoad, 'load') : null],
                        ['Charge precedente', activityHasValue(fatigue.previousLoad) ? formatMetricValue(fatigue.previousLoad, 'load') : null],
                        ['Ratio charge', activityHasValue(fatigue.loadRatio) ? formatMetricValue(fatigue.loadRatio) : null],
                        ['Seances intenses', activityHasValue(fatigue.highIntensitySessions) ? formatMetricValue(fatigue.highIntensitySessions) : null],
                        ['Jours actifs', activityHasValue(fatigue.activeDays) ? formatMetricValue(fatigue.activeDays) : null],
                        ['Jours repos', activityHasValue(fatigue.restDays) ? formatMetricValue(fatigue.restDays) : null],
                        ['Sommeil moyen', activityHasValue(fatigue.averageSleepHours) ? formatMetricValue(fatigue.averageSleepHours, 'h') : null],
                        ['Deficit sommeil', activityHasValue(fatigue.sleepDebtHours) ? formatMetricValue(fatigue.sleepDebtHours, 'h') : null],
                        ['Body battery +', activityHasValue(fatigue.averageBodyBatteryGain) ? formatMetricValue(fatigue.averageBodyBatteryGain, 'pts') : null],
                        ['Stress sommeil', activityHasValue(fatigue.averageSleepStress) ? formatMetricValue(fatigue.averageSleepStress, '/100') : null],
                        ['Score fatigue', activityHasValue(fatigue.riskScore) ? formatMetricValue(fatigue.riskScore, '/100') : null],
                    ],
                    'Aucune charge recente suffisante pour estimer la fatigue.'
                );

                renderAnalysisPanel(
                    runningQualityAnalysis,
                    runningQuality.status || 'Qualite de course',
                    runningQuality.summary || '',
                    [
                        ['Echantillon', activityHasValue(runningQuality.sampleSize) ? `${formatMetricValue(runningQuality.sampleSize)} sorties` : null],
                        ['Cadence moy.', activityHasValue(runningQuality.averageCadence) ? formatMetricValue(runningQuality.averageCadence, 'spm') : null],
                        ['Delta cadence', activityHasValue(runningQuality.cadenceDelta) ? formatSignedMetricValue(runningQuality.cadenceDelta, 'spm') : null],
                        ['Contact sol moy.', activityHasValue(runningQuality.averageGroundContactTimeMs) ? formatMetricValue(runningQuality.averageGroundContactTimeMs, 'ms') : null],
                        ['Delta contact sol', activityHasValue(runningQuality.groundContactDeltaMs) ? formatSignedMetricValue(runningQuality.groundContactDeltaMs, 'ms') : null],
                        ['Oscillation moy.', activityHasValue(runningQuality.averageVerticalOscillationCm) ? formatMetricValue(runningQuality.averageVerticalOscillationCm, 'cm') : null],
                        ['Delta oscillation', activityHasValue(runningQuality.verticalOscillationDeltaCm) ? formatSignedMetricValue(runningQuality.verticalOscillationDeltaCm, 'cm') : null],
                        ['Foulee moy.', activityHasValue(runningQuality.averageStrideLengthCm) ? formatMetricValue(runningQuality.averageStrideLengthCm, 'cm') : null],
                        ['Delta foulee', activityHasValue(runningQuality.strideLengthDeltaCm) ? formatSignedMetricValue(runningQuality.strideLengthDeltaCm, 'cm') : null],
                        ['Allure moyenne', activityHasValue(runningQuality.averagePaceMinPerKm) ? formatMetricValue(runningQuality.averagePaceMinPerKm, 'min/km') : null],
                    ],
                    'Pas assez de sorties course pour evaluer la qualite de course.'
                );

                renderChart(
                    sleepHrvChart,
                    resolveSleepEntries(payload)
                        .slice(0, 7)
                        .reverse()
                        .map((night) => ({
                            label: formatChartLabel(night.date),
                            value: Number(night.avgOvernightHrv ?? Number.NaN),
                        })),
                    {
                        accent: '#10241d',
                        formatValue: (value) => `${formatNumber(value)} ms`,
                        latestLabel: 'Derniere nuit',
                        peakLabel: 'HRV max',
                    }
                );

                renderChart(
                    sleepTempChart,
                    Array.isArray(temperature.series)
                        ? temperature.series.map((point) => ({
                            label: formatChartLabel(point.date),
                            value: Number(point.value),
                        }))
                        : [],
                    {
                        accent: '#eb5e28',
                        formatValue: (value) => `${formatSignedMetricValue(value, 'deg C')}`,
                        latestLabel: 'Derniere nuit',
                        peakLabel: 'Max recent',
                    }
                );

                renderChart(
                    runningCadenceChart,
                    Array.isArray(runningQuality.series)
                        ? runningQuality.series.map((point) => ({
                            label: formatChartLabel(point.date),
                            value: Number(point.cadence ?? Number.NaN),
                        }))
                        : [],
                    {
                        accent: '#1f8a70',
                        formatValue: (value) => `${formatNumber(value)} spm`,
                        latestLabel: 'Derniere sortie',
                        peakLabel: 'Cadence max',
                    }
                );

                renderChart(
                    runningGctChart,
                    Array.isArray(runningQuality.series)
                        ? runningQuality.series.map((point) => ({
                            label: formatChartLabel(point.date),
                            value: Number(point.groundContactTimeMs ?? Number.NaN),
                        }))
                        : [],
                    {
                        accent: '#10241d',
                        formatValue: (value) => `${formatNumber(value)} ms`,
                        latestLabel: 'Derniere sortie',
                        peakLabel: 'Max recent',
                    }
                );

                renderWeeklyBlocks(analytics?.weeklyBlocks || []);
            };

            const renderActivities = (payload = {}) => {
                const activities = resolveActivities(payload);
                const selected = resolveSelectedActivity(payload);

                if (!Array.isArray(activities) || !activities.length) {
                    activityList.innerHTML = renderEmpty('Aucune activite recente.');
                    return;
                }

                activityList.innerHTML = activities.map((activity) => {
                    const activityKey = buildActivityKey(activity);
                    const isActive = activityKey === buildActivityKey(selected || {});

                    return `
                    <article class="timeline-item${isActive ? ' is-active' : ''}" data-activity-key="${escapeHtml(activityKey)}" tabindex="0" role="button">
                        <span class="source source-${escapeHtml(activity.source || 'garmin')}">${escapeHtml((activity.source || 'src').toUpperCase())}</span>
                        <div>
                            <p class="item-name">${escapeHtml(activity.name || 'Activity')}</p>
                            <p class="item-meta">
                                ${escapeHtml(activity.type || 'Activity')} - ${formatDate(activity.date)} - ${escapeHtml(formatNumber(activity.durationMin || 0))} min - D+ ${escapeHtml(formatNumber(activity.elevationM || 0))} m
                            </p>
                        </div>
                        <p class="item-distance">${escapeHtml(formatNumber(activity.distanceKm || 0))} km</p>
                    </article>
                `;
                }).join('');

                activityList.querySelectorAll('[data-activity-key]').forEach((item) => {
                    const activate = () => {
                        selectedActivityKey = item.dataset.activityKey;
                        renderActivities(currentSnapshot);
                        renderActivityInspector(currentSnapshot);
                    };

                    item.addEventListener('click', activate);
                    item.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            activate();
                        }
                    });
                });
            };

            const renderSleepAnalysis = (payload = {}) => {
                const recentNights = resolveSleepEntries(payload);
                const sleep = resolveSelectedSleep(payload);

                if (!sleep) {
                    if (garminSleepInspector) {
                        garminSleepInspector.innerHTML = renderEmpty('Selectionne une nuit pour afficher le detail.');
                    }
                    if (garminSleepBreakdown) {
                        garminSleepBreakdown.innerHTML = renderEmpty('Aucun detail de cycle sommeil disponible.');
                    }
                    if (garminSleepRecovery) {
                        garminSleepRecovery.innerHTML = renderEmpty('Aucune donnee de recovery sommeil disponible.');
                    }
                    if (garminSleepInsights) {
                        garminSleepInsights.innerHTML = renderEmpty('Aucune lecture Garmin supplementaire.');
                    }
                    if (garminSleepRecentList) {
                        garminSleepRecentList.innerHTML = renderEmpty('Aucune nuit Garmin recente disponible.');
                    }
                    return;
                }

                const summaryParts = [
                    sleep.startAt && sleep.endAt ? `${formatClock(sleep.startAt)} -> ${formatClock(sleep.endAt)}` : null,
                    activityHasValue(sleep.score) ? `score ${formatMetricValue(sleep.score, '/100')}` : null,
                    sleep.hrvStatus ? `HRV ${sleep.hrvStatus}` : null,
                ].filter(Boolean);

                const summaryChips = [
                    activityHasValue(sleep.hours) ? formatMetricValue(sleep.hours, 'h') : null,
                    activityHasValue(sleep.deepMinutes) ? `Deep ${formatDurationMinutes(sleep.deepMinutes)}` : null,
                    activityHasValue(sleep.remMinutes) ? `REM ${formatDurationMinutes(sleep.remMinutes)}` : null,
                    activityHasValue(sleep.bodyBatteryChange) ? `Body battery ${sleep.bodyBatteryChange > 0 ? '+' : ''}${formatMetricValue(sleep.bodyBatteryChange, 'pts')}` : null,
                    activityHasValue(sleep.awakeCount) ? `${formatMetricValue(sleep.awakeCount)} reveils` : null,
                ].filter(Boolean);

                if (garminSleepInspector) {
                    garminSleepInspector.innerHTML = `
                        <h3>Nuit du ${escapeHtml(formatDateOnly(sleep.date))}</h3>
                        <p class="muted">${escapeHtml(summaryParts.join(' - ') || 'Sleep log Garmin')}</p>
                        <div class="inspector-meta">
                            ${summaryChips.map((chip) => `<span class="mini-chip">${escapeHtml(chip)}</span>`).join('')}
                        </div>
                    `;
                }

                const breakdownLines = [
                    ['Debut', sleep.startAt ? formatDate(sleep.startAt) : null],
                    ['Fin', sleep.endAt ? formatDate(sleep.endAt) : null],
                    ['Temps au lit', activityHasValue(sleep.timeInBedMinutes) && sleep.timeInBedMinutes > 0 ? formatDurationMinutes(sleep.timeInBedMinutes) : null],
                    ['Efficacite', activityHasValue(sleep.efficiencyPercent) ? formatMetricValue(sleep.efficiencyPercent, '%') : null],
                    ['Siestes', activityHasValue(sleep.napMinutes) ? formatDurationMinutes(sleep.napMinutes) : null],
                    ['Reveils', activityHasValue(sleep.awakeCount) ? formatMetricValue(sleep.awakeCount) : null],
                    ['Sommeil profond', activityHasValue(sleep.deepMinutes) ? formatDurationMinutes(sleep.deepMinutes) : null],
                    ['Sommeil leger', activityHasValue(sleep.lightMinutes) ? formatDurationMinutes(sleep.lightMinutes) : null],
                    ['REM', activityHasValue(sleep.remMinutes) ? formatDurationMinutes(sleep.remMinutes) : null],
                    ['Temps eveille', activityHasValue(sleep.awakeMinutes) ? formatDurationMinutes(sleep.awakeMinutes) : null],
                ];

                const recoveryLines = [
                    ['HRV nuit', activityHasValue(sleep.avgOvernightHrv) ? formatMetricValue(sleep.avgOvernightHrv, 'ms') : null],
                    ['Statut HRV', sleep.hrvStatus || null],
                    ['Body battery +', activityHasValue(sleep.bodyBatteryChange) ? formatMetricValue(sleep.bodyBatteryChange, 'pts') : null],
                    ['Stress sommeil', activityHasValue(sleep.avgSleepStress) ? formatMetricValue(sleep.avgSleepStress, '/100') : null],
                    ['FC sommeil', activityHasValue(sleep.avgHeartRate) ? formatMetricValue(sleep.avgHeartRate, 'bpm') : null],
                    ['FC repos', activityHasValue(sleep.restingHeartRate) ? formatMetricValue(sleep.restingHeartRate, 'bpm') : null],
                    ['SpO2 moyenne', activityHasValue(sleep.avgSpO2) && sleep.avgSpO2 > 0 ? formatMetricValue(sleep.avgSpO2, '%') : null],
                    ['SpO2 min / max', activityHasValue(sleep.minSpO2) && sleep.minSpO2 > 0 && activityHasValue(sleep.maxSpO2) && sleep.maxSpO2 > 0 ? `${formatNumber(sleep.minSpO2)} / ${formatNumber(sleep.maxSpO2)} %` : null],
                    ['Respiration moy.', activityHasValue(sleep.avgRespiration) && sleep.avgRespiration > 0 ? formatMetricValue(sleep.avgRespiration, '/min') : null],
                    ['Respiration min / max', activityHasValue(sleep.minRespiration) && sleep.minRespiration > 0 && activityHasValue(sleep.maxRespiration) && sleep.maxRespiration > 0 ? `${formatNumber(sleep.minRespiration)} / ${formatNumber(sleep.maxRespiration)} /min` : null],
                    ['Temp. peau', activityHasValue(sleep.avgSkinTempDeviationC) ? formatMetricValue(sleep.avgSkinTempDeviationC, 'deg C') : null],
                    ['Besoin sommeil', activityHasValue(sleep.sleepNeedMinutes) && sleep.sleepNeedMinutes > 0 ? formatDurationMinutes(sleep.sleepNeedMinutes) : null],
                    ['Besoin vs base', activityHasValue(sleep.sleepNeedDeltaMinutes) && activityHasValue(sleep.sleepNeedBaselineMinutes) && sleep.sleepNeedBaselineMinutes > 0 ? `${sleep.sleepNeedDeltaMinutes > 0 ? '+' : ''}${formatNumber(sleep.sleepNeedDeltaMinutes)} min vs ${formatDurationMinutes(sleep.sleepNeedBaselineMinutes)}` : null],
                    ['Feedback besoin', sleep.sleepNeedFeedback || null],
                    ['Respiration perturbee', sleep.breathingDisruptionSeverity || null],
                ];

                const insightChips = [
                    sleep.scoreLabel ? `Score ${sleep.scoreLabel}` : null,
                    sleep.durationLabel ? `Duree ${sleep.durationLabel}` : null,
                    sleep.stressLabel ? `Stress ${sleep.stressLabel}` : null,
                    sleep.awakeLabel ? `Reveils ${sleep.awakeLabel}` : null,
                    sleep.deepLabel ? `Deep ${sleep.deepLabel}` : null,
                    sleep.lightLabel ? `Light ${sleep.lightLabel}` : null,
                    sleep.remLabel ? `REM ${sleep.remLabel}` : null,
                    sleep.restlessnessLabel ? `Agitation ${sleep.restlessnessLabel}` : null,
                    sleep.insight || null,
                    sleep.personalizedInsight || null,
                ].filter(Boolean);

                if (garminSleepBreakdown) {
                    garminSleepBreakdown.innerHTML = renderLineList(
                        breakdownLines,
                        'Aucun detail de cycle sommeil disponible.'
                    );
                }

                if (garminSleepRecovery) {
                    garminSleepRecovery.innerHTML = renderLineList(
                        recoveryLines,
                        'Aucune donnee de recovery sommeil disponible.'
                    );
                }

                if (garminSleepInsights) {
                    garminSleepInsights.innerHTML = insightChips.length
                        ? insightChips.map((chip) => `<span class="mini-chip">${escapeHtml(chip)}</span>`).join('')
                        : renderEmpty('Aucune lecture Garmin supplementaire.');
                }

                if (!garminSleepRecentList) {
                    return;
                }

                if (!recentNights.length) {
                    garminSleepRecentList.innerHTML = renderEmpty('Aucune nuit Garmin recente disponible.');
                    return;
                }

                garminSleepRecentList.innerHTML = recentNights.map((night) => {
                    const sleepKey = buildSleepKey(night);
                    const isActive = sleepKey === buildSleepKey(sleep);
                    const subtitleParts = [
                        night.startAt && night.endAt ? `${formatClock(night.startAt)} -> ${formatClock(night.endAt)}` : null,
                        night.scoreLabel ? `score ${night.scoreLabel}` : null,
                        night.hrvStatus ? `HRV ${night.hrvStatus}` : null,
                    ].filter(Boolean);

                    const nightChips = [
                        activityHasValue(night.score) ? `Score ${formatMetricValue(night.score, '/100')}` : null,
                        activityHasValue(night.avgOvernightHrv) ? `HRV ${formatMetricValue(night.avgOvernightHrv, 'ms')}` : null,
                        activityHasValue(night.bodyBatteryChange) ? `Body battery ${night.bodyBatteryChange > 0 ? '+' : ''}${formatMetricValue(night.bodyBatteryChange, 'pts')}` : null,
                        activityHasValue(night.deepMinutes) ? `Deep ${formatDurationMinutes(night.deepMinutes)}` : null,
                        activityHasValue(night.remMinutes) ? `REM ${formatDurationMinutes(night.remMinutes)}` : null,
                        activityHasValue(night.avgSleepStress) ? `Stress ${formatMetricValue(night.avgSleepStress, '/100')}` : null,
                    ].filter(Boolean);

                    return `
                        <article class="detail-card is-selectable${isActive ? ' is-active' : ''}" data-sleep-key="${escapeHtml(sleepKey)}" tabindex="0" role="button">
                            <div class="detail-head">
                                <div>
                                    <p class="detail-title">Nuit du ${escapeHtml(formatDateOnly(night.date))}</p>
                                    <p class="detail-subtitle">${escapeHtml(subtitleParts.join(' - ') || 'Sleep log Garmin')}</p>
                                </div>
                                <p class="item-distance">${escapeHtml(formatMetricValue(night.hours, 'h'))}</p>
                            </div>
                            <div class="detail-metrics">
                                ${nightChips.map((chip) => `<span class="mini-chip">${escapeHtml(chip)}</span>`).join('')}
                            </div>
                        </article>
                    `;
                }).join('');

                garminSleepRecentList.querySelectorAll('[data-sleep-key]').forEach((item) => {
                    const activate = () => {
                        selectedSleepKey = item.dataset.sleepKey;
                        renderSleepAnalysis(currentSnapshot);
                    };

                    item.addEventListener('click', activate);
                    item.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            activate();
                        }
                    });
                });
            };

            const renderActivityInspector = (payload = {}) => {
                const activity = resolveSelectedActivity(payload);
                if (!activity) {
                    activityInspector.innerHTML = renderEmpty('Selectionne une activite pour afficher le detail.');
                    return;
                }

                const overviewCards = [
                    { label: 'Distance', value: formatMetricValue(activity.distanceKm, 'km') },
                    { label: 'Duree', value: formatMetricValue(activity.durationMin, 'min') },
                    { label: 'Allure', value: activity.paceMinPerKm ? formatMetricValue(activity.paceMinPerKm, 'min/km') : null },
                    { label: 'Vitesse moy.', value: activity.avgSpeedKmh ? formatMetricValue(activity.avgSpeedKmh, 'km/h') : null },
                    { label: 'Calories', value: activityHasValue(activity.calories) ? formatMetricValue(activity.calories, 'kcal') : null },
                    { label: 'D+', value: activityHasValue(activity.elevationM) ? formatMetricValue(activity.elevationM, 'm') : null },
                    { label: 'FC moyenne', value: activity.avgHr ? formatMetricValue(activity.avgHr, 'bpm') : null },
                    { label: 'FC max', value: activity.maxHr ? formatMetricValue(activity.maxHr, 'bpm') : null },
                ].filter((metric) => metric.value);

                const performanceLines = [
                    ['Pas', activityHasValue(activity.steps) ? formatMetricValue(activity.steps, 'steps') : null],
                    ['Cadence moyenne', activity.avgCadence ? formatMetricValue(activity.avgCadence, 'spm') : null],
                    ['Cadence max', activity.maxCadence ? formatMetricValue(activity.maxCadence, 'spm') : null],
                    ['Puissance moyenne', activity.avgPower ? formatMetricValue(activity.avgPower, 'W') : null],
                    ['Puissance max', activity.maxPower ? formatMetricValue(activity.maxPower, 'W') : null],
                    ['Puissance normalisee', activity.normalizedPower ? formatMetricValue(activity.normalizedPower, 'W') : null],
                    ['Contact au sol', activity.groundContactTimeMs ? formatMetricValue(activity.groundContactTimeMs, 'ms') : null],
                    ['Longueur de foulee', activity.strideLengthCm ? formatMetricValue(activity.strideLengthCm, 'cm') : null],
                    ['Oscillation verticale', activity.verticalOscillationCm ? formatMetricValue(activity.verticalOscillationCm, 'cm') : null],
                    ['Ratio vertical', activity.verticalRatio ? formatMetricValue(activity.verticalRatio, '%') : null],
                ].filter(([, value]) => value);

                const trainingLines = [
                    ['Training effect', activity.trainingEffect ? formatMetricValue(activity.trainingEffect) : null],
                    ['Anaerobic effect', activity.anaerobicTrainingEffect ? formatMetricValue(activity.anaerobicTrainingEffect) : null],
                    ['Label charge', activity.trainingEffectLabel || null],
                    ['Load', activity.trainingLoad ? formatMetricValue(activity.trainingLoad) : null],
                    ['Moderate', activity.moderateIntensityMinutes ? formatMetricValue(activity.moderateIntensityMinutes, 'min') : null],
                    ['Vigorous', activity.vigorousIntensityMinutes ? formatMetricValue(activity.vigorousIntensityMinutes, 'min') : null],
                    ['Body battery delta', activityHasValue(activity.bodyBatteryDelta) ? formatMetricValue(activity.bodyBatteryDelta, 'pts') : null],
                    ['Stamina debut', activity.staminaStart ? formatMetricValue(activity.staminaStart, '%') : null],
                    ['Stamina fin', activity.staminaEnd ? formatMetricValue(activity.staminaEnd, '%') : null],
                    ['Stamina min', activity.staminaMin ? formatMetricValue(activity.staminaMin, '%') : null],
                    ['Hydratation estimee', activity.waterEstimatedMl ? formatMetricValue(activity.waterEstimatedMl, 'ml') : null],
                ].filter(([, value]) => value);

                const metaLines = [
                    ['Source', (activity.source || '').toUpperCase()],
                    ['Type', activity.type || null],
                    ['Evenement', activity.eventType || null],
                    ['Date', formatDate(activity.date)],
                    ['Appareil', activity.device || null],
                    ['Tours', activity.lapCount ? formatMetricValue(activity.lapCount) : null],
                    ['Upload', activity.uploadedAt ? formatDate(activity.uploadedAt) : null],
                    ['Detail avance', activity.isDetailed ? 'Oui' : 'Partiel'],
                ].filter(([, value]) => value);

                const notes = [activity.aerobicMessage, activity.anaerobicMessage].filter(Boolean);
                const splits = Array.isArray(activity.splits) ? activity.splits : [];

                const renderLineBlock = (title, lines, options = {}) => {
                    if (!lines.length) {
                        return '';
                    }

                    const listClass = options.columns === 2
                        ? 'inspector-list columns-2'
                        : 'inspector-list';

                    return `
                        <div>
                            <h3 class="section-title">${escapeHtml(title)}</h3>
                            <div class="${listClass}">
                                ${lines.map(([label, value]) => `
                                    <div class="inspector-line">
                                        <span class="inspector-line-label">${escapeHtml(label)}</span>
                                        <span class="inspector-line-value">${escapeHtml(value)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                };

                activityInspector.innerHTML = `
                    <div class="inspector-hero">
                        <span class="source source-${escapeHtml(activity.source || 'garmin')}">${escapeHtml((activity.source || 'src').toUpperCase())}</span>
                        <h3 style="margin-top:10px;">${escapeHtml(activity.name || 'Activity')}</h3>
                        <p class="muted">${escapeHtml(activity.type || 'Activity')} - ${formatDate(activity.date)}</p>
                        <div class="inspector-meta">
                            <span class="mini-chip">${escapeHtml(formatMetricValue(activity.distanceKm, 'km'))}</span>
                            <span class="mini-chip">${escapeHtml(formatMetricValue(activity.durationMin, 'min'))}</span>
                            ${activity.trainingEffectLabel ? `<span class="mini-chip">${escapeHtml(activity.trainingEffectLabel)}</span>` : ''}
                            ${activity.trainingLoad ? `<span class="mini-chip">Load ${escapeHtml(formatMetricValue(activity.trainingLoad))}</span>` : ''}
                            ${activity.avgHr ? `<span class="mini-chip">HR ${escapeHtml(formatMetricValue(activity.avgHr, 'bpm'))}</span>` : ''}
                        </div>
                    </div>
                    <div>
                        <h3 class="section-title">Synthese</h3>
                        <div class="inspector-grid">
                            ${overviewCards.map((metric) => `
                                <div class="inspector-card">
                                    <p class="inspector-label">${escapeHtml(metric.label)}</p>
                                    <p class="inspector-value">${escapeHtml(metric.value)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ${renderLineBlock('Performance', performanceLines, { columns: 2 })}
                    ${renderLineBlock('Charge et ressenti', trainingLines, { columns: 2 })}
                    ${notes.length ? `
                        <div>
                            <h3 class="section-title">Lecture Garmin</h3>
                            <div class="detail-metrics">
                                ${notes.map((note) => `<span class="mini-chip">${escapeHtml(note)}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${splits.length ? `
                        <div>
                            <h3 class="section-title">Splits / blocs</h3>
                            <div class="split-list">
                                ${splits.map((split) => `
                                    <article class="split-card">
                                        <div class="split-head">
                                            <div>
                                                <p class="split-title">${escapeHtml(split.label || 'Split')}</p>
                                                <p class="split-subtitle">${escapeHtml(formatMetricValue(split.count || 0))} blocs</p>
                                            </div>
                                            <p class="item-distance">${escapeHtml(formatMetricValue(split.distanceKm, 'km'))}</p>
                                        </div>
                                        <div class="split-metrics">
                                            <span class="mini-chip">${escapeHtml(formatMetricValue(split.durationMin, 'min'))}</span>
                                            ${split.paceMinPerKm ? `<span class="mini-chip">${escapeHtml(formatMetricValue(split.paceMinPerKm, 'min/km'))}</span>` : ''}
                                            ${split.avgSpeedKmh ? `<span class="mini-chip">${escapeHtml(formatMetricValue(split.avgSpeedKmh, 'km/h'))}</span>` : ''}
                                            ${split.avgHr ? `<span class="mini-chip">HR ${escapeHtml(formatMetricValue(split.avgHr, 'bpm'))}</span>` : ''}
                                            ${split.avgPower ? `<span class="mini-chip">${escapeHtml(formatMetricValue(split.avgPower, 'W'))}</span>` : ''}
                                            ${split.calories ? `<span class="mini-chip">${escapeHtml(formatMetricValue(split.calories, 'kcal'))}</span>` : ''}
                                        </div>
                                    </article>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div>
                            <h3 class="section-title">Splits / blocs</h3>
                            ${renderEmpty('Pas de splits detailles disponibles pour cette activite.')}
                        </div>
                    `}
                    ${renderLineBlock('Metadonnees', metaLines, { columns: 2 })}
                `;
            };

            const renderMeals = (meals = []) => {
                if (!Array.isArray(meals) || !meals.length) {
                    mealList.innerHTML = renderEmpty('Aucune entree nutrition disponible.');
                    return;
                }

                mealList.innerHTML = meals.map((meal) => `
                    <article class="meal">
                        <div>
                            <p class="meal-name">${escapeHtml(meal.name || 'Meal')}</p>
                            <p class="meal-meta">${escapeHtml(formatNumber(meal.grams || 0))} g - ${escapeHtml(meal.capturedAtLabel || meal.capturedAt || 'n/a')}</p>
                        </div>
                        <p class="meal-calories">${escapeHtml(formatNumber(meal.calories || 0))} kcal</p>
                    </article>
                `).join('');
            };

            const renderConnections = (connections = []) => {
                if (!Array.isArray(connections) || !connections.length) {
                    connectionList.innerHTML = renderEmpty('Aucune information de connexion.');
                    return;
                }

                connectionList.innerHTML = connections.map((connection) => {
                    const status = connection.status || 'disconnected';

                    return `
                        <article class="connection-card">
                            <div>
                                <h3>${escapeHtml(connection.name || 'Connection')}</h3>
                                <p class="muted">Dernier sync: ${escapeHtml(connection.lastSync || 'n/a')}</p>
                            </div>
                            <span class="status status-${escapeHtml(status)}">
                                <span class="status-dot"></span>
                                <span>${escapeHtml(status)}</span>
                            </span>
                        </article>
                    `;
                }).join('');
            };

            const renderWeekly = (days = []) => {
                if (!Array.isArray(days) || !days.length) {
                    garminWeeklyList.innerHTML = renderEmpty('Aucune fenetre Garmin disponible.');
                    return;
                }

                garminWeeklyList.innerHTML = days.map((day) => `
                    <article class="week-row">
                        <div>
                            <p class="week-date">${escapeHtml(day.date || 'n/a')}</p>
                            <p class="muted">Garmin</p>
                        </div>
                        <div>
                            <p class="week-metric-label">Pas</p>
                            <p class="week-metric-value">${escapeHtml(formatNumber(day.steps || 0))}</p>
                        </div>
                        <div>
                            <p class="week-metric-label">Calories</p>
                            <p class="week-metric-value">${escapeHtml(formatNumber(day.activeCalories || 0))} kcal</p>
                        </div>
                        <div>
                            <p class="week-metric-label">Sommeil</p>
                            <p class="week-metric-value">${escapeHtml(formatNumber(day.sleepHours || 0))} h</p>
                        </div>
                        <div>
                            <p class="week-metric-label">FC repos</p>
                            <p class="week-metric-value">${escapeHtml(formatNumber(day.restingHeartRate || 0))} bpm</p>
                        </div>
                    </article>
                `).join('');
            };

            const renderWarnings = (warnings = []) => {
                warningList.innerHTML = '';

                if (!warnings.length) {
                    warningBox.style.display = 'none';
                    return;
                }

                warningBox.style.display = 'block';
                warningList.innerHTML = warnings
                    .map((warning) => `<li>${escapeHtml(warning)}</li>`)
                    .join('');
            };

            const renderSnapshot = (payload) => {
                currentSnapshot = payload;
                renderHero(payload);
                renderKpiGrid(fitnessKpiGrid, payload?.fitness?.kpis || [], 'Aucune metrique fitness disponible pour le moment.');
                renderKpiGrid(nutritionKpiGrid, payload?.nutrition?.kpis || [], 'Aucune metrique nutrition disponible pour le moment.');
                renderKpiGrid(garminTodayKpiGrid, payload?.garmin?.today?.kpis || [], 'Aucune metrique Garmin quotidienne disponible.');
                renderKpiGrid(garminSleepKpiGrid, payload?.garmin?.sleep?.kpis || [], 'Aucune metrique sommeil disponible.');
                renderDataSources(payload);
                renderAiReport(payload);
                renderCharts(payload);
                renderAdvancedAnalytics(payload);
                renderSleepAnalysis(payload);
                renderActivities(payload);
                renderActivityInspector(payload);
                renderMeals(payload?.nutrition?.recentEntries || []);
                renderConnections(payload?.connections || []);
                renderWeekly(payload?.garmin?.weekly || []);
                renderWarnings(payload?.warnings || []);

                garminDayLabel.textContent = `Dernier resume quotidien Garmin: ${payload?.garmin?.today?.date || 'n/a'}`;

                const sleepParts = [
                    payload?.garmin?.sleep?.date ? `Nuit du ${payload.garmin.sleep.date}` : null,
                    activityHasValue(payload?.garmin?.sleep?.hours) ? `${formatMetricValue(payload.garmin.sleep.hours, 'h')}` : null,
                    payload?.garmin?.sleep?.scoreLabel ? `score ${payload.garmin.sleep.scoreLabel}` : null,
                    payload?.garmin?.sleep?.hrvStatus ? `HRV ${payload.garmin.sleep.hrvStatus}` : null,
                ].filter(Boolean);

                garminSleepLabel.textContent = sleepParts.length
                    ? sleepParts.join(' - ')
                    : 'Derniere nuit capturee par le crawler Garmin.';

                rawSnapshot.textContent = JSON.stringify(payload, null, 2);
            };

            refreshButton?.addEventListener('click', async () => {
                refreshButton.disabled = true;
                refreshButton.textContent = 'Sync en cours...';

                try {
                    const response = await fetch(`${endpoint}?live=1`, {
                        headers: { 'Accept': 'application/json' }
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const payload = await response.json();
                    renderSnapshot(payload);
                } catch (error) {
                    renderWarnings([`Live refresh failed: ${error.message}`]);
                } finally {
                    refreshButton.disabled = false;
                    refreshButton.textContent = 'Rafraichir en live';
                }
            });

            initializeTabs();
            renderSnapshot(initialSnapshot);
        })();
    </script>
</body>
</html>

