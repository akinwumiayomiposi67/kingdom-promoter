import api from './axios';

export const getMeetings = () => api.get('/member/meetings');
export const getMeeting = (id) => api.get(`/member/meetings/${id}`);
export const rsvpMeeting = (id, data) => api.post(`/member/meetings/${id}/rsvp`, data);
export const getAdminMeetings = () => api.get('/admin/meetings');
export const createMeeting = (data) => api.post('/admin/meetings', data);
export const updateMeeting = (id, data) => api.put(`/admin/meetings/${id}`, data);
