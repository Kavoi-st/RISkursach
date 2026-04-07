import { create } from 'zustand';

export type ToastState = {
  message: string;
  linkTo?: string;
};

type ToastStore = {
  toast: ToastState | null;
  show: (toast: ToastState) => void;
  clear: () => void;
};

let timerId: number | null = null;

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  show: (toast) => {
    if (timerId) window.clearTimeout(timerId);
    set({ toast });
    timerId = window.setTimeout(() => set({ toast: null }), 2500);
  },
  clear: () => {
    if (timerId) window.clearTimeout(timerId);
    timerId = null;
    set({ toast: null });
  }
}));

