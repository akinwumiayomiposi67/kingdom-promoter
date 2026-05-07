import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,

      setAuth: (user, token, role) => set({ user, token, role }),

      clearAuth: () => set({ user: null, token: null, role: null }),
    }),
    {
      name: 'kfc-auth',
      // sessionStorage is cleared when the browser tab is closed — never localStorage
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
