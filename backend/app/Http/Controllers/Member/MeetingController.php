<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Http\Requests\Member\RsvpRequest;
use App\Models\Meeting;
use App\Models\MeetingRsvp;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class MeetingController extends Controller
{
    public function index(): JsonResponse
    {
        $userId = auth()->id();

        $meetings = Meeting::with(['rsvps' => function ($q) use ($userId) {
            $q->where('user_id', $userId);
        }])
            ->withCount(['rsvps as attending_count' => function ($q) {
                $q->where('response', 'attending');
            }])
            ->orderByDesc('meeting_date')
            ->limit(20)
            ->get()
            ->map(function ($meeting) {
                $rsvp                    = $meeting->rsvps->first();
                $meeting->user_rsvp      = $rsvp?->response;
                $meeting->is_upcoming    = $meeting->isUpcoming();
                unset($meeting->rsvps);

                return $meeting;
            });

        return response()->json([
            'success' => true,
            'data'    => ['meetings' => $meetings],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $userId  = auth()->id();
        $meeting = Meeting::with(['rsvps' => function ($q) use ($userId) {
            $q->where('user_id', $userId);
        }])->findOrFail($id);

        $rsvp = $meeting->rsvps->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'meeting'         => $meeting,
                'attending_count' => $meeting->attendingCount(),
                'user_rsvp'       => $rsvp?->response,
                'is_upcoming'     => $meeting->isUpcoming(),
            ],
        ]);
    }

    public function rsvp(RsvpRequest $request, int $id): JsonResponse
    {
        $userId = auth()->id();

        Meeting::findOrFail($id);

        $rsvp = MeetingRsvp::updateOrCreate(
            ['meeting_id' => $id, 'user_id' => $userId],
            ['response'   => $request->validated()['response']]
        );

        return response()->json([
            'success' => true,
            'data'    => ['rsvp' => $rsvp],
        ]);
    }
}
