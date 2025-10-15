import { create } from "zustand";
import type { Mode } from "~/types";

type ModeStore = {
  mode: Mode;
  toggleMode: () => void;
};

export const useModeStore = create<ModeStore>((set, get) => ({
  mode: "edit",
  toggleMode: () => set({ mode: get().mode === "edit" ? "play" : "edit" }),
}));


