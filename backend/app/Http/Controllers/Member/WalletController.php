<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $wallet = $request->user()->wallet;

        if (! $wallet) {
            return response()->json([
                'success' => false,
                'message' => 'Wallet not found.',
            ], 404);
        }

        $transactions = $wallet->transactions()
            ->latest('created_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => [
                'wallet' => [
                    'id'                     => $wallet->id,
                    'balance'                => $wallet->balance,
                    'paystack_customer_code' => $wallet->paystack_customer_code,
                    'virtual_account_number' => $wallet->virtual_account_number,
                    'virtual_account_bank'   => $wallet->virtual_account_bank,
                    'transactions'           => $transactions,
                ],
            ],
        ]);
    }
}
