<?php

namespace App\Jobs;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessPaystackWebhook implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly array $payload) {}

    public function handle(WalletService $walletService): void
    {
        if (($this->payload['event'] ?? '') !== 'charge.success') {
            return;
        }

        $data = $this->payload['data'] ?? [];

        $accountNumber = $data['authorization']['receiver_bank_account_number'] ?? null;

        if (! $accountNumber) {
            return;
        }

        $wallet = Wallet::where('virtual_account_number', $accountNumber)->first();

        if (! $wallet) {
            return;
        }

        $reference = $data['reference'] ?? null;

        if (! $reference || WalletTransaction::where('reference', $reference)->exists()) {
            return;
        }

        $amount = bcdiv((string) ($data['amount'] ?? 0), '100', 2);

        $walletService->credit($wallet, $amount, $reference, 'Paystack deposit');
    }
}
