<?php

use App\Http\Controllers\Admin\ContributionCycleController;
use App\Http\Controllers\Admin\DisbursementController as AdminDisbursementController;
use App\Http\Controllers\Admin\MeetingController as AdminMeetingController;
use App\Http\Controllers\Admin\PackageController;
use App\Http\Controllers\Auth\InvitationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Member\ContributionController;
use App\Http\Controllers\Member\DisbursementController as MemberDisbursementController;
use App\Http\Controllers\Member\MeetingController as MemberMeetingController;
use App\Http\Controllers\Member\NotificationController;
use App\Http\Controllers\Member\WalletController;
use App\Http\Controllers\PrivateFileController;
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
    Route::post('/auth/fcm-token', [NotificationController::class, 'registerFcmToken']);

    // Member-only routes
    Route::middleware('member')->prefix('member')->group(function () {
        Route::get('/wallet', [WalletController::class, 'show']);

        Route::get('/packages', [PackageController::class, 'activePackages']);
        Route::post('/contributions/set-package', [ContributionController::class, 'setPackage']);
        Route::get('/contributions', [ContributionController::class, 'myContributions']);
        Route::get('/contributions/group', [ContributionController::class, 'groupContributions']);

        Route::get('/disbursements', [MemberDisbursementController::class, 'index']);
        Route::get('/disbursements/{id}', [MemberDisbursementController::class, 'show']);

        // Meetings
        Route::get('/meetings', [MemberMeetingController::class, 'index']);
        Route::get('/meetings/{id}', [MemberMeetingController::class, 'show']);
        Route::post('/meetings/{id}/rsvp', [MemberMeetingController::class, 'rsvp']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
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

        // Disbursements
        Route::get('/disbursements', [AdminDisbursementController::class, 'index']);
        Route::post('/disbursements', [AdminDisbursementController::class, 'store'])->middleware('two_factor');
        Route::get('/disbursements/{id}', [AdminDisbursementController::class, 'show']);
        Route::patch('/disbursements/{id}/publish', [AdminDisbursementController::class, 'publish'])->middleware('two_factor');

        // Meetings
        Route::get('/meetings', [AdminMeetingController::class, 'index']);
        Route::post('/meetings', [AdminMeetingController::class, 'store'])->middleware('two_factor');
        Route::get('/meetings/{id}', [AdminMeetingController::class, 'show']);
        Route::put('/meetings/{id}', [AdminMeetingController::class, 'update'])->middleware('two_factor');
    });

    // Receipt signed-URL generation (admin or active member)
    Route::get('/receipts/{disbursement}', [PrivateFileController::class, 'receipt']);
});

// Receipt file download — signature-verified, no auth middleware
Route::get('/receipts/{disbursement}/download', [PrivateFileController::class, 'download'])
    ->name('receipts.download');
