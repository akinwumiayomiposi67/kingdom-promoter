import api from './axios';

export const getNotifications = (page = 1) => api.get('/member/notifications', { params: { page } });
export const getUnreadCount = () => api.get('/member/notifications/unread-count');
export const markNotificationRead = (id) => api.post(`/member/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.post('/member/notifications/read-all');
export const registerFcmToken = (token) => api.post('/auth/fcm-token', { fcm_token: token });
