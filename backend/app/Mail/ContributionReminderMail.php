<?php

namespace App\Mail;

use App\Models\Contribution;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\InteractsWithQueue;

class ContributionReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, InteractsWithQueue;

    public function __construct(
        public readonly User $user,
        public readonly Contribution $contribution
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'KFC Contribution Reminder — ' . $this->contribution->cycle?->name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contribution-reminder',
        );
    }
}
