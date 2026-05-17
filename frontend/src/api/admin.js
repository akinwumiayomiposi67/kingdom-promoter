import api from "./axios";

export const getDashboardStats = () => api.get("/api/admin/dashboard/stats");

export const getMembers = (params) => api.get("/api/admin/members", { params });
export const getMember = (id) => api.get(`/api/admin/members/${id}`);
export const updateMemberStatus = (id, data) =>
  api.patch(`/api/admin/members/${id}/status`, data);
export const inviteMember = (data) =>
  api.post("/api/admin/members/invite", data);

export const getAdminWallets = () => api.get("/api/admin/wallets");
export const getAdminWallet = (userId) =>
  api.get(`/api/admin/wallets/${userId}`);
export const manualDebit = (userId, data) =>
  api.post(`/api/admin/wallets/${userId}/manual-debit`, data);

export const getContributionsReport = (params) =>
  api.get("/api/admin/reports/contributions", { params, responseType: "blob" });
export const getWalletsReport = (params) =>
  api.get("/api/admin/reports/wallets", { params, responseType: "blob" });

export const getContributionCycleStats = (id) =>
  api.get(`/admin/cycles/${id}/stats`);

// Package management
export const getPackages = () => api.get("/admin/packages");
export const createPackage = (data) => api.post("/admin/packages", data);
export const updatePackage = (id, data) =>
  api.put(`/admin/packages/${id}`, data);
export const togglePackage = (id) => api.patch(`/admin/packages/${id}/toggle`);

// Cycle management
export const getCycles = () => api.get("/admin/cycles");
export const createCycle = (data) => api.post("/admin/cycles", data);
export const getCycle = (id) => api.get(`/admin/cycles/${id}`);
export const closeCycle = (id) => api.patch(`/admin/cycles/${id}/close`);
export const triggerDebit = (id) =>
  api.post(`/admin/cycles/${id}/trigger-debit`);

export const setup2FA = () => api.post("/auth/2fa/setup");
export const enable2FA = (data) => api.post("/auth/2fa/enable", data);
export const verify2FA = (data) => api.post("/auth/2fa/verify", data);
export const disable2FA = (data) => api.post("/auth/2fa/disable", data);
