<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Disbursement;
use Illuminate\Http\JsonResponse;

class DisbursementController extends Controller
{
    public function index(): JsonResponse
    {
        $disbursements = Disbursement::published()
            ->with('cycle')
            ->select(['id', 'contribution_cycle_id', 'title', 'amount', 'description', 'is_published', 'published_at'])
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data'    => ['disbursements' => $disbursements],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $disbursement = Disbursement::published()
            ->with('cycle')
            ->select(['id', 'contribution_cycle_id', 'title', 'amount', 'description', 'is_published', 'published_at'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => ['disbursement' => $disbursement],
        ]);
    }
}
