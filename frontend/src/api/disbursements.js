import api from "./axios";

export const getDisbursements = () => api.get("/api/member/disbursements");
export const getDisbursement = (id) =>
  api.get(`/api/member/disbursements/${id}`);
export const getAdminDisbursements = () => api.get("/api/admin/disbursements");
export const createDisbursement = (data) =>
  api.post("/api/admin/disbursements", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const publishDisbursement = (id) =>
  api.patch(`/api/admin/disbursements/${id}/publish`);
export const getReceiptUrl = (id) => api.get(`/api/receipts/${id}`);
