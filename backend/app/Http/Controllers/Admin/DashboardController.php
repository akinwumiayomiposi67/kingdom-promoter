<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContributionCycle;
use App\Models\Disbursement;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalMembers = User::where('role', 'member')
            ->where('status', 'active')
            ->count();

        $totalWalletBalance = Wallet::sum('balance');

        $activeCycle = ContributionCycle::active()->latest()->first();

        $paidCount    = 0;
        $pendingCount = 0;

        if ($activeCycle) {
            $paidCount = $activeCycle->contributions()
                ->where('status', 'paid')
                ->count();

            $pendingCount = $activeCycle->contributions()
                ->where('status', 'pending')
                ->count();
        }

        $failedJobsCount = DB::table('failed_jobs')->count();

        $latestDisbursement = Disbursement::published()->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'total_members'                        => $totalMembers,
                'total_wallet_balance'                  => number_format((float) $totalWalletBalance, 2, '.', ''),
                'current_cycle_contributions_paid'      => $paidCount,
                'current_cycle_contributions_pending'   => $pendingCount,
                'failed_jobs_count'                     => $failedJobsCount,
                'latest_disbursement'                   => $latestDisbursement?->load('cycle'),
                'active_cycle'                          => $activeCycle,
            ],
        ]);
    }
}
