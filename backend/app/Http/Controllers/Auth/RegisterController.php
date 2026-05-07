<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Wallet;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RegisterController extends Controller
{
    public function __construct(private readonly PaystackService $paystackService) {}

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

            $this->createWalletForUser($user);

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

    private function createWalletForUser(User $user): void
    {
        $customerCode  = null;
        $accountNumber = null;
        $bankName      = null;

        try {
            $customer     = $this->paystackService->createCustomer($user);
            $customerCode = $customer['customer_code'] ?? null;

            if ($customerCode) {
                $account       = $this->paystackService->createDedicatedVirtualAccount($customerCode);
                $accountNumber = $account['account_number'] ?? null;
                $bankName      = $account['bank']['name'] ?? null;
            }
        } catch (\Throwable $e) {
            Log::warning("Paystack wallet setup failed for user {$user->id}: {$e->getMessage()}");
        }

        Wallet::create([
            'user_id'                => $user->id,
            'paystack_customer_code' => $customerCode,
            'virtual_account_number' => $accountNumber,
            'virtual_account_bank'   => $bankName,
            'balance'                => 0,
        ]);
    }
}
