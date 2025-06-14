<body>
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">

    @include('partials.navbar')
    
    <div style="margin-top: 50px;" class="max-w-3xl mx-auto px-4">

    <div class="mt-16 max-w-3xl mx-auto px-4">

        <div class="bg-black text-white rounded-lg shadow-md p-6">
            <div class="text-2xl font-bold text-red-500 mb-4">
                Observatoire et Piano
            </div>

            <img src="{{ asset('img/observatoire.jpg') }}" alt="Dashboard observatoire"
                class="w-full h-auto rounded-md mb-4 border border-gray-600">

            <div class="text-gray-200 text-base space-y-4">
                <p>
                    Piano est un outil de retour d’information utilisé pour évaluer la qualité des produits livrés, en
                    se basant sur des indicateurs d’usage et de navigation. Il permet notamment de mesurer la facilité de
                    prise en main, la fluidité de navigation à l’intérieur des interfaces, ou encore le comportement des
                    utilisateurs face à certaines fonctionnalités.
                </p>

                <p>
                    Les Product Owners (PO) s’appuient sur les données issues de Piano pour analyser l’expérience
                    utilisateur et détecter d’éventuels points de friction ou d’amélioration. Cela leur permet de
                    prioriser certaines évolutions ou corrections, en se basant sur des éléments factuels.
                </p>

                <p>
                    De leur côté, les développeurs peuvent consulter un tableau de suivi lié à Piano, qui indique où des
                    méthodes doivent être placées dans le code pour permettre la collecte des données. Cela nécessite donc
                    une intégration technique spécifique, afin que les bons événements soient correctement tracés et
                    analysés.
                </p>

                <p>
                    Lors de mon stage, on m’a présenté une démonstration complète de l’outil Piano Analytics, ainsi que
                    de l’Observatoire, un tableau de bord centralisant les indicateurs remontés. Cette démonstration m’a
                    permis de mieux comprendre comment les données d’usage sont exploitées pour piloter les évolutions du
                    produit et comment les développeurs contribuent directement à cette boucle de retour utilisateur en
                    instrumentant leur code.
                </p>
            </div>
        </div>
    </div>
</body>
