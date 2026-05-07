<?php

namespace App\Mail;

use App\Models\Meeting;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\InteractsWithQueue;

class MeetingCreatedMail extends Mailable implements ShouldQueue
{
    use Queueable, InteractsWithQueue;

    public function __construct(
        public readonly Meeting $meeting,
        public readonly User $user
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'KFC Meeting — ' . $this->meeting->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.meeting-created',
        );
    }
}
