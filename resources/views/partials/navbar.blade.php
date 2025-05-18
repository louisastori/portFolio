<link href="{{ asset('css/app.css') }}" rel="stylesheet">

<nav class="bg-black shadow fixed w-full top-0 z-50">
    <div class="max-w-6xl mx-auto px-4">
        <div class="flex justify-center">
            <div class="flex space-x-6 py-4">
                <a href="{{ url('/') }}" class="text-white font-bold hover:text-gray-300">
                    Accueil
                </a>
                <a href="{{ url('/presentation') }}" class="{{ request()->is('presentation') ? 'text-red-500 font-semibold' : 'text-white hover:text-gray-300' }}">
                    Présentation
                </a>
                <a href="{{ url('/cv') }}" class="{{ request()->is('cv') ? 'text-red-500 font-semibold' : 'text-white hover:text-gray-300' }}">
                    CV
                </a>
                <a href="{{ url('/portfolio') }}" class="{{ request()->is('portfolio') ? 'text-red-500 font-semibold' : 'text-white hover:text-gray-300' }}">
                    Portfolio
                </a>
                <a href="{{ url('/portFolioCompetence') }}" class="{{ request()->is('portFolioCompetence') ? 'text-red-500 font-semibold' : 'text-white hover:text-gray-300' }}">
                    Par compétence
                </a>
            </div>
        </div>
    </div>
</nav>
