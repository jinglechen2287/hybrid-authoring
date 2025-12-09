import { create } from "zustand";
import type { RoomPlaneData } from "~/types";

type RoomStore = {
  planes: RoomPlaneData[];
  setPlanes: (planes: RoomPlaneData[]) => void;
};

export const useRoomStore = create<RoomStore>((set) => ({
  planes: [],
  setPlanes: (planes) => set({ planes }),
}));
