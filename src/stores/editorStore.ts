import { create } from "zustand";
import type { EditorStore, TriggerType } from "~/types";

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
  isXRConnected: false,
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
