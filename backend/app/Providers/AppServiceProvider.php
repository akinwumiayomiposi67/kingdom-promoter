<?php

namespace App\Providers;

use App\Models\Disbursement;
use App\Observers\DisbursementObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Disbursement::observe(DisbursementObserver::class);
    }
}
