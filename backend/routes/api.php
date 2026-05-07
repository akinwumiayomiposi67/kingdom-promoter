<?php

use App\Http\Controllers\Admin\ContributionCycleController;
use App\Http\Controllers\Admin\PackageController;
use App\Http\Controllers\Auth\InvitationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Member\ContributionController;
use App\Http\Controllers\Member\WalletController;
use App\Http\Controllers\Webhook\PaystackWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Paystack webhook — verified by VerifyPaystackWebhook middleware (no auth)
Route::post('/webhook/paystack', [PaystackWebhookController::class, 'receive'])
    ->middleware('paystack.webhook');

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
        Route::get('/wallet', [WalletController::class, 'show']);

        Route::post('/contributions/set-package', [ContributionController::class, 'setPackage']);
        Route::get('/contributions', [ContributionController::class, 'myContributions']);
        Route::get('/contributions/group', [ContributionController::class, 'groupContributions']);
    });

    // Admin-only routes
    Route::middleware(['admin'])->prefix('admin')->group(function () {
        // Packages
        Route::get('/packages', [PackageController::class, 'index']);
        Route::post('/packages', [PackageController::class, 'store'])->middleware('two_factor');
        Route::put('/packages/{id}', [PackageController::class, 'update'])->middleware('two_factor');
        Route::patch('/packages/{id}/toggle', [PackageController::class, 'toggleActive'])->middleware('two_factor');

        // Cycles
        Route::get('/cycles', [ContributionCycleController::class, 'index']);
        Route::post('/cycles', [ContributionCycleController::class, 'store'])->middleware('two_factor');
        Route::get('/cycles/{id}', [ContributionCycleController::class, 'show']);
        Route::patch('/cycles/{id}/close', [ContributionCycleController::class, 'close'])->middleware('two_factor');
    });
});
