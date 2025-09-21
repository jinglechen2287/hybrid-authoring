import { supabase } from "./supabase";
import { useSceneStore } from "~/stores";
import type { Transformation } from "~/types";
import type { Vector3Tuple } from "three";
import debounce from "lodash.debounce";

type ProjectsData = Partial<{
  light_position: Vector3Tuple;
  sphere_transformation: Transformation;
  cube_transformation: Transformation;
  cone_transformation: Transformation;
}>;

// Prevent feedback loops: when applying remote data to the store, ignore store->DB sync
let isApplyingRemoteUpdate = false;

function applyProjectDataToScene(row: ProjectsData) {
  isApplyingRemoteUpdate = true;
  try {
    useSceneStore.setState((prev) => ({
        lightPosition: row.light_position ?? prev.lightPosition,
        sphereTransformation:
          row.sphere_transformation ?? prev.sphereTransformation,
        cubeTransformation: row.cube_transformation ?? prev.cubeTransformation,
        coneTransformation: row.cone_transformation ?? prev.coneTransformation,
      }));
  } finally {
    // Yield back to event loop so subscribers see the updated state before we flip the flag
    setTimeout(() => {
      isApplyingRemoteUpdate = false;
    }, 0);
  }

}

function pickDbFieldsFromSceneState() {
  const state = useSceneStore.getState();
  return {
    lightPosition: state.lightPosition,
    sphereTransformation: state.sphereTransformation,
    cubeTransformation: state.cubeTransformation,
    coneTransformation: state.coneTransformation,
  };
}

function shallowStableStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export function startSceneSupabaseSync(projectId: number = 1) {
  console.log("[supabase] starting scene sync for project", projectId);

  // Kick off the initial fetch in the background to avoid delaying
  // the synchronous return of the unsubscribe function (prevents
  // React Strict Mode double-effect races).
  void supabase
    .from("projects")
    .select(
      "light_position, sphere_transformation, cube_transformation, cone_transformation"
    )
    .eq("id", projectId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error("[supabase] initial fetch error:", error);
        return;
      }
      if (data) {
        console.log("[supabase] initial fetch ok, applying scene data");
        applyProjectDataToScene(data as ProjectsData);
      }
    });

//   supabase.removeAllChannels()

  const channel = supabase
    .channel(`projects:${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "projects",
        filter: `id=eq.${projectId}`,
      },
      (payload) => {
        console.log("[supabase] realtime payload", payload.eventType);
        const row = (payload.new ?? payload.old ?? {}) as ProjectsData;
        applyProjectDataToScene(row);
      }
    )
    .on("system", { event: "status_changed" }, (status) => {
      console.log("[supabase] channel status:", status);
    })
    .subscribe();

  // Set up store -> database sync with debouncing and loop prevention
  let lastSnapshotString = shallowStableStringify(pickDbFieldsFromSceneState());

  const postUpdate = async () => {
    const current = pickDbFieldsFromSceneState();
    const update: ProjectsData = {
      light_position: current.lightPosition,
      sphere_transformation: current.sphereTransformation,
      cube_transformation: current.cubeTransformation,
      cone_transformation: current.coneTransformation,
    };

    const { error: updateError } = await supabase
      .from("projects")
      .update(update)
      .eq("id", projectId);

    if (updateError) {
      console.error("[supabase] update error:", updateError);
    } else {
      // Snapshot after successful write
      lastSnapshotString = shallowStableStringify(current);
      // console.log("[supabase] scene synced to DB");
    }
  };

  const debouncedPostUpdate = debounce(postUpdate, 10, { maxWait: 50 });

  const unsubscribeStore = useSceneStore.subscribe(() => {
    const next = pickDbFieldsFromSceneState();
    const nextString = shallowStableStringify(next);

    if (isApplyingRemoteUpdate) {
      // Keep snapshot aligned but skip posting
      lastSnapshotString = nextString;
      return;
    }

    if (nextString === lastSnapshotString) return;
    debouncedPostUpdate();
  });

  return () => {
    try {
      unsubscribeStore();
    } catch {
      // no-op
    }
    supabase.removeChannel(channel);
  };
}
