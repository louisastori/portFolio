<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Route pour la page d'accueil (welcome)
Route::get('/', function () {
    return view('welcome');
});


////////////////////////////////////////

// Route pour la page "portfolio"
/*
Route::get('/portfolio', function () {
    return view('portFolio');
});*/
// Route pour la page "presentation"
/*
Route::get('/presentation', function () {
    return view('presentation');
});*/



// Route pour la page "CV"
Route::get('/cv', function () {
    return view('cv');
});
// Route pour la page "PortFolioCompetence"
Route::get('/portFolioCompetence', function () {
    return view('portFolioCompetence');
});

/////////////////////////////////

Route::get('/patrimoineInformatique', function () {
    return view('competence.patrimoineInformatique');
});

Route::get('/gestionAnomalie', function () {
    return view('competence.gestionAnomalie');
});

Route::get('/presenceEnLigne', function () {
    return view('competence.presenceEnLigne');
});



Route::get('/travaillerModeProjet', function () {
    return view('competence.travaillerModeProjet');
});

Route::get('/dispoService', function () {
    return view('competence.dispoService');
});

Route::get('/developpementPro', function () {
    return view('competence.developpementPro');
});

/*

Gérer le patrimoine Informatique

Répondre aux incidents et aux demandes d’assistance et d’évolution

Développer la présence en ligne de l’organisation

Travailler en mode projet

Mettre à disposition des utilisateurs un service informatique

Organiser son développement professionnel
*/





