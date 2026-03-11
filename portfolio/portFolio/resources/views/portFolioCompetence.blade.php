<body>
        @include('partials.navbar')
    <div class="max-w-6xl mx-auto mt-12 p-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
        <h2 class="text-2xl font-bold text-center text-gray-800 dark:text-white mb-8">Mes Competences</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Carte 1 -->
            <div class="bg-blue-100 dark:bg-blue-900 p-6 rounded-xl shadow-md flex flex-col justify-between">
                <div>
                    <h3 class="text-xl font-semibold text-blue-800 dark:text-white mb-2">Gérer le patrimoine informatique</h3>
                    <p class="text-sm text-blue-700 dark:text-blue-200 mb-4">Gestion du patrimoine informatique et la sauvegarde</p>
                </div>
                <a href="{{ url('/patrimoineInformatique') }}" class="mt-auto inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Accéder</a>
            </div>

            <!-- Carte 2 -->
            <div class="bg-green-100 dark:bg-green-900 p-6 rounded-xl shadow-md flex flex-col justify-between">
                <div>
                    <h3 class="text-xl font-semibold text-green-800 dark:text-white mb-2">Gestion d’anomalies</h3>
                    <p class="text-sm text-green-700 dark:text-green-200 mb-4">Suivez les anomalies et apprenez comment elles sont traitées.</p>
                </div>
                <a href="{{ url('/gestionAnomalie') }}" class="mt-auto inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">Accéder</a>
            </div>

            <!-- Carte 3 -->
            <div class="bg-purple-100 dark:bg-purple-900 p-6 rounded-xl shadow-md flex flex-col justify-between">
                <div>
                    <h3 class="text-xl font-semibold text-purple-800 dark:text-white mb-2">Présence en ligne</h3>
                    <p class="text-sm text-purple-700 dark:text-purple-200 mb-4">Consultez mes projets publiés et mon empreinte numérique.</p>
                </div>
                <a href="{{ url('/presenceEnLigne') }}" class="mt-auto inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">Accéder</a>
            </div>

            <!-- Carte 4 -->
            <div class="bg-yellow-100 dark:bg-yellow-900 p-6 rounded-xl shadow-md flex flex-col justify-between">
                <div>
                    <h3 class="text-xl font-semibold text-yellow-800 dark:text-white mb-2">Travail en mode projet</h3>
                    <p class="text-sm text-yellow-700 dark:text-yellow-200 mb-4">Exemples de projets menés avec méthodologie et collaboration.</p>
                </div>
                <a href="{{ url('/travaillerModeProjet') }}" class="mt-auto inline-block bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition">Accéder</a>
            </div>

            <!-- Carte 5 -->
            <div class="bg-red-100 dark:bg-red-900 p-6 rounded-xl shadow-md flex flex-col justify-between">
                <div>
                    <h3 class="text-xl font-semibold text-red-800 dark:text-white mb-2">Disponibilité des services</h3>
                    <p class="text-sm text-red-700 dark:text-red-200 mb-4">Analyse de la fiabilité des services informatiques.</p>
                </div>
                <a href="{{ url('/dispoService') }}" class="mt-auto inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">Accéder</a>
            </div>

            <!-- Carte 6 -->
            <div class="bg-gray-100 dark:bg-gray-900 p-6 rounded-xl shadow-md flex flex-col justify-between">
                <div>
                    <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Développement professionnel</h3>
                    <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">Explorez mes formations, veilles et ambitions professionnelles.</p>
                </div>
                <a href="{{ url('/developpementPro') }}" class="mt-auto inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition">Accéder</a>
            </div>
        </div>
    </div>
</body>