<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Louis Astori - Etudiant en BTS SIO SLAM</title>
    <style>
        :root {
            --bg: #f5f1ea;
            --panel: #ffffff;
            --ink: #1d2a24;
            --muted: #53645d;
            --line: #d7e0d8;
            --accent: #c8551b;
            --accent-soft: rgba(200, 85, 27, 0.12);
            --shadow: 0 20px 45px rgba(29, 42, 36, 0.08);
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: var(--ink);
            background:
                radial-gradient(circle at top left, rgba(200, 85, 27, 0.12), transparent 32%),
                radial-gradient(circle at top right, rgba(36, 113, 88, 0.12), transparent 36%),
                var(--bg);
        }

        h1,
        h2,
        p {
            margin: 0;
        }

        .page-shell {
            min-height: 100vh;
            padding: 96px 20px 40px;
        }

        .container {
            max-width: 980px;
            margin: 0 auto;
            padding: 32px;
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 28px;
            box-shadow: var(--shadow);
        }

        .eyebrow {
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--accent);
        }

        h1 {
            font-size: clamp(2rem, 4vw, 3.2rem);
            line-height: 1.05;
        }

        .lead {
            margin-top: 16px;
            max-width: 62ch;
            font-size: 1.08rem;
            color: var(--muted);
        }

        .tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 18px;
        }

        .tag {
            display: inline-flex;
            align-items: center;
            padding: 8px 12px;
            border: 1px solid var(--line);
            border-radius: 999px;
            background: #fff;
            font-size: 0.92rem;
            font-weight: 700;
        }

        .content-grid {
            display: grid;
            grid-template-columns: 1.45fr 0.85fr;
            gap: 22px;
            margin-top: 26px;
        }

        .card {
            padding: 22px;
            border: 1px solid var(--line);
            border-radius: 20px;
            background: #fff;
        }

        .card p + p {
            margin-top: 14px;
        }

        .section-title {
            margin-bottom: 10px;
            font-size: 1.15rem;
        }

        .callout {
            background: linear-gradient(135deg, var(--accent-soft), rgba(36, 113, 88, 0.08));
        }

        .muted {
            color: var(--muted);
        }

        @media (max-width: 900px) {
            .content-grid {
                grid-template-columns: 1fr;
            }

            .container {
                padding: 24px;
            }
        }
    </style>
</head>
<body>
    @include('partials.navbar')

    <main class="page-shell">
        <section class="container">
            <p class="eyebrow">Accueil</p>
            <h1>Louis Astori - Etudiant en BTS SIO SLAM</h1>
            <p class="lead">
                Passionne par l'informatique et le developpement logiciel, je suis actuellement en deuxieme annee
                de BTS Services Informatiques aux Organisations, option Solutions Logicielles et Applications Metiers.
            </p>

            <div class="tag-list">
                <span class="tag">Developpement logiciel</span>
                <span class="tag">Architecture logicielle</span>
                <span class="tag">Bases de donnees</span>
                <span class="tag">Recherche d'alternance</span>
            </div>

            <div class="content-grid">
                <article class="card">
                    <h2 class="section-title">Presentation</h2>
                    <p>
                        Fort d'une solide formation en programmation, conception de bases de donnees et gestion de projets
                        informatiques, je souhaite aujourd'hui approfondir mes competences dans le developpement
                        d'applications et l'architecture logicielle.
                    </p>
                    <p>
                        Curieux et motive par les nouvelles technologies, j'ai a coeur d'apprendre continuellement et de
                        progresser dans le domaine du developpement informatique.
                    </p>
                    <p>
                        En parallele, ma passion pour le velo de route m'a permis de developper rigueur, perseverance et
                        esprit d'equipe, des qualites que je m'efforce de mettre en pratique dans mes projets
                        informatiques.
                    </p>
                </article>

                <aside class="card callout">
                    <h2 class="section-title">Objectif</h2>
                    <p>
                        Je suis actuellement a la recherche d'une alternance dans le domaine du developpement logiciel.
                    </p>
                    <p class="muted" style="margin-top: 12px;">
                        Mon objectif est de mettre en pratique mes competences, relever de nouveaux defis techniques et
                        contribuer activement a des projets ambitieux au sein d'une entreprise.
                    </p>
                </aside>
            </div>
        </section>
    </main>
</body>
</html>
