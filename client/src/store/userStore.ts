import { create } from "zustand";
import { usersAPI } from "@/lib/api";
import type { IUser } from "@/types/user";

interface UserStore {
  user: IUser | null;
  loading: boolean;
  error: string | null;
  syncUser: (data: { email: string; name: string }) => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: IUser | null) => void;
  clearUser: () => void;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load user";
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  error: null,
  syncUser: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await usersAPI.sync(data);
      set({ user: response.data.user, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },
  fetchMe: async () => {
    set({ loading: true, error: null });
    try {
      const response = await usersAPI.getMe();
      set({ user: response.data.user, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null, error: null }),
}));
