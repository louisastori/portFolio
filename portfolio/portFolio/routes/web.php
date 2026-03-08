<?php

use App\Http\Controllers\PerformanceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/cv', function () {
    return view('cv');
});

Route::get('/portFolioCompetence', function () {
    return view('portFolioCompetence');
});

Route::get('/performance', [PerformanceController::class, 'index'])
    ->name('performance');

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
