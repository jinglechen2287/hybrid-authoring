import { create } from "zustand";
import type { TriggerType } from "~/types";

type EditorMode = "edit" | "play";

type EditorStore = {
  mode: EditorMode;
  toggleMode: () => void;
  selectedObjId: string | undefined;
  setSelectedObjId: (value: string | undefined) => void;
  objStateIdxMap: Record<string, number>;
  setObjStateIdxMap: (value: number) => void;
  // Connect-mode for creating transitions between states in canvas
  isConnecting: boolean;
  connectingFromObjId?: string;
  connectingFromStateId?: string;
  connectingTrigger: TriggerType;
  setConnectingFrom: (objId: string, stateId: string) => void;
  cycleConnectingTrigger: () => void;
  setConnectingTrigger: (trigger: TriggerType) => void;
  cancelConnecting: () => void;
};

export const useEditorStore = create<EditorStore>((set) => ({
  mode: "edit",
  toggleMode: () =>
    set((state) => {
      const nextMode = state.mode === "edit" ? "play" : "edit";
      let nextObjStateIdxMap = state.objStateIdxMap;
      if (nextMode === "play") {
        const keys = Object.keys(state.objStateIdxMap);
        if (keys.length === 0) {
          nextObjStateIdxMap = state.selectedObjId
            ? { [state.selectedObjId]: 0 }
            : {};
        } else {
          const unified: Record<string, number> = {};
          for (const k of keys) unified[k] = 0;
          nextObjStateIdxMap = unified;
        }
      }
      return {
        mode: nextMode,
        objStateIdxMap: nextObjStateIdxMap,
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
  isConnecting: false,
  connectingTrigger: "click",
  setConnectingFrom: (objId, stateId) =>
    set(() => ({
      isConnecting: true,
      connectingFromObjId: objId,
      connectingFromStateId: stateId,
      connectingTrigger: "click",
    })),
  cycleConnectingTrigger: () =>
    set((state) => {
      const order: TriggerType[] = [
        "click",
        "hoverStart",
        "hoverEnd",
        "auto",
        "",
      ];
      const idx = order.indexOf(state.connectingTrigger);
      const next = order[(idx + 1) % order.length];
      if (next === "") {
        return {
          connectingTrigger: "",
          isConnecting: false,
          connectingFromObjId: undefined,
          connectingFromStateId: undefined,
        };
      }
      return { connectingTrigger: next };
    }),
  setConnectingTrigger: (trigger) => set(() => ({ connectingTrigger: trigger })),
  cancelConnecting: () =>
    set(() => ({
      isConnecting: false,
      connectingFromObjId: undefined,
      connectingFromStateId: undefined,
      connectingTrigger: "click",
    })),
}));
