<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->latest('created_at')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => ['notifications' => $notifications],
        ]);
    }

    public function unreadCount(): JsonResponse
    {
        $count = Notification::where('user_id', auth()->id())
            ->unread()
            ->count();

        return response()->json([
            'success' => true,
            'data'    => ['count' => $count],
        ]);
    }

    public function markRead(int $id): JsonResponse
    {
        $notification = Notification::where('user_id', auth()->id())
            ->findOrFail($id);

        if (! $notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json([
            'success' => true,
            'data'    => ['notification' => $notification->fresh()],
        ]);
    }

    public function markAllRead(): JsonResponse
    {
        Notification::where('user_id', auth()->id())
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['success' => true, 'data' => []]);
    }

    public function registerFcmToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fcm_token' => ['required', 'string'],
        ]);

        auth()->user()->update(['fcm_token' => $validated['fcm_token']]);

        return response()->json(['success' => true, 'data' => []]);
    }
}
