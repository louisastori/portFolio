<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Louis Astori - Portfolio</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            background-color: #f9f9f9;
            color: #333;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        h1, h2, h3 {
            color: #444;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 10px;
        }
        .contact {
            margin-top: 20px;
            padding: 10px;
            background: #e9e9e9;
            border-radius: 5px;
        }
    </style>
</head>
<body>

    @include('partials.navbar')
    
    <div class="container">
        <h1>Louis Astori</h1>
        <p>
            Étudiant en deuxième année de BTS Services Informatiques aux Organisations (SIO), option Solutions Logicielles et Applications Métiers (SLAM). 
            Passionné par le développement logiciel, l'informatique et la cybersécurité, je cherche à approfondir mes compétences dans la conception et la gestion de projets informatiques.
        </p>

        <h2>Compétences</h2>
        <ul>
            <li><strong>Programmation :</strong> MySQL, Python, C#, Java, Angular, HTML5.</li>
            <li><strong>Systèmes d'exploitation :</strong> Windows, Linux.</li>
            <li><strong>Cybersécurité :</strong> Protection des données personnelles, sécurisation de sites web.</li>
            <li><strong>Administration réseau :</strong> Adressage IP, accès distant (SSH, telnet), câblage, commutateurs et routeurs.</li>
            <li><strong>Outils collaboratifs :</strong> Trello, GitLab.</li>
        </ul>

        <h2>Projets et Réalisations</h2>
        <ul>
            <li>Programmation en Angular et Java dans un environnement professionnel.</li>
            <li>Développement d'un site web dynamique avec gestion des tâches et des commits.</li>
            <li>Installation et maintenance de réseaux : brassage, câblage et configuration de routeurs/switchs.</li>
            <li>Participation à des projets de cybersécurité et mise en place de politiques RGPD.</li>
            <li>Travail sur des projets collaboratifs en méthode Agile.</li>
        </ul>

        <h2>Contact</h2>
        <div class="contact">
            <p><strong>Adresse :</strong> 26 rue Gérard Philipe, 33140 Villenave d’Ornon</p>
            <p><strong>Téléphone :</strong> 07 71 80 23 96</p>
            <p><strong>Email :</strong> louis.astori@gmail.com</p>
        </div>
    </div>
</body>
</html>
