<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<link href="{{ asset('css/app.css') }}" rel="stylesheet">

<nav class="bg-black shadow fixed w-full top-0 z-50" x-data="{ open: false, subOpen: null }">
    <div class="max-w-6xl mx-auto px-4">
        <div class="flex justify-center">
            <div class="flex space-x-6 py-4 items-center">
                <a href="{{ url('/') }}" class="text-white font-bold hover:text-gray-300">Accueil</a>
                <!--<a href="{{ url('/presentation') }}" class="{{ request()->is('presentation') ? 'text-red-500 font-semibold' : 'text-white hover:text-gray-300' }}">Présentation</a>-->
                <a href="{{ url('/cv') }}" class="{{ request()->is('cv') ? 'text-red-500 font-semibold' : 'text-white hover:text-gray-300' }}">CV</a>
                <!--<a href="{{ url('/portfolio') }}" class="{{ request()->is('portfolio') ? 'text-red-500 font-semibold' : 'text-white hover:text-gray-300' }}">Portfolio</a>-->
                <a href="{{ url('/portFolioCompetence') }}" class="{{ request()->is('portFolioCompetence') ? 'text-red-500 font-semibold' : 'text-white hover:text-gray-300' }}">Par compétence</a>

                <!-- Menu déroulant -->
                <!--
                <div class="relative" x-data="{ open: false }" @mouseleave="open = false">
                    <button @mouseenter="open = true" class="text-white hover:text-gray-300 focus:outline-none">
                        Expériences
                    </button>

                    <ul x-show="open" x-transition class="absolute top-full left-0 bg-white text-black mt-2 rounded shadow-lg py-2 w-48 z-50">
                        <li class="relative" x-data="{ subOpen: false }" @mouseleave="subOpen = false">
                            <button @mouseenter="subOpen = true" class="w-full text-left px-4 py-2 hover:bg-gray-200">Stages</button>
                            <ul x-show="subOpen" x-transition class="absolute top-0 left-full bg-white mt-0 ml-2 rounded shadow-lg py-2 w-48 z-50">
                                <li><a href="#stage-bts" class="block px-4 py-2 hover:bg-gray-200">BTS SIO</a></li>
                                <li><a href="#stage-licence" class="block px-4 py-2 hover:bg-gray-200">Licence Pro</a></li>
                            </ul>
                        </li>
                        <li class="relative" x-data="{ subOpen: false }" @mouseleave="subOpen = false">
                            <button @mouseenter="subOpen = true" class="w-full text-left px-4 py-2 hover:bg-gray-200">Alternance</button>
                            <ul x-show="subOpen" x-transition class="absolute top-0 left-full bg-white mt-0 ml-2 rounded shadow-lg py-2 w-48 z-50">
                                <li><a href="#alt-bts" class="block px-4 py-2 hover:bg-gray-200">BTS SIO</a></li>
                                <li><a href="#alt-master" class="block px-4 py-2 hover:bg-gray-200">Master</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>-->
            </div>
        </div>
    </div>
</nav>
