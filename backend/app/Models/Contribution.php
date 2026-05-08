<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contribution extends Model
{
    protected $fillable = [
        'user_id',
        'contribution_cycle_id',
        'contribution_package_id',
        'amount',
        'status',
        'paid_at',
        'wallet_transaction_id',
    ];

    protected $casts = [
        'amount'  => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(ContributionCycle::class, 'contribution_cycle_id');
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(ContributionPackage::class, 'contribution_package_id');
    }

    public function walletTransaction(): BelongsTo
    {
        return $this->belongsTo(WalletTransaction::class);
    }
}
