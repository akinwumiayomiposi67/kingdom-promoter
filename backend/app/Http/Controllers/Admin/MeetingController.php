<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMeetingRequest;
use App\Jobs\SendMeetingNotification;
use App\Models\Meeting;
use Illuminate\Http\JsonResponse;

class MeetingController extends Controller
{
    public function index(): JsonResponse
    {
        $meetings = Meeting::withCount(['rsvps as attending_count' => function ($q) {
            $q->where('response', 'attending');
        }])
            ->latest('meeting_date')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data'    => ['meetings' => $meetings],
        ]);
    }

    public function store(StoreMeetingRequest $request): JsonResponse
    {
        $meeting = Meeting::create(array_merge(
            $request->validated(),
            ['created_by' => auth()->id()]
        ));

        dispatch(new SendMeetingNotification($meeting->id));

        return response()->json([
            'success' => true,
            'data'    => ['meeting' => $meeting],
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $meeting = Meeting::with(['rsvps.user'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'meeting'         => $meeting,
                'attending_count' => $meeting->attendingCount(),
            ],
        ]);
    }

    public function update(StoreMeetingRequest $request, int $id): JsonResponse
    {
        $meeting = Meeting::findOrFail($id);
        $meeting->update($request->validated());

        return response()->json([
            'success' => true,
            'data'    => ['meeting' => $meeting->fresh()],
        ]);
    }
}
