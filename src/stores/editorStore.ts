import { create } from "zustand";

type EditorMode = "edit" | "play";

type EditorStore = {
  mode: EditorMode;
  toggleMode: () => void;
  isAuthoringAnimation: boolean;
  setIsAuthoringAnimation: (value: boolean) => void;
};

export const useEditorStore = create<EditorStore>((set) => ({
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
