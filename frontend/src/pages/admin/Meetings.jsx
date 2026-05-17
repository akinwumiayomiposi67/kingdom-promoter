import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, Video, MapPin, Users } from "lucide-react";
import {
  getAdminMeetings,
  createMeeting,
  updateMeeting,
} from "../../api/meetings";
import PageHeader from "../../components/ui/PageHeader";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";

const meetingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  meeting_date: z.string().min(1, "Date is required"),
  location: z.string().max(300).optional(),
  is_online: z.boolean().optional(),
  meeting_link: z
    .string()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .optional(),
});

function MeetingForm({ meeting, onClose, onSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: zodResolver(meetingSchema),
    defaultValues: meeting
      ? {
          title: meeting.title,
          description: meeting.description ?? "",
          meeting_date: meeting.meeting_date?.slice(0, 16) ?? "",
          location: meeting.location ?? "",
          is_online: meeting.is_online ?? false,
          meeting_link: meeting.meeting_link ?? "",
        }
      : {
          title: "",
          description: "",
          meeting_date: "",
          location: "",
          is_online: false,
          meeting_link: "",
        },
  });
  const [serverError, setServerError] = useState("");
  const isOnline = watch("is_online");

  const onSubmit = async (data) => {
    setServerError("");
    try {
      if (meeting) await updateMeeting(meeting.id, data);
      else await createMeeting(data);
      onSuccess();
    } catch (err) {
      setServerError(err?.response?.data?.message ?? "Failed to save meeting.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && <p className="error-text">{serverError}</p>}
      <div>
        <label className="form-label">Title</label>
        <input {...register("title")} className="input-field" />
        {errors.title && <p className="error-text">{errors.title.message}</p>}
      </div>
      <div>
        <label className="form-label">Date &amp; Time</label>
        <input
          type="datetime-local"
          {...register("meeting_date")}
          className="input-field"
        />
        {errors.meeting_date && (
          <p className="error-text">{errors.meeting_date.message}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_online"
          {...register("is_online")}
          className="rounded"
        />
        <label htmlFor="is_online" className="form-label mb-0">
          Online meeting
        </label>
      </div>
      {isOnline ? (
        <div>
          <label className="form-label">Meeting Link</label>
          <input
            type="url"
            {...register("meeting_link")}
            className="input-field"
            placeholder="https://…"
          />
          {errors.meeting_link && (
            <p className="error-text">{errors.meeting_link.message}</p>
          )}
        </div>
      ) : (
        <div>
          <label className="form-label">Location</label>
          <input {...register("location")} className="input-field" />
        </div>
      )}
      <div>
        <label className="form-label">Description (optional)</label>
        <textarea
          rows={3}
          {...register("description")}
          className="input-field resize-none"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onClose} className="btn-outline">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting
            ? "Saving…"
            : meeting
              ? "Save Changes"
              : "Create Meeting"}
        </button>
      </div>
    </form>
  );
}

export default function AdminMeetings() {
  const [showModal, setShowModal] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-meetings"],
    queryFn: () => getAdminMeetings().then((r) => r.data.data.meetings),
  });

  const meetings = data?.data ?? [];

  const openCreate = () => {
    setEditMeeting(null);
    setShowModal(true);
  };
  const openEdit = (m) => {
    setEditMeeting(m);
    setShowModal(true);
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Meetings"
        description="Manage scheduled meetings"
        action={
          <button onClick={openCreate} className="btn-primary btn-sm gap-1">
            <Plus size={14} /> Create Meeting
          </button>
        }
      />

      {isError && (
        <p className="text-red-500 text-sm">Failed to load meetings.</p>
      )}

      {isLoading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : meetings.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Calendar}
            title="No meetings yet"
            description="Create a meeting to get started."
            action={
              <button onClick={openCreate} className="btn-primary btn-sm">
                Create Meeting
              </button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th className="text-right">Attending</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium text-slate-900">{m.title}</td>
                    <td className="text-slate-500 text-sm">
                      {format(new Date(m.meeting_date), "MMM d, yyyy HH:mm")}
                    </td>
                    <td>
                      {m.is_online ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-sm">
                          <Video size={13} /> Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-sm">
                          <MapPin size={13} /> {m.location || "—"}
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <span className="inline-flex items-center gap-1 text-slate-600 text-sm">
                        <Users size={13} /> {m.attending_count ?? 0}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openEdit(m)}
                        className="btn-outline btn-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editMeeting ? "Edit Meeting" : "Create Meeting"}
      >
        <MeetingForm
          meeting={editMeeting}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ["admin-meetings"] });
          }}
        />
      </Modal>
    </div>
  );
}
