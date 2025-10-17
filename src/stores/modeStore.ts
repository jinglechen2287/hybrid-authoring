import { create } from "zustand";
import type { Mode } from "~/types";

type ModeStore = {
  mode: Mode;
  toggleMode: () => void;
  isAuthoringAnimation: boolean;
  setIsAuthoringAnimation: (value: boolean) => void;
};

export const useModeStore = create<ModeStore>((set) => ({
  mode: "edit",
  toggleMode: () =>
    set((state) => {
      const nextMode = state.mode === "edit" ? "play" : "edit";
      return {
        mode: nextMode,
        isAuthoringAnimation:
          nextMode === "play" ? false : state.isAuthoringAnimation,
      };
    }),
  isAuthoringAnimation: false,
  setIsAuthoringAnimation: (value: boolean) =>
    set({
      isAuthoringAnimation: value,
    }),
}));
