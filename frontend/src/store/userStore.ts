import { create } from 'zustand';

export type User = {
  id: string;
  email: string;
  fullName: string;
  role?: 'ADMIN' | 'SELLER' | 'BUYER' | 'MODERATOR';
};

type UserState = {
  currentUser: User | null;
  setUser: (user: User | null) => void;
};

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  setUser: (user) => set({ currentUser: user })
}));

