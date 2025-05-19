<body>
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">

    @include('partials.navbar')

    <div class="mt-16 max-w-3xl mx-auto px-4">

        <div class="bg-black text-white rounded-lg shadow-md p-6">
            <div class="text-2xl font-bold text-red-500 mb-4">
                Processus de Merge Request
            </div>

            <img src="{{ asset('img/mergeRequest.png') }}" alt="Illustration du processus de Merge Request"
                class="w-full h-auto rounded-md mb-4 border border-gray-600">

            <div class="text-gray-200 text-base space-y-4">
                <p>
                    Lors de mon deuxième stage, j’ai travaillé en suivant un processus de Merge Request (ou Pull Request, selon les plateformes). Une Merge Request consiste à proposer l’intégration de son code dans la branche principale du projet, après avoir travaillé sur une branche dédiée. C’est une pratique courante dans les équipes de développement utilisant Git.
                </p>

                <p>
                    Ce processus présente plusieurs avantages importants :
                </p>

                <ul class="list-disc list-inside space-y-2 text-gray-300">
                    <li>
                        Il permet de sauvegarder régulièrement son travail sur une branche personnelle ou fonctionnelle, tout en évitant d'impacter directement le code principal.
                    </li>
                    <li>
                        Il offre un cadre de relecture : avant que le code ne soit fusionné dans la branche principale, un ou plusieurs développeurs (ou le lead technique) examinent les modifications. Cela permet d’identifier d’éventuelles erreurs, d’améliorer la qualité du code, et d’assurer une cohérence globale du projet.
                    </li>
                    <li>
                        Une fois validée, la Merge Request permet de fusionner proprement les modifications, en gardant un historique clair de l’évolution du projet.
                    </li>
                </ul>

                <p>
                    Ce fonctionnement m’a permis d’avoir des retours réguliers sur mon travail, et d’apprendre à travailler de manière collaborative, en respectant les bonnes pratiques de versionnage et d’intégration continue.
                </p>
            </div>
        </div>
    </div>
</body>
