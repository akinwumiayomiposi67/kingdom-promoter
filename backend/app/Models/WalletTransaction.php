<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    // Append-only ledger — no updated_at column
    const UPDATED_AT = null;

    public $timestamps = false;

    protected $fillable = [
        'wallet_id',
        'type',
        'amount',
        'description',
        'reference',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'amount'     => 'decimal:2',
        'metadata'   => 'array',
        'created_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $model) {
            $model->created_at = now();
        });
    }

    /**
     * Prevent updating existing records — wallet ledger is append-only.
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new \RuntimeException('WalletTransaction records are immutable and cannot be updated.');
        }

        return parent::save($options);
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }
}
