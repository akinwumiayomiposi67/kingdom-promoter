import api from './axios';

export const getDashboardStats = () => api.get('/admin/dashboard/stats');

export const getMembers = (params) => api.get('/admin/members', { params });
export const getMember = (id) => api.get(`/admin/members/${id}`);
export const updateMemberStatus = (id, data) => api.patch(`/admin/members/${id}/status`, data);
export const inviteMember = (data) => api.post('/admin/members/invite', data);

export const getAdminWallets = () => api.get('/admin/wallets');
export const getAdminWallet = (userId) => api.get(`/admin/wallets/${userId}`);
export const manualDebit = (userId, data) => api.post(`/admin/wallets/${userId}/manual-debit`, data);

export const getContributionsReport = (params) =>
  api.get('/admin/reports/contributions', { params, responseType: 'blob' });
export const getWalletsReport = (params) =>
  api.get('/admin/reports/wallets', { params, responseType: 'blob' });

export const setup2FA = () => api.post('/auth/2fa/setup');
export const enable2FA = (data) => api.post('/auth/2fa/enable', data);
export const verify2FA = (data) => api.post('/auth/2fa/verify', data);
export const disable2FA = (data) => api.post('/auth/2fa/disable', data);
