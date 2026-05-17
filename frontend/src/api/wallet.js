import api from "./axios";

export const getWallet = () => api.get("/api/member/wallet");
