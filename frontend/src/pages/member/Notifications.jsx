import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/notifications";
import { useNotificationStore } from "../../store/notificationStore";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";

export default function Notifications() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () =>
      getNotifications(page).then((r) => r.data.data.notifications),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      setUnreadCount(0);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const notifications = data?.data ?? [];
  const lastPage = data?.last_page ?? 1;

  return (
    <div className="page-content">
      <PageHeader
        title="Notifications"
        description="Your recent notifications"
        action={
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={
              markAllMutation.isPending || notifications.every((n) => n.is_read)
            }
            className="btn-outline btn-sm gap-1"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        }
      />

      {error && (
        <p className="text-red-500 text-sm">Failed to load notifications.</p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up!"
          />
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
              className={`card p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                n.is_read
                  ? "opacity-60"
                  : "border-brand-200 bg-brand-50/30 hover:bg-brand-50"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.is_read ? "bg-slate-200" : "bg-brand-500"}`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {n.title ?? n.type}
                </p>
                <p className="text-sm text-slate-500">
                  {n.body ?? n.message ?? ""}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-outline btn-sm"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {lastPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page >= lastPage}
            className="btn-outline btn-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
