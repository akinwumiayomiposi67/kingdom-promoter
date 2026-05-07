<?php

namespace App\Jobs;

use App\Mail\DisbursementPublishedMail;
use App\Models\Disbursement;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendDisbursementNotification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $disbursementId) {}

    public function handle(): void
    {
        $disbursement = Disbursement::with('cycle')->find($this->disbursementId);

        if (! $disbursement) {
            return;
        }

        $users = User::where('status', 'active')->get();

        foreach ($users as $user) {
            try {
                Notification::create([
                    'user_id' => $user->id,
                    'type'    => 'disbursement.published',
                    'title'   => 'New Disbursement',
                    'body'    => 'A new disbursement has been published: ' . $disbursement->title,
                    'data'    => ['disbursement_id' => $disbursement->id],
                ]);

                Mail::to($user->email)->queue(new DisbursementPublishedMail($disbursement, $user));
            } catch (\Throwable $e) {
                Log::warning("DisbursementNotification: failed to notify user {$user->id}: {$e->getMessage()}");
            }
        }
    }
}
