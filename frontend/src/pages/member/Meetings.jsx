import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, Video, MapPin, Users } from "lucide-react";
import { getMeetings, rsvpMeeting } from "../../api/meetings";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";

function MeetingCard({ meeting, onRsvp, pending, past }) {
  return (
    <div className={`card p-5 ${past ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 text-base">
            {meeting.title}
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            {format(new Date(meeting.meeting_date), "EEE, MMM d yyyy • h:mm a")}
          </p>
          <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1">
            {meeting.is_online ? (
              <>
                <Video size={13} className="text-emerald-500" /> Online
                {meeting.meeting_link && (
                  <>
                    {" "}
                    —{" "}
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
              </>
            ) : (
              <>
                <MapPin size={13} className="text-slate-400" />{" "}
                {meeting.location || "Location TBD"}
              </>
            )}
          </p>
          {meeting.description && (
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
              {meeting.description}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Users size={11} /> {meeting.attending_count ?? 0} attending
          </p>
        </div>
        {!past && (
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => onRsvp(meeting.id, "attending")}
              disabled={pending}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                meeting.user_rsvp === "attending"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              Attending
            </button>
            <button
              onClick={() => onRsvp(meeting.id, "not_attending")}
              disabled={pending}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                meeting.user_rsvp === "not_attending"
                  ? "bg-slate-500 text-white border-slate-500"
                  : "border-slate-400 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Can't attend
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Meetings() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["member-meetings"],
    queryFn: () => getMeetings().then((r) => r.data.data.meetings),
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ id, response }) => rsvpMeeting(id, { response }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["member-meetings"] }),
  });

  const meetings = data ?? [];
  const upcoming = meetings.filter((m) => m.is_upcoming);
  const past = meetings.filter((m) => !m.is_upcoming);

  const handleRsvp = (id, response) => rsvpMutation.mutate({ id, response });

  if (isLoading)
    return (
      <div className="page-content">
        <Skeleton rows={6} />
      </div>
    );
  if (error)
    return (
      <div className="page-content">
        <p className="text-red-500 text-sm">Failed to load meetings.</p>
      </div>
    );

  return (
    <div className="page-content">
      <PageHeader title="Meetings" description="Upcoming and past meetings" />

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CalendarDays}
            title="No meetings yet"
            description="There are no meetings scheduled at the moment."
          />
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Upcoming
              </h2>
              <div className="space-y-3">
                {upcoming.map((m) => (
                  <MeetingCard
                    key={m.id}
                    meeting={m}
                    onRsvp={handleRsvp}
                    pending={rsvpMutation.isPending}
                    past={false}
                  />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Past
              </h2>
              <div className="space-y-3">
                {past.map((m) => (
                  <MeetingCard
                    key={m.id}
                    meeting={m}
                    onRsvp={handleRsvp}
                    pending={false}
                    past={true}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
