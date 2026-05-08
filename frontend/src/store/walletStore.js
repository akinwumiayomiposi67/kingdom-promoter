import { create } from 'zustand';

export const useWalletStore = create((set) => ({
  wallet: null,
  transactions: [],
  setWallet: (wallet) => set({ wallet }),
  setTransactions: (transactions) => set({ transactions }),
}));
