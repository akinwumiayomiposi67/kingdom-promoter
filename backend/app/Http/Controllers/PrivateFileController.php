<?php

namespace App\Http\Controllers;

use App\Models\Disbursement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class PrivateFileController extends Controller
{
    /**
     * Return a signed temporary URL for downloading a disbursement receipt.
     * Requires the caller to be an admin or an active member.
     */
    public function receipt(int $id): JsonResponse
    {
        $disbursement = Disbursement::findOrFail($id);

        if (! $disbursement->receipt_path) {
            return response()->json([
                'success' => false,
                'message' => 'No receipt available for this disbursement.',
            ], 404);
        }

        $user = request()->user();
        $canAccess = $user->isAdmin() || ($user->isMember() && $user->isActive());

        if (! $canAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $signedUrl = URL::signedRoute(
            'receipts.download',
            ['disbursement' => $id],
            now()->addMinutes(15)
        );

        return response()->json([
            'success' => true,
            'data'    => ['url' => $signedUrl],
        ]);
    }

    /**
     * Stream the receipt file from private storage.
     * Route is signature-verified (no auth needed — signature acts as the token).
     */
    public function download(Request $request, int $disbursement): Response
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'Invalid or expired link.');
        }

        $record = Disbursement::findOrFail($disbursement);

        if (! $record->receipt_path) {
            abort(404, 'No receipt on file.');
        }

        $disk = Storage::disk('private');

        if (! $disk->exists($record->receipt_path)) {
            abort(404, 'Receipt file not found.');
        }

        $contents    = $disk->get($record->receipt_path);
        $mimeType    = $disk->mimeType($record->receipt_path);
        $filename    = basename($record->receipt_path);

        return response($contents, 200, [
            'Content-Type'        => $mimeType ?: 'application/octet-stream',
            'Content-Disposition' => "inline; filename=\"{$filename}\"",
        ]);
    }
}
