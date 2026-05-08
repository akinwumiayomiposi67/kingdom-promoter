import api from './axios';

export const getDisbursements = () => api.get('/member/disbursements');
export const getDisbursement = (id) => api.get(`/member/disbursements/${id}`);
export const getAdminDisbursements = () => api.get('/admin/disbursements');
export const createDisbursement = (data) =>
  api.post('/admin/disbursements', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const publishDisbursement = (id) => api.patch(`/admin/disbursements/${id}/publish`);
export const getReceiptUrl = (id) => api.get(`/receipts/${id}`);
