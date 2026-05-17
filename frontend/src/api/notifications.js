import api from "./axios";

export const getNotifications = (page = 1) =>
  api.get("/api/member/notifications", { params: { page } });
export const getUnreadCount = () =>
  api.get("/api/member/notifications/unread-count");
export const markNotificationRead = (id) =>
  api.post(`/api/member/notifications/${id}/read`);
export const markAllNotificationsRead = () =>
  api.post("/api/member/notifications/read-all");
export const registerFcmToken = (token) =>
  api.post("/api/auth/fcm-token", { fcm_token: token });
