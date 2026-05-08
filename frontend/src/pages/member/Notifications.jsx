import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/notifications';
import { useNotificationStore } from '../../store/notificationStore';

export default function Notifications() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => getNotifications(page).then((r) => r.data.data.notifications),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      setUnreadCount(0);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const notifications = data?.data ?? [];
  const lastPage = data?.last_page ?? 1;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1a3c6e' }}>
              Notifications
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Your activity updates</p>
          </div>
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>

        {isLoading && <p className="text-center text-gray-400 py-12">Loading…</p>}
        {error && <p className="text-red-500 text-center py-6">Failed to load notifications.</p>}

        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read_at && markReadMutation.mutate(n.id)}
              className={`w-full text-left bg-white rounded-xl px-5 py-4 shadow-sm border transition-colors hover:border-blue-200 ${
                !n.read_at ? 'border-blue-200 bg-blue-50' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${!n.read_at ? 'text-gray-900' : 'text-gray-600'}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{n.body}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                  {!n.read_at && (
                    <span className="inline-block w-2 h-2 rounded-full mt-1 ml-auto" style={{ backgroundColor: '#1a3c6e' }} />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {!isLoading && notifications.length === 0 && (
          <p className="text-center text-gray-400 py-16">No notifications yet.</p>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {lastPage}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
