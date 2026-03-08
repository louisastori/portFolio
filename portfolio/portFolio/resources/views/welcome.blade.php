<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Louis Astori - Étudiant en BTS SIO SLAM</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Arial, sans-serif;
            line-height: 1.7;
            background-color: #f4f4f4;
            color: #333;
        }

        .page-shell {
            min-height: 100vh;
            padding: 96px 20px 40px;
        }

        .container {
            max-width: 840px;
            margin: 0 auto;
            padding: 32px;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            text-align: center;
        }

        h1 {
            margin: 0 0 24px;
            color: #444;
            font-size: clamp(2rem, 4vw, 2.8rem);
            line-height: 1.15;
        }

        p {
            margin: 0;
            font-size: 1.05rem;
        }

        p + p {
            margin-top: 18px;
        }

        @media (max-width: 700px) {
            .container {
                padding: 24px;
            }

            p {
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    @include('partials.navbar')

    <main class="page-shell">
        <section class="container">
            <h1>Louis Astori - Étudiant en BTS SIO SLAM</h1>

            <p>
                Passionné par l'informatique et le développement logiciel, je suis actuellement en deuxième année de BTS
                Services Informatiques aux Organisations (SIO), option Solutions Logicielles et Applications Métiers
                (SLAM). Fort d'une solide formation en programmation, conception de bases de données et gestion de
                projets informatiques, je souhaite aujourd’hui approfondir mes compétences dans le développement
                d'applications et l'architecture logicielle.
            </p>

            <p>
                Curieux et motivé par les nouvelles technologies, j’ai à cœur d’apprendre continuellement et de
                progresser dans le domaine du développement informatique. En parallèle, ma passion pour le vélo de route
                m’a permis de développer rigueur, persévérance et esprit d’équipe, des qualités que je m’efforce de
                mettre en pratique dans mes projets informatiques.
            </p>

            <p>
                Dans cette optique, je suis actuellement à la recherche d’une alternance dans le domaine du développement
                logiciel, afin de mettre en pratique mes compétences, relever de nouveaux défis techniques et contribuer
                activement à des projets ambitieux au sein d’une entreprise.
            </p>
        </section>
    </main>
</body>
</html>
