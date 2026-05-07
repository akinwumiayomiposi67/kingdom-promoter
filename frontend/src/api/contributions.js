import api from './axios';

export const getActivePackages = () => api.get('/member/packages');
export const getPackages = () => api.get('/admin/packages');
export const setPackage = (data) => api.post('/member/contributions/set-package', data);
export const setPackage = (data) => api.post('/member/contributions/set-package', data);
export const getMyContributions = (page = 1) => api.get(`/member/contributions?page=${page}`);
export const getGroupContributions = (page = 1) => api.get(`/member/contributions/group?page=${page}`);
