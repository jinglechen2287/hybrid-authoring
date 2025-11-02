import { create } from "zustand";

type EditorMode = "edit" | "play";

type EditorStore = {
  mode: EditorMode;
  toggleMode: () => void;
  selectedObjId: string | undefined;
  setSelectedObjId: (value: string | undefined) => void;
  objStateIdxMap: Record<string, number>;
  setObjStateIdxMap: (value: number) => void;
};

export const useEditorStore = create<EditorStore>((set) => ({
  mode: "edit",
  toggleMode: () =>
    set((state) => {
      const nextMode = state.mode === "edit" ? "play" : "edit";
      return {
        mode: nextMode,
      };
    }),
  selectedObjId: undefined,
  setSelectedObjId: (value) =>
    set((state) => {
      if (!value) {
        return { selectedObjId: undefined };
      }
      const hasEntry = state.objStateIdxMap[value] ? true : false;
      return {
        selectedObjId: value,
        objStateIdxMap: hasEntry
          ? state.objStateIdxMap
          : { ...state.objStateIdxMap, [value]: 0 },
      };
    }),
  objStateIdxMap: {},
  setObjStateIdxMap: (value) =>
    set((state) => {
      if (state.mode === "play") {
        const keys = Object.keys(state.objStateIdxMap);
        if (keys.length === 0) {
          if (state.selectedObjId) {
            return { objStateIdxMap: { [state.selectedObjId]: value } };
          }
          return { objStateIdxMap: {} };
        }
        const unified: Record<string, number> = {};
        for (const k of keys) unified[k] = value;
        return { objStateIdxMap: unified };
      }
      if (!state.selectedObjId) return {};
      return {
        objStateIdxMap: {
          ...state.objStateIdxMap,
          [state.selectedObjId]: value,
        },
      };
    }),
}));
