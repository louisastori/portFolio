<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<link href="{{ asset('css/app.css') }}" rel="stylesheet">

<nav class="bg-black shadow fixed w-full top-0 z-50" x-data="{ open: false, subOpen: null }">
    <div class="max-w-6xl mx-auto px-4">
        <div class="flex justify-center">
            <div class="flex space-x-6 py-4 items-center">
                <a href="{{ url('/') }}" class="text-white font-bold hover:text-gray-300">Accueil</a>
                <a href="{{ url('/cv') }}" class="{{ request()->is('cv') ? 'text-red-500 font-semibold' : 'text-white hover:text-gray-300' }}">CV</a>
                <a href="{{ url('/portFolioCompetence') }}" class="{{ request()->is('portFolioCompetence') ? 'text-red-500 font-semibold' : 'text-white hover:text-gray-300' }}">Par competence</a>
                <a href="{{ url('/performance') }}" class="{{ request()->is('performance') ? 'text-red-500 font-semibold' : 'text-white hover:text-gray-300' }}">Performance</a>
            </div>
        </div>
    </div>
</nav>
