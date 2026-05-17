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

class DebitMonthlyCycleContributions implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $cycleId) {}

    public function handle(WalletService $walletService): void
    {
        $cycle = ContributionCycle::find($this->cycleId);

        if (! $cycle) {
            Log::warning("DebitMonthlyCycleContributions: Cycle {$this->cycleId} not found.");
            return;
        }

        $contributions = Contribution::with(['user.wallet'])
            ->where('contribution_cycle_id', $cycle->id)
            ->where('status', 'pending')
            ->get();

        foreach ($contributions as $contribution) {
            $wallet = $contribution->user?->wallet;

            if (! $wallet) {
                Log::warning("DebitMonthlyCycleContributions: No wallet for user {$contribution->user_id}");
                continue;
            }

            $reference = "CONTRIBUTION-{$cycle->id}-{$contribution->user_id}-" . now()->timestamp;

            try {
                DB::transaction(function () use ($walletService, $wallet, $contribution, $reference, $cycle) {
                    $tx = $walletService->debit(
                        $wallet,
                        (string) $contribution->amount,
                        $reference,
                        "Monthly contribution — {$cycle->name}"
                    );

                    $contribution->update([
                        'status'                => 'paid',
                        'paid_at'               => now(),
                        'wallet_transaction_id' => $tx->id,
                    ]);
                });
            } catch (InsufficientBalanceException $e) {
                $contribution->update(['status' => 'failed']);
                Log::info("DebitMonthlyCycleContributions: Insufficient balance for contribution {$contribution->id}");
            } catch (\Throwable $e) {
                Log::error("DebitMonthlyCycleContributions: Unexpected error for contribution {$contribution->id}: {$e->getMessage()}");
            }
        }
    }
}
