import debounce from "lodash.debounce";
import { v4 as uuidv4 } from "uuid";
import { useSceneStore } from "~/stores";
import type { ProjectsData, SceneData } from "~/types";
import { supabase } from "./supabase";
import { pickDbFields, stringify } from "./util";

const clientId = uuidv4();

// Prevent feedback loops: when applying remote data to the store, ignore store->DB sync
let isApplyingRemoteUpdate = false;

function setScene(row: ProjectsData) {
  isApplyingRemoteUpdate = true;
  try {
    const incoming = row.scene;
    let scene: SceneData | undefined;
    if (
      incoming &&
      typeof incoming === "object" &&
      Object.prototype.hasOwnProperty.call(incoming as object, "content")
    ) {
      scene = incoming as SceneData;
    } 
    if (scene) {
      useSceneStore.setState((prev) => ({
        lightPosition: scene?.lightPosition ?? prev.lightPosition,
        content: scene?.content ?? prev.content,
      }));
      console.log(scene)
    }
  } finally {
    // Yield back to event loop so subscribers see the updated state before we flip the flag
    setTimeout(() => {
      isApplyingRemoteUpdate = false;
    }, 0);
  }
}

function getProjectData(projectId: number) {
  supabase
    .from("projects")
    .select("scene")
    .eq("id", projectId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error("[supabase] initial fetch error:", error);
        return;
      }
      if (data) {
        console.log("[supabase] initial fetch ok, applying scene data");
        setScene(data as ProjectsData);
      }
    });
}

export function startSceneSync(projectId: number = 1) {
  console.log("[supabase] starting scene sync for project", projectId);

  // Kick off the initial fetch in the background to avoid delaying
  // the synchronous return of the unsubscribe function (prevents
  // React Strict Mode double-effect races).
  getProjectData(projectId);

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
        if ((payload.new as ProjectsData)?.edited_by_client === clientId)
          return;
        console.log("[supabase] realtime payload", payload.eventType);
        const row = (payload.new ?? payload.old ?? {}) as ProjectsData;
        setScene(row);
      },
    )
    .on("system", { event: "status_changed" }, (status) => {
      console.log("[supabase] channel status:", status);
    })
    .subscribe();

  // Set up store -> database sync with debouncing and loop prevention
  let lastSnapshotString = stringify(pickDbFields());

  const postUpdate = async () => {
    const current = pickDbFields();
    const scene: SceneData = {
      lightPosition: current.lightPosition,
      content: current.content,
    };
    const update = {
      scene,
      edited_by_client: clientId,
      edited_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("projects")
      .update(update)
      .eq("id", projectId);

    if (updateError) {
      console.error("[supabase] update error:", updateError);
    } else {
      // Snapshot after successful write
      lastSnapshotString = stringify(current);
    }
  };

  const debouncedPostUpdate = debounce(postUpdate, 10, { maxWait: 50 });

  const unsubscribeStore = useSceneStore.subscribe(() => {
    const next = pickDbFields();
    const nextString = stringify(next);

    if (isApplyingRemoteUpdate) {
      // Keep snapshot aligned but skip posting
      lastSnapshotString = nextString;
      return;
    }

    if (nextString === lastSnapshotString) return;
    debouncedPostUpdate();
  });

  return () => {
    supabase.removeChannel(channel);
    unsubscribeStore();
  };
}
