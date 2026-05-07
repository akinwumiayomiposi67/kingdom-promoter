<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ValidateInvitationRequest;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;

class InvitationController extends Controller
{
    public function validate(ValidateInvitationRequest $request): JsonResponse
    {
        $hashedToken = hash('sha256', $request->token);

        $invitation = Invitation::where('token', $hashedToken)->first();

        if (! $invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid invitation token.',
            ], 404);
        }

        if ($invitation->used_at !== null) {
            return response()->json([
                'success' => false,
                'message' => 'This invitation has already been used.',
            ], 422);
        }

        if ($invitation->expires_at->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'This invitation has expired.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'name'  => $invitation->name,
                'email' => $invitation->email,
            ],
        ]);
    }
}
