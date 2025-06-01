<body>
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">

    @include('partials.navbar')

    <div style="margin-top: 50px;" class="max-w-3xl mx-auto px-4">

    <div class="mt-16 max-w-3xl mx-auto px-4 space-y-16">

        <div class="bg-black text-white rounded-lg shadow-md p-6">
            <div class="text-2xl font-bold text-red-500 mb-4">Travail en méthode Agile</div>

            <img src="{{ asset('img/travailleEnModeProjet.png') }}" alt="Organisation Agile"
                class="w-full h-auto rounded-md mb-4 border border-gray-600">

            <div class="text-gray-200 text-base space-y-4">
                <p>
                    Lors de mon stage, nous avons travaillé en méthode Agile, un cadre de gestion de projet basé sur
                    l’adaptabilité, l'amélioration continue et la collaboration entre les différents acteurs
                    (développeurs, Product Owner, testeurs, etc.).
                </p>

                <p>
                    Contrairement à une approche en cascade, où tout est défini à l’avance, l’Agilité repose sur des
                    cycles courts appelés sprints, au cours desquels l’équipe livre des fonctionnalités concrètes et
                    potentiellement utilisables.
                </p>

                <p>
                    Nous étions organisés selon le cadre SAFe (Scaled Agile Framework), une méthode adaptée aux grandes
                    entreprises regroupant plusieurs équipes. SAFe introduit des rôles supplémentaires comme le Product
                    Manager (PM), qui travaille à un niveau plus global que le Product Owner.
                </p>

                <p>
                    Le Product Manager est responsable de découper les features, c’est-à-dire des blocs fonctionnels
                    représentant une valeur métier importante. Chaque feature est ensuite divisée en user stories,
                    affectées aux équipes de développement.
                </p>

                <p>
                    Cette organisation m’a permis de découvrir comment fonctionne un projet agile à grande échelle, en
                    comprenant à la fois les dynamiques d’équipe et la coordination générale assurée par les rôles SAFe.
                </p>
            </div>
        </div>

        <div class="bg-black text-white rounded-lg shadow-md p-6">
            <div class="text-2xl font-bold text-red-500 mb-4">Gestion des Anomalies</div>

            <img src="{{ asset('img/tableauAnomalie.png') }}" alt="Tableau de gestion des anomalies"
                class="w-full h-auto rounded-md mb-4 border border-gray-600">

            <div class="text-gray-200 text-base space-y-4">
                <p>
                    La gestion des anomalies était structurée en plusieurs étapes. Chaque matin, les nouvelles
                    anomalies signalées étaient visibles dans une colonne « Nouveau » du tableau Kanban.
                </p>

                <p>
                    Le « capitaine Anno », un rôle attribué à un membre de l’équipe, passait en revue ces anomalies.
                    Après analyse, il les faisait passer dans l’état « Prise en compte », indiquant qu’un développeur
                    allait être désigné pour effectuer la correction.
                </p>

                <p>
                    Une fois la correction réalisée, l’anomalie était placée dans l’état « À tester ». La testeuse de
                    l’équipe vérifiait alors que la correction était effective et qu’aucune régression n’avait été
                    introduite. Si tout était conforme, l’anomalie était marquée comme « Terminée ».
                </p>
            </div>
        </div>

    </div>
</body>
