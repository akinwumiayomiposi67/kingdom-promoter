<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class NotifyWalletCredited implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $userId,
        public readonly float $amount
    ) {}

    public function handle(): void
    {
        // Phase 5 will add FCM + email + in-app notification records
        Log::info("Wallet credited: user {$this->userId}, amount {$this->amount}");
    }
}
