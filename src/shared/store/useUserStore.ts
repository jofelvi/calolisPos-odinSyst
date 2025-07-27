import { create } from 'zustand';
import { User, UserStore } from '@/modelTypes/user';

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user: User | null) => set({ user }),
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
