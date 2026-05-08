<?php

namespace App\Jobs;

use App\Models\Meeting;
use App\Models\User;
use App\Services\FcmService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SendMeetingReminders implements ShouldQueue
{
    use Queueable;

    public function handle(FcmService $fcmService): void
    {
        $tomorrowStart = now()->addDay()->startOfDay();
        $tomorrowEnd   = now()->addDay()->endOfDay();

        $meetings = Meeting::whereBetween('meeting_date', [$tomorrowStart, $tomorrowEnd])->get();

        if ($meetings->isEmpty()) {
            return;
        }

        $users = User::where('status', 'active')->get();

        foreach ($meetings as $meeting) {
            foreach ($users as $user) {
                try {
                    $fcmService->send(
                        $user,
                        'Meeting Reminder',
                        "Reminder: {$meeting->title} is tomorrow at " . $meeting->meeting_date->format('H:i'),
                        ['meeting_id' => (string) $meeting->id, 'type' => 'meeting.reminder']
                    );
                } catch (\Throwable $e) {
                    Log::warning("SendMeetingReminders: failed to remind user {$user->id} for meeting {$meeting->id}: {$e->getMessage()}");
                }
            }
        }
    }
}
