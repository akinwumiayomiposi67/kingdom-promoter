<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meeting extends Model
{
    protected $fillable = [
        'title',
        'description',
        'meeting_date',
        'location',
        'is_online',
        'meeting_link',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'meeting_date' => 'datetime',
            'is_online'    => 'boolean',
        ];
    }

    public function attendingCount(): int
    {
        return $this->rsvps()->where('response', 'attending')->count();
    }

    public function isUpcoming(): bool
    {
        return $this->meeting_date->isFuture();
    }

    public function rsvps(): HasMany
    {
        return $this->hasMany(MeetingRsvp::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
