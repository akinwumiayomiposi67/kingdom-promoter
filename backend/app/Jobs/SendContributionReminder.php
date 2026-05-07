<?php

namespace App\Jobs;

use App\Mail\ContributionReminderMail;
use App\Models\Contribution;
use App\Models\ContributionCycle;
use App\Services\SmsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendContributionReminder implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $daysUntilDebit) {}

    public function handle(SmsService $smsService): void
    {
        $targetDay = now()->addDays($this->daysUntilDebit)->day;

        $cycles = ContributionCycle::active()
            ->where('debit_day', $targetDay)
            ->get();

        if ($cycles->isEmpty()) {
            return;
        }

        foreach ($cycles as $cycle) {
            $contributions = Contribution::with(['user', 'package'])
                ->where('contribution_cycle_id', $cycle->id)
                ->where('status', 'pending')
                ->get();

            foreach ($contributions as $contribution) {
                $user = $contribution->user;

                if (! $user) {
                    continue;
                }

                try {
                    if ($user->phone) {
                        $message = "Dear {$user->name}, your KFC contribution of ₦"
                            . number_format($contribution->amount, 2)
                            . " for {$cycle->name} is due in {$this->daysUntilDebit} day(s). Please fund your wallet.";

                        $smsService->send($user->phone, $message);
                    }
                } catch (\Throwable $e) {
                    Log::warning("SendContributionReminder: SMS failed for user {$user->id}: {$e->getMessage()}");
                }

                try {
                    Mail::to($user->email)
                        ->queue(new ContributionReminderMail($user, $contribution));
                } catch (\Throwable $e) {
                    Log::warning("SendContributionReminder: Email failed for user {$user->id}: {$e->getMessage()}");
                }
            }
        }
    }
}
