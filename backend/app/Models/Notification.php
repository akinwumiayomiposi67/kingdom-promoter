<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    public $timestamps = false;

    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'body',
        'data',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at'    => 'datetime',
            'data'       => 'array',
            'created_at' => 'datetime',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(fn (self $model) => $model->created_at = now());
    }

    public function scopeUnread(Builder $query): Builder
    {
        return $query->whereNull('read_at');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
