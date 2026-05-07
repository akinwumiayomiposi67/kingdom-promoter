import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAdminMeetings, createMeeting, updateMeeting } from '../../api/meetings';

const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  meeting_date: z.string().min(1, 'Date is required'),
  location: z.string().max(300).optional(),
  is_online: z.boolean().optional(),
  meeting_link: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});

export default function AdminMeetings() {
  const [showModal, setShowModal] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-meetings'],
    queryFn: () => getAdminMeetings().then((r) => r.data.data.meetings),
  });

  const meetings = data?.data ?? [];
  const lastPage = data?.last_page ?? 1;

  const openCreate = () => {
    setEditMeeting(null);
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditMeeting(m);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1a3c6e' }}>
              Meetings
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage scheduled meetings</p>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-2 rounded-lg text-white font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1a3c6e' }}
          >
            + Create Meeting
          </button>
        </div>

        {isLoading && <p className="text-center text-gray-400 py-12">Loading…</p>}
        {error && <p className="text-red-500 text-center py-6">Failed to load meetings.</p>}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Title</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Location</th>
                <th className="px-5 py-3 text-right">Attending</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {meetings.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{m.title}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {format(new Date(m.meeting_date), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {m.is_online ? (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Online
                      </span>
                    ) : (
                      m.location || '—'
                    )}
                  </td>
                  <td className="px-5 py-4 text-right text-gray-600">
                    {m.attending_count ?? 0}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => openEdit(m)}
                      className="text-xs font-semibold underline"
                      style={{ color: '#1a3c6e' }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isLoading && meetings.length === 0 && (
            <p className="text-center text-gray-400 py-10">No meetings yet.</p>
          )}
        </div>
      </div>

      {showModal && (
        <MeetingModal
          meeting={editMeeting}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ['admin-meetings'] });
          }}
        />
      )}
    </div>
  );
}

function MeetingModal({ meeting, onClose, onSuccess }) {
  const isEdit = !!meeting;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(meetingSchema),
    defaultValues: isEdit
      ? {
          title: meeting.title,
          description: meeting.description ?? '',
          meeting_date: meeting.meeting_date
            ? meeting.meeting_date.substring(0, 16)
            : '',
          location: meeting.location ?? '',
          is_online: meeting.is_online ?? false,
          meeting_link: meeting.meeting_link ?? '',
        }
      : { is_online: false },
  });

  const isOnline = watch('is_online');

  const [apiError, setApiError] = useState('');

  const onSubmit = async (values) => {
    setApiError('');
    try {
      if (isEdit) {
        await updateMeeting(meeting.id, values);
      } else {
        await createMeeting(values);
      }
      onSuccess();
    } catch (err) {
      setApiError(err?.response?.data?.message ?? 'Something went wrong.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: '#1a3c6e' }}>
            {isEdit ? 'Edit Meeting' : 'Create Meeting'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        {apiError && (
          <p className="text-red-600 text-sm mb-4 bg-red-50 rounded-lg p-3">{apiError}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              {...register('title')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Monthly General Meeting"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
            <input
              {...register('meeting_date')}
              type="datetime-local"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {errors.meeting_date && <p className="text-red-500 text-xs mt-1">{errors.meeting_date.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input {...register('is_online')} type="checkbox" id="is_online" className="rounded" />
            <label htmlFor="is_online" className="text-sm text-gray-700">Online meeting</label>
          </div>

          {!isOnline && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                {...register('location')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Church hall, address…"
              />
            </div>
          )}

          {isOnline && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
              <input
                {...register('meeting_link')}
                type="url"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="https://meet.google.com/…"
              />
              {errors.meeting_link && <p className="text-red-500 text-xs mt-1">{errors.meeting_link.message}</p>}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#1a3c6e' }}
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
