<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ManualDebitRequest;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class WalletController extends Controller
{
    public function __construct(private readonly WalletService $walletService) {}

    public function index(): JsonResponse
    {
        $members = User::where('role', 'member')
            ->with('wallet')
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => ['members' => $members],
        ]);
    }

    public function show(int $userId): JsonResponse
    {
        $user = User::where('role', 'member')
            ->with(['wallet.transactions' => fn ($q) => $q->latest()->paginate(20)])
            ->findOrFail($userId);

        return response()->json([
            'success' => true,
            'data'    => ['member' => $user],
        ]);
    }

    public function manualDebit(ManualDebitRequest $request, int $userId): JsonResponse
    {
        $user   = User::where('role', 'member')->with('wallet')->findOrFail($userId);
        $wallet = $user->wallet;

        if (! $wallet) {
            return response()->json([
                'success' => false,
                'message' => 'This member does not have a wallet.',
            ], 422);
        }

        $reference   = 'ADMIN-DEBIT-' . strtoupper(Str::random(12));
        $transaction = $this->walletService->debit(
            wallet:      $wallet,
            amount:      (string) $request->amount,
            reference:   $reference,
            description: $request->reason,
            metadata:    ['initiated_by' => auth()->id()],
        );

        AuditLog::create([
            'user_id'      => auth()->id(),
            'action'       => 'admin.manual_debit',
            'subject_type' => WalletTransaction::class,
            'subject_id'   => $transaction->id,
            'metadata'     => [
                'member_id' => $userId,
                'amount'    => $request->amount,
                'reason'    => $request->reason,
                'reference' => $reference,
            ],
        ]);

        return response()->json([
            'success' => true,
            'data'    => ['transaction' => $transaction],
        ]);
    }
}
