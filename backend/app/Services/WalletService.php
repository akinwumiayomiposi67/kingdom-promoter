<?php

namespace App\Services;

use App\Exceptions\InsufficientBalanceException;
use App\Jobs\NotifyWalletCredited;
use App\Models\AuditLog;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;

class WalletService
{
    public function credit(
        Wallet $wallet,
        float $amount,
        string $reference,
        string $description = '',
        array $metadata = []
    ): WalletTransaction {
        return DB::transaction(function () use ($wallet, $amount, $reference, $description, $metadata) {
            // Re-fetch with a row lock to prevent race conditions
            $wallet = Wallet::lockForUpdate()->findOrFail($wallet->id);
            $wallet->increment('balance', $amount);

            $transaction = WalletTransaction::create([
                'wallet_id'   => $wallet->id,
                'type'        => 'credit',
                'amount'      => $amount,
                'description' => $description,
                'reference'   => $reference,
                'metadata'    => $metadata ?: null,
            ]);

            dispatch(new NotifyWalletCredited($wallet->user_id, $amount));

            return $transaction;
        });
    }

    public function debit(
        Wallet $wallet,
        float $amount,
        string $reference,
        string $description = '',
        array $metadata = []
    ): WalletTransaction {
        return DB::transaction(function () use ($wallet, $amount, $reference, $description, $metadata) {
            // Re-fetch with a row lock to prevent race conditions
            $wallet = Wallet::lockForUpdate()->findOrFail($wallet->id);

            if ($wallet->balance < $amount) {
                throw new InsufficientBalanceException(
                    "Insufficient balance. Available: {$wallet->balance}, Required: {$amount}"
                );
            }

            $wallet->decrement('balance', $amount);

            $transaction = WalletTransaction::create([
                'wallet_id'   => $wallet->id,
                'type'        => 'debit',
                'amount'      => $amount,
                'description' => $description,
                'reference'   => $reference,
                'metadata'    => $metadata ?: null,
            ]);

            AuditLog::create([
                'user_id'      => $wallet->user_id,
                'action'       => 'wallet.debit',
                'subject_type' => WalletTransaction::class,
                'subject_id'   => $transaction->id,
                'metadata'     => [
                    'amount'    => $amount,
                    'reference' => $reference,
                ],
            ]);

            return $transaction;
        });
    }
}
