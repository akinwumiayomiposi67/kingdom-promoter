<?php

namespace App\Jobs;

use App\Exceptions\InsufficientBalanceException;
use App\Models\Contribution;
use App\Models\ContributionCycle;
use App\Services\WalletService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DebitMonthlyContributions implements ShouldQueue
{
    use Queueable;

    public function handle(WalletService $walletService): void
    {
        $todayDay = now()->day;

        $cycle = ContributionCycle::active()
            ->where('debit_day', $todayDay)
            ->first();

        if (! $cycle) {
            return;
        }

        $contributions = Contribution::with(['user.wallet'])
            ->where('contribution_cycle_id', $cycle->id)
            ->where('status', 'pending')
            ->get();

        foreach ($contributions as $contribution) {
            // Idempotency guard
            if ($contribution->status === 'paid') {
                continue;
            }

            $wallet = $contribution->user?->wallet;

            if (! $wallet) {
                Log::warning("DebitMonthlyContributions: No wallet for user {$contribution->user_id}");
                continue;
            }

            $reference = "CONTRIBUTION-{$cycle->id}-{$contribution->user_id}-" . now()->timestamp;

            try {
                $transaction = DB::transaction(function () use ($walletService, $wallet, $contribution, $reference, $cycle) {
                    $tx = $walletService->debit(
                        $wallet,
                        (string) $contribution->amount,
                        $reference,
                        "Monthly contribution — {$cycle->name}"
                    );

                    $contribution->update([
                        'status'               => 'paid',
                        'paid_at'              => now(),
                        'wallet_transaction_id' => $tx->id,
                    ]);

                    return $tx;
                });
            } catch (InsufficientBalanceException $e) {
                $contribution->update(['status' => 'failed']);
                Log::info("DebitMonthlyContributions: Insufficient balance for contribution {$contribution->id}");
            } catch (\Throwable $e) {
                Log::error("DebitMonthlyContributions: Unexpected error for contribution {$contribution->id}: {$e->getMessage()}");
            }
        }
    }
}
