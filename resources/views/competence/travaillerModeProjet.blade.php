<body>
    @include('partials.navbar')

    <div style="height: 50px;"></div>

    <div class="conteneur">
        <div class="titre">Travail en méthode Agile</div>

        <img src="{{ asset('img/travailleEnModeProjet.png') }}" alt="Organisation Agile" class="image-encadree">

        <div class="description">
            Nous avons travaillé en méthode Agile. La méthode consiste à répondre à des <em>features</em>. Les features sont de petites tâches qui sont découpées par le PM (Product Manager).
        </div>
    </div>

    <div style="height: 50px;"></div>

    <div class="conteneur">
        <div class="titre">Gestion des Anomalie</div>

        <img src="{{ asset('img/tableauAnomalie.png') }}" alt="Tableau de gestion des anomalies" class="image-encadree">

        <div class="description">
            La gestion des anomalie est découpé en plusieurs partie, le nouveau sert à afficher les nouvelle anomalie qui sont remonté dans la journée. Chaque matin le capitaine Anno vas passer sur les anomalie nouvelle et les passer en prise en compte pour qu’un développeur pluie faire les modification pour ne plus avoir d’anomalie. Les anomalie sont vérifiés par la testeuse de l’équipe pour être passer en terminer.
        </div>
    </div>


    
</body>