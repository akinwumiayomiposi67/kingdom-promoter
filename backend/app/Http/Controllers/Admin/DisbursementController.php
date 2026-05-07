<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDisbursementRequest;
use App\Models\Disbursement;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DisbursementController extends Controller
{
    public function index(): JsonResponse
    {
        $disbursements = Disbursement::with('cycle')
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => ['disbursements' => $disbursements],
        ]);
    }

    public function store(StoreDisbursementRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('receipt')) {
            $file      = $request->file('receipt');
            $year      = now()->format('Y');
            $month     = now()->format('m');
            $ext       = $file->getClientOriginalExtension();
            $filename  = Str::uuid() . '.' . $ext;
            $directory = "receipts/{$year}/{$month}";

            Storage::disk('private')->putFileAs($directory, $file, $filename);

            $data['receipt_path'] = "{$directory}/{$filename}";
        }

        unset($data['receipt']);
        $data['created_by'] = auth()->id();

        $disbursement = Disbursement::create($data);

        return response()->json([
            'success' => true,
            'data'    => ['disbursement' => $disbursement->load('cycle')],
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $disbursement = Disbursement::with('cycle')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => ['disbursement' => $disbursement],
        ]);
    }

    public function publish(int $id): JsonResponse
    {
        $disbursement = Disbursement::findOrFail($id);

        $disbursement->update([
            'is_published' => true,
            'published_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => ['disbursement' => $disbursement->fresh('cycle')],
        ]);
    }
}
