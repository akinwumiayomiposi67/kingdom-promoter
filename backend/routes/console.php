<?php

use App\Jobs\DebitMonthlyContributions;
use App\Jobs\SendContributionReminder;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new DebitMonthlyContributions)->dailyAt('01:00');
Schedule::job(new SendContributionReminder(3))->dailyAt('09:00');
Schedule::job(new SendContributionReminder(7))->dailyAt('09:00');
