<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InviteMemberRequest;
use App\Http\Requests\Admin\UpdateMemberStatusRequest;
use App\Mail\InvitationMail;
use App\Models\AuditLog;
use App\Models\Invitation;
use App\Models\User;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class MemberController extends Controller
{
    public function __construct(private readonly SmsService $smsService) {}

    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'member')
            ->with('wallet');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $members = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => ['members' => $members],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $member = User::where('role', 'member')
            ->with(['wallet.transactions' => fn ($q) => $q->latest()->limit(20), 'wallet'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => ['member' => $member],
        ]);
    }

    public function updateStatus(UpdateMemberStatusRequest $request, int $id): JsonResponse
    {
        $member = User::where('role', 'member')->findOrFail($id);
        $oldStatus = $member->status;

        $member->update(['status' => $request->status]);

        AuditLog::create([
            'user_id'      => auth()->id(),
            'action'       => 'member.status_changed',
            'subject_type' => User::class,
            'subject_id'   => $member->id,
            'metadata'     => [
                'from'   => $oldStatus,
                'to'     => $request->status,
                'reason' => $request->reason,
            ],
        ]);

        try {
            $message = "Kingdom Fund Circle: Your account status has been updated to {$request->status}.";
            $this->smsService->send($member->phone, $message);
        } catch (\Throwable) {
            // Silent failure — SMS is non-critical
        }

        return response()->json([
            'success' => true,
            'data'    => ['member' => $member->fresh()],
        ]);
    }

    public function invite(InviteMemberRequest $request): JsonResponse
    {
        $rawToken  = bin2hex(random_bytes(32));
        $hashedToken = hash('sha256', $rawToken);
        $expiresAt = now()->addDays(7);

        $invitation = Invitation::create([
            'token'      => $hashedToken,
            'email'      => $request->email,
            'invited_by' => auth()->id(),
            'expires_at' => $expiresAt,
        ]);

        Mail::to($request->email)
            ->queue(new InvitationMail(
                invitedBy: auth()->user(),
                email: $request->email,
                rawToken: $rawToken,
                expiresAt: $expiresAt,
            ));

        return response()->json([
            'success' => true,
            'data'    => ['message' => "Invitation sent to {$request->email}.", 'invitation_id' => $invitation->id],
        ], 201);
    }
}
