<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContributionPackage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PackageController extends Controller
{
    public function index(): JsonResponse
    {
        $packages = ContributionPackage::latest()->get();

        return response()->json([
            'success' => true,
            'data'    => ['packages' => $packages],
        ]);
    }

    public function activePackages(): JsonResponse
    {
        $packages = ContributionPackage::active()->latest()->get();

        return response()->json([
            'success' => true,
            'data'    => ['packages' => $packages],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:100', 'unique:contribution_packages,name'],
            'amount'      => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
        ]);

        $package = ContributionPackage::create($validated);

        return response()->json([
            'success' => true,
            'data'    => ['package' => $package],
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $package = ContributionPackage::findOrFail($id);

        $validated = $request->validate([
            'name'        => ['sometimes', 'string', 'max:100', Rule::unique('contribution_packages', 'name')->ignore($id)],
            'amount'      => ['sometimes', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
        ]);

        $package->update($validated);

        return response()->json([
            'success' => true,
            'data'    => ['package' => $package],
        ]);
    }

    public function toggleActive(int $id): JsonResponse
    {
        $package = ContributionPackage::findOrFail($id);
        $package->update(['is_active' => ! $package->is_active]);

        return response()->json([
            'success' => true,
            'data'    => ['package' => $package],
        ]);
    }
}
