<?php

namespace App\Jobs;

use App\Mail\MeetingCreatedMail;
use App\Models\Meeting;
use App\Models\Notification;
use App\Models\User;
use App\Services\FcmService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendMeetingNotification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $meetingId) {}

    public function handle(FcmService $fcmService): void
    {
        $meeting = Meeting::find($this->meetingId);

        if (! $meeting) {
            return;
        }

        $users = User::where('status', 'active')->get();

        foreach ($users as $user) {
            try {
                Notification::create([
                    'user_id' => $user->id,
                    'type'    => 'meeting.created',
                    'title'   => 'New Meeting Scheduled',
                    'body'    => "A new meeting has been scheduled: {$meeting->title} on " . $meeting->meeting_date->format('M d, Y \a\t H:i'),
                    'data'    => ['meeting_id' => $meeting->id],
                ]);

                $fcmService->send(
                    $user,
                    'New Meeting Scheduled',
                    "{$meeting->title} — " . $meeting->meeting_date->format('M d, Y'),
                    ['meeting_id' => (string) $meeting->id, 'type' => 'meeting.created']
                );

                Mail::to($user->email)->queue(new MeetingCreatedMail($meeting, $user));
            } catch (\Throwable $e) {
                Log::warning("SendMeetingNotification: failed to notify user {$user->id}: {$e->getMessage()}");
            }
        }
    }
}
