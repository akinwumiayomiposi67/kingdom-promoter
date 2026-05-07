<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RegisterController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $hashedToken = hash('sha256', $request->token);

        $invitation = Invitation::where('token', $hashedToken)->valid()->first();

        if (! $invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired invitation token.',
            ], 422);
        }

        if ($invitation->email !== $request->email) {
            return response()->json([
                'success' => false,
                'message' => 'Email address does not match the invitation.',
            ], 422);
        }

        $user = DB::transaction(function () use ($request, $invitation) {
            $user = User::create([
                'name'     => $request->name,
                'email'    => $request->email,
                'phone'    => $request->phone,
                'password' => $request->password,
                'role'     => 'member',
                'status'   => 'active',
            ]);

            $invitation->update(['used_at' => now()]);

            return $user;
        });

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data'    => [
                'token' => $token,
                'user'  => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role'  => $user->role,
                ],
            ],
        ], 201);
    }
}
