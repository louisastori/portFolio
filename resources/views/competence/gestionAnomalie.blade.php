<body>
        @include('partials.navbar')


        <div style="height: 50px;"></div>


        <div class="conteneur">
            <div class="titre">M2L – Réservation de salles – Ticketing</div>
    
            <img src="img/m2lticketing" alt="Capture Trello du projet" class="image-encadree">

            <div class="description">
            Pour ce projet, nous avons fait une liste de tickets <strong>que nous nous sommes partagés</strong>, puis nous les avons cochés. Nous n’avons pas estimé le temps pour chaque ticket, et nous n’avons pas non plus mesuré le temps réalisé pour chaque ticket.
            </div>
        </div>

        <div style="height: 50px;"></div>


        <div class="conteneur">
            <div class="titre">Site Web Dynamique</div>

            <img src="{{ asset('img/siteDynamique.png') }}" alt="Board de gestion des tickets" class="image-encadree">

            <div class="description">
            Pour cette AP qui consiste à créer un site Web Dynamique, nous avons créé des tickets. Nous avons mis en place une gestion du temps et une estimation.
            </div>

            <img src="{{ asset('img/siteDynamique2.png') }}" alt="Historique des commits Git" class="image-encadree">

            <div class="description">
            Sur cette AP, nous avons choisi de faire un commit général à la toute fin du projet. Après réflexion, ce choix n’était pas bon : nous aurions dû faire des commits et des merges plus régulièrement.
            </div>
        </div>

        <div style="height: 50px;"></div>


        <div class="conteneur">
            <div class="titre">Fiche JIRA</div>

            <img src="{{ asset('img/ficheJira.png') }}" alt="Board JIRA" class="image-encadree">

            <div class="description">
                Les fiches JIRA sont un type de ticketing avec une explication de la modification à produire, le nombre d’heures qu’on prévoit d’avoir besoin est fait pendant le grooming. Le grooming est une réunion qui est effectuée pendant chaque changement de période de sprint.
            </div>

            <img src="{{ asset('img/ficheJira2.png') }}" alt="Détail fiche JIRA" class="image-encadree">

            <div class="description">
            Dans chaque tickets, nous avons une liste d’information sur la tâche à effectuer.
            </div>
        </div>


        <div style="height: 50px;"></div>


        <div class="conteneur">
            <div class="titre">Gestion des Anomalies</div>

            <img src="{{ asset('img/tableauAnomalie.png') }}" alt="Tableau de gestion des anomalies" class="image-encadree">

            <div class="description">
            La gestion des anomalies est découpée en plusieurs parties. La colonne « Nouveau » sert à afficher les nouvelles anomalies remontées dans la journée. Chaque matin, le capitaine Anno passe en revue les nouvelles anomalies et les affecte à un développeur pour correction. Une fois modifiée, l’anomalie est validée par la testeuse de l’équipe, puis déplacée dans la colonne « Terminé ».
            </div>
        </div>





</body>