<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateCycleRequest;
use App\Models\ContributionCycle;
use Illuminate\Http\JsonResponse;

class ContributionCycleController extends Controller
{
    public function index(): JsonResponse
    {
        $cycles = ContributionCycle::latest()->get();

        return response()->json([
            'success' => true,
            'data'    => ['cycles' => $cycles],
        ]);
    }

    public function store(CreateCycleRequest $request): JsonResponse
    {
        $cycle = ContributionCycle::create($request->validated());

        return response()->json([
            'success' => true,
            'data'    => ['cycle' => $cycle],
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $cycle = ContributionCycle::with([
            'contributions.user:id,name',
            'contributions.package',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => ['cycle' => $cycle],
        ]);
    }

    public function close(int $id): JsonResponse
    {
        $cycle = ContributionCycle::findOrFail($id);
        $cycle->update(['status' => 'completed']);

        return response()->json([
            'success' => true,
            'data'    => ['cycle' => $cycle],
        ]);
    }
}
