import { useRoomStore } from "~/stores/roomStore";
import { supabase } from "./supabase";

export function getRoomData(projectId: number = 1) {
  supabase
    .from("projects")
    .select("room")
    .eq("id", projectId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error("[supabase] initial fetch error:", error);
        return;
      }
      if (data && Array.isArray(data.room)) {
        console.log("[supabase] initial fetch ok, applying scene data");
        useRoomStore.getState().setPlanes(data.room);
      }
    });
}

export function patchRoomData(projectId: number = 1) {
  supabase
    .from("projects")
    .update({ room: useRoomStore.getState().planes })
    .eq("id", projectId)
    .then(({ error }) => {
      if (error) {
        console.error("[supabase] update error:", error);
      }
    });
}
