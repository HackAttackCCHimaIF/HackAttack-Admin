import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@supabase/supabase-js";

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  reset: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      reset: () => set({ user: null }),
    }),
    {
      name: "user-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
