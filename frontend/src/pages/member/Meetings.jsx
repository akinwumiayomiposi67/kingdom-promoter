import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getMeetings, rsvpMeeting } from '../../api/meetings';

export default function Meetings() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['member-meetings'],
    queryFn: () => getMeetings().then((r) => r.data.data.meetings),
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ id, response }) => rsvpMeeting(id, { response }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['member-meetings'] }),
  });

  const meetings = data ?? [];
  const upcoming = meetings.filter((m) => m.is_upcoming);
  const past = meetings.filter((m) => !m.is_upcoming);

  const handleRsvp = (id, response) => rsvpMutation.mutate({ id, response });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a3c6e' }}>
          Meetings
        </h1>
        <p className="text-gray-500 text-sm mb-6">All scheduled and past meetings</p>

        {isLoading && <p className="text-gray-400 text-center py-12">Loading…</p>}
        {error && <p className="text-red-500 text-center py-6">Failed to load meetings.</p>}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Upcoming
            </h2>
            <div className="space-y-4">
              {upcoming.map((m) => (
                <MeetingCard
                  key={m.id}
                  meeting={m}
                  onRsvp={handleRsvp}
                  pending={rsvpMutation.isPending && rsvpMutation.variables?.id === m.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Past
            </h2>
            <div className="space-y-4 opacity-70">
              {past.map((m) => (
                <MeetingCard key={m.id} meeting={m} past />
              ))}
            </div>
          </section>
        )}

        {!isLoading && meetings.length === 0 && (
          <p className="text-center text-gray-400 py-16">No meetings scheduled yet.</p>
        )}
      </div>
    </div>
  );
}

function MeetingCard({ meeting, onRsvp, pending, past }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 ${past ? 'border-gray-100' : 'border-blue-100'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-base">{meeting.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {format(new Date(meeting.meeting_date), 'EEE, MMM d yyyy • h:mm a')}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {meeting.is_online ? (
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                Online
                {meeting.meeting_link && (
                  <>
                    {' — '}
                    <a
                      href={meeting.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Join link
                    </a>
                  </>
                )}
              </span>
            ) : (
              meeting.location || 'Location TBD'
            )}
          </p>
          {meeting.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{meeting.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {meeting.attending_count ?? 0} attending
          </p>
        </div>

        {!past && (
          <RsvpButtons
            current={meeting.user_rsvp}
            onRsvp={(response) => onRsvp(meeting.id, response)}
            pending={pending}
          />
        )}
      </div>
    </div>
  );
}

function RsvpButtons({ current, onRsvp, pending }) {
  return (
    <div className="flex flex-col gap-2 shrink-0">
      <button
        onClick={() => onRsvp('attending')}
        disabled={pending}
        className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
          current === 'attending'
            ? 'bg-green-600 text-white border-green-600'
            : 'border-green-600 text-green-700 hover:bg-green-50'
        }`}
      >
        Attending
      </button>
      <button
        onClick={() => onRsvp('not_attending')}
        disabled={pending}
        className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
          current === 'not_attending'
            ? 'bg-gray-500 text-white border-gray-500'
            : 'border-gray-400 text-gray-600 hover:bg-gray-50'
        }`}
      >
        Can't attend
      </button>
    </div>
  );
}
