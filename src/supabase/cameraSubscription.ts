import debounce from "lodash.debounce";
import { cameraStore } from "~/stores";
import type { CameraData, ProjectsData } from "~/types";
import { supabase } from "./supabase";
import { clientId, stringify } from "./util";

// Prevent feedback loops: when applying remote data to the camera store, skip store->DB sync
let isApplyingRemoteCameraUpdate = false;

function isValidCameraData(value: unknown): value is CameraData {
  if (!value || typeof value !== "object") return false;
  const cam = value as Partial<CameraData>;
  return (
    typeof cam.distance === "number" &&
    typeof cam.yaw === "number" &&
    typeof cam.pitch === "number" &&
    Array.isArray(cam.origin) &&
    cam.origin.length === 3 &&
    cam.origin.every((n) => typeof n === "number")
  );
}

function setCamera(row: ProjectsData) {
  const incoming = row.camera;
  if (!isValidCameraData(incoming)) return;
  isApplyingRemoteCameraUpdate = true;
  try {
    cameraStore.setState((prev) => ({
      distance:
        typeof incoming.distance === "number"
          ? incoming.distance
          : prev.distance,
      yaw: typeof incoming.yaw === "number" ? incoming.yaw : prev.yaw,
      pitch: typeof incoming.pitch === "number" ? incoming.pitch : prev.pitch,
      origin: Array.isArray(incoming.origin)
        ? (incoming.origin as CameraData["origin"])
        : prev.origin,
    }));
  } finally {
    setTimeout(() => {
      isApplyingRemoteCameraUpdate = false;
    }, 0);
  }
}

async function getProjectCamera(projectId: number) {
  const { data, error } = await supabase
    .from("projects")
    .select("camera")
    .eq("id", projectId)
    .single();
  if (error) {
    console.error("[supabase] initial camera fetch error:", error);
    return;
  }
  if (data) {
    setCamera(data as ProjectsData);
  }
}

export function startCameraSync(projectId: number = 1) {
  console.log("[supabase] starting camera sync for project", projectId);

  // Initial hydration
  getProjectCamera(projectId);

  const channel = supabase
    .channel(`projects:${projectId}:camera`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "projects",
        filter: `id=eq.${projectId}`,
      },
      (payload) => {
        if ((payload.new as ProjectsData)?.edited_by_client === clientId)
          return;
        const row = (payload.new ?? payload.old ?? {}) as ProjectsData;
        setCamera(row);
      },
    )
    .subscribe();

  // Store -> DB sync
  let lastCameraSnapshot = stringify(cameraStore.getState());

  const postCameraUpdate = async () => {
    const current = cameraStore.getState();
    const camera: CameraData = {
      distance: current.distance,
      yaw: current.yaw,
      pitch: current.pitch,
      origin: current.origin,
    };
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        camera,
        edited_by_client: clientId,
        edited_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    if (updateError) {
      console.error("[supabase] camera update error:", updateError);
    } else {
      lastCameraSnapshot = stringify(camera);
    }
  };

  const debouncedPostCameraUpdate = debounce(postCameraUpdate, 10, {
    maxWait: 50,
  });

  const unsubscribeCameraStore = cameraStore.subscribe(() => {
    const next = cameraStore.getState();
    const nextString = stringify({
      distance: next.distance,
      yaw: next.yaw,
      pitch: next.pitch,
      origin: next.origin,
    });
    if (isApplyingRemoteCameraUpdate) {
      lastCameraSnapshot = nextString;
      return;
    }
    if (nextString === lastCameraSnapshot) return;
    debouncedPostCameraUpdate();
  });

  return () => {
    supabase.removeChannel(channel);
    unsubscribeCameraStore();
  };
}
