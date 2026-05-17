import api from "./axios";

export const getActivePackages = () => api.get("/api/member/packages");
export const getPackages = () => api.get("/api/admin/packages");
export const setPackage = (data) =>
  api.post("/api/member/contributions/set-package", data);
export const getMyContributions = (page = 1) =>
  api.get(`/api/member/contributions?page=${page}`);
export const getGroupContributions = (page = 1) =>
  api.get(`/api/member/contributions/group?page=${page}`);
