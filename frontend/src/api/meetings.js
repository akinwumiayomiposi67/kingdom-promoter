import api from "./axios";

export const getMeetings = () => api.get("/api/member/meetings");
export const getMeeting = (id) => api.get(`/api/member/meetings/${id}`);
export const rsvpMeeting = (id, data) =>
  api.post(`/api/member/meetings/${id}/rsvp`, data);
export const getAdminMeetings = () => api.get("/api/admin/meetings");
export const createMeeting = (data) => api.post("/api/admin/meetings", data);
export const updateMeeting = (id, data) =>
  api.put(`/api/admin/meetings/${id}`, data);
