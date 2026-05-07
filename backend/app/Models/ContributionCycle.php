<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContributionCycle extends Model
{
    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'debit_day',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class);
    }
}
