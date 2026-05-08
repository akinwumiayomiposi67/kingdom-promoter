<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Http\Requests\Member\SetPackageRequest;
use App\Models\Contribution;
use App\Models\ContributionCycle;
use App\Models\ContributionPackage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContributionController extends Controller
{
    public function setPackage(SetPackageRequest $request): JsonResponse
    {
        $cycle = ContributionCycle::active()->latest()->first();

        if (! $cycle) {
            return response()->json([
                'success' => false,
                'message' => 'No active contribution cycle found.',
            ], 422);
        }

        $package = ContributionPackage::active()->find($request->contribution_package_id);

        if (! $package) {
            return response()->json([
                'success' => false,
                'message' => 'The selected package is not active.',
            ], 422);
        }

        $contribution = Contribution::updateOrCreate(
            [
                'user_id'              => $request->user()->id,
                'contribution_cycle_id' => $cycle->id,
            ],
            [
                'contribution_package_id' => $package->id,
                'amount'                  => $package->amount,
                'status'                  => 'pending',
            ]
        );

        $contribution->load(['cycle', 'package']);

        return response()->json([
            'success' => true,
            'data'    => ['contribution' => $contribution],
        ]);
    }

    public function myContributions(Request $request): JsonResponse
    {
        $contributions = Contribution::with(['cycle', 'package'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $contributions,
        ]);
    }

    public function groupContributions(Request $request): JsonResponse
    {
        $cycle = ContributionCycle::active()->latest()->first();

        if (! $cycle) {
            return response()->json([
                'success' => true,
                'data'    => ['cycle' => null, 'contributions' => []],
            ]);
        }

        $contributions = Contribution::with(['package'])
            ->join('users', 'contributions.user_id', '=', 'users.id')
            ->select('contributions.*', 'users.name as member_name')
            ->where('contributions.contribution_cycle_id', $cycle->id)
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => [
                'cycle'         => $cycle,
                'contributions' => $contributions,
            ],
        ]);
    }
}
