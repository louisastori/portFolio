<body>
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">

    @include('partials.navbar')

    <div class="mt-16 max-w-3xl mx-auto px-4">

        <div class="bg-black text-white rounded-lg shadow-md p-6">
            <div class="text-2xl font-bold text-red-500 mb-4">
                Déploiement du Batch et du PN à l'aide du pipeline Concourse
            </div>

            <img src="{{ asset('img/deploiement.png') }}" alt="Pipeline Concourse"
                class="w-full h-auto rounded-md mb-4 border border-gray-600">

            <div class="text-gray-200 text-base mb-4">
                Lors de mon stage, je n’ai vu que la partie déploiement sur pipeline, sans intervenir directement sur sa configuration. Un pipeline (ou CI/CD pipeline, pour Continuous Integration / Continuous Deployment) est un enchaînement automatisé d'étapes permettant de valider, tester, et déployer une application de manière fiable et reproductible.
            </div>

            <img src="{{ asset('img/deploiement2.png') }}" alt="Détail du déploiement Pipeline"
                class="w-full h-auto rounded-md border border-gray-600">
        </div>

    </div>
</body>
