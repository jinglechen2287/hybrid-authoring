import { create } from "zustand";
import { TRIGGER_ORDER } from "~/constants";
import type { EditorStore } from "~/types";

export const useEditorStore = create<EditorStore>((set) => ({
  mode: "edit",
  toggleMode: () =>
    set((state) => {
      const nextMode = state.mode === "edit" ? "play" : "edit";
      let nextObjStateIdxMap = state.objStateIdxMap;
      if (nextMode === "play") {
        // Reset objStateIdxMap to 0 for all objects in play mode
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
        selectedObjId: undefined,
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
      // If the object is not in the map, add it with index 0
      const newObjStateIdxMap = hasEntry
        ? state.objStateIdxMap
        : { ...state.objStateIdxMap, [value]: 0 };
      return {
        selectedObjId: value,
        objStateIdxMap: newObjStateIdxMap,
      };
    }),
  objStateIdxMap: {},
  setObjStateIdxMap: (value) =>
    set((state) => {
      if (!state.selectedObjId) return {};
      return {
        objStateIdxMap: {
          ...state.objStateIdxMap,
          [state.selectedObjId]: value,
        },
      };
    }),
  isHybrid: false,
// --------- Connect-mode for creating transitions between states in canvas ---------
  isConnecting: false,
  connectingFromObjId: undefined,
  connectingFromStateId: undefined,
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
      const idx = TRIGGER_ORDER.indexOf(state.connectingTrigger);
      const next = TRIGGER_ORDER[(idx + 1) % TRIGGER_ORDER.length];
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
