<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Disbursement extends Model
{
    protected $fillable = [
        'contribution_cycle_id',
        'title',
        'amount',
        'description',
        'receipt_path',
        'is_published',
        'published_at',
        'created_by',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true)->orderByDesc('published_at');
    }

    public function isPublished(): bool
    {
        return $this->is_published;
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(ContributionCycle::class, 'contribution_cycle_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
