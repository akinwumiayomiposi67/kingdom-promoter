<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\User;
use App\Services\FcmService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class NotifyWalletCredited implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $userId,
        public readonly string $amount
    ) {}

    public function handle(FcmService $fcmService): void
    {
        try {
            Notification::create([
                'user_id' => $this->userId,
                'type'    => 'wallet.credited',
                'title'   => 'Wallet Funded',
                'body'    => 'Your wallet has been credited with ₦' . number_format((float) $this->amount, 2),
                'data'    => ['amount' => $this->amount],
            ]);
        } catch (\Throwable $e) {
            Log::warning("NotifyWalletCredited: failed to create notification for user {$this->userId}: {$e->getMessage()}");
        }

        try {
            $user = User::find($this->userId);
            if ($user) {
                $fcmService->send(
                    $user,
                    'Wallet Funded',
                    'Your wallet has been credited with ₦' . number_format((float) $this->amount, 2),
                    ['type' => 'wallet.credited', 'amount' => $this->amount]
                );
            }
        } catch (\Throwable $e) {
            Log::warning("NotifyWalletCredited: FCM failed for user {$this->userId}: {$e->getMessage()}");
        }
    }
}
