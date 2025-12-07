import debounce from "lodash.debounce";
import { useEditorStore, useSceneStore } from "~/stores";
import type { CoreEditorData, ProjectsData, SceneData } from "~/types";
import { supabase } from "./supabase";
import { clientId, pickDBFields, stringify } from "./util";

// Prevent feedback loops: when applying remote data to the store, ignore store->DB sync
let isApplyingRemoteUpdate = false;

function setScene(row: ProjectsData) {
  isApplyingRemoteUpdate = true;
  try {
    const incomingScene = row.scene;
    const incomingEditor = row.editor;

    let scene: SceneData | undefined;
    if (
      incomingScene &&
      typeof incomingScene === "object" &&
      Object.prototype.hasOwnProperty.call(incomingScene as object, "content")
    ) {
      scene = incomingScene as SceneData;
    } 
    if (scene) {
      useSceneStore.setState((prev) => ({
        lightPosition: scene?.lightPosition ?? prev.lightPosition,
        content: scene?.content ?? prev.content,
      }));
      console.log(scene)
    }

    let editor: CoreEditorData | undefined;
    if (
      incomingEditor &&
      typeof incomingEditor === "object" &&
      Object.prototype.hasOwnProperty.call(incomingEditor as object, "mode")
    ) {
      editor = incomingEditor as CoreEditorData;
    }
    if (editor) {
      useEditorStore.setState((prev) => ({
        mode: editor.mode ?? prev.mode,
        selectedObjId: editor.selectedObjId,
        objStateIdxMap: editor.objStateIdxMap ?? prev.objStateIdxMap,
        isXRConnected: editor.isXRConnected ?? prev.isXRConnected,
      }));
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
    .select("scene, editor")
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
  let lastSnapshotString = stringify(pickDBFields());

  const postUpdate = async () => {
    const current = pickDBFields();
    const scene: SceneData = {
      lightPosition: current.lightPosition,
      content: current.content,
    };
    const editor: CoreEditorData = {
      mode: current.mode,
      selectedObjId: current.selectedObjId,
      objStateIdxMap: current.objStateIdxMap,
      isXRConnected: current.isXRConnected,
    };
    const update = {
      scene,
      editor,
      edited_by_client: clientId,
      edited_at: new Date().toISOString(),
    };
    console.log("post update", update);

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

  const unsubscribeSceneStore = useSceneStore.subscribe(() => {
    const next = pickDBFields();
    const nextString = stringify(next);
    if (isApplyingRemoteUpdate) {
      // Keep snapshot aligned but skip posting
      lastSnapshotString = nextString;
      return;
    }
    if (nextString === lastSnapshotString) return;
    debouncedPostUpdate();
  });

  const unsubscribeEditorStore = useEditorStore.subscribe(() => {
    // FIXME: this is called when connecting related fields are changed. Less ideal.
    const next = pickDBFields();
    const nextString = stringify(next);
    if (isApplyingRemoteUpdate) {
      lastSnapshotString = nextString;
      return;
    }
    if (nextString === lastSnapshotString) return;
    debouncedPostUpdate();
  });

  return () => {
    supabase.removeChannel(channel);
    unsubscribeSceneStore();
    unsubscribeEditorStore();
  };
}
