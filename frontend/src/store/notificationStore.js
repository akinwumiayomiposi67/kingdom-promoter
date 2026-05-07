import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  unreadCount: 0,
  notifications: [],
  setUnreadCount: (count) => set({ unreadCount: count }),
  setNotifications: (notifications) => set({ notifications }),
}));
