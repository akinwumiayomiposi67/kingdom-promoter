import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '../../store/notificationStore';
import { getUnreadCount, getNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/notifications';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const notifications = useNotificationStore((s) => s.notifications);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  const fetchUnread = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.data.count);
    } catch {
      // silent
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications(1);
      setNotifications(res.data.data.notifications.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch {
      // silent
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch unread count on mount and every 60 seconds
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        {/* Bell icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white rounded-full" style={{ backgroundColor: '#f59e0b' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-800 text-sm">Notifications</span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
              <Link
                to="/notifications"
                className="text-xs text-gray-500 hover:underline"
                onClick={() => setOpen(false)}
              >
                See all
              </Link>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {loading && (
              <p className="text-center text-gray-400 text-sm py-6">Loading…</p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">No notifications yet.</p>
            )}
            {!loading &&
              notifications.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read_at && handleMarkRead(n.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read_at ? 'bg-blue-50' : ''}`}
                >
                  <p className={`text-sm font-medium ${!n.read_at ? 'text-gray-900' : 'text-gray-600'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
