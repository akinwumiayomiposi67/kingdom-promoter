<?php

use App\Http\Controllers\Auth\InvitationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public auth routes — rate-limited to 10 requests per minute
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/invitation/validate', [InvitationController::class, 'validate']);
    Route::post('/auth/register', [RegisterController::class, 'register']);
    Route::post('/auth/login', [LoginController::class, 'login']);
});

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [LoginController::class, 'logout']);
    Route::get('/auth/me', [LoginController::class, 'me']);

    // Member-only routes
    Route::middleware('member')->prefix('member')->group(function () {
        // Phase 2+ endpoints
    });

    // Admin-only routes
    Route::middleware(['admin'])->prefix('admin')->group(function () {
        // Phase 2+ endpoints
    });
});
