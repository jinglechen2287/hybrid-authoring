import debounce from "lodash.debounce";
import { useEditorStore } from "~/stores";
import type { ProjectsData } from "~/types";
import { isValidEditorData } from "~/utils/validation";
import { supabase } from "./supabase";
import {
  getIsApplyingRemoteUpdate,
  withRemoteUpdateFlag,
} from "./syncState";
import { clientId, pickEditorFields, stringify } from "./util";

function applyEditorData(row: ProjectsData) {
  const incoming = row.editor;
  if (!isValidEditorData(incoming)) return;

  withRemoteUpdateFlag(() => {
    useEditorStore.setState((prev) => ({
      mode: incoming.mode ?? prev.mode,
      selectedObjId: incoming.selectedObjId,
      objStateIdxMap: incoming.objStateIdxMap ?? prev.objStateIdxMap,
      isHybrid: incoming.isHybrid ?? prev.isHybrid,
    }));
  });
}

function getEditorData(projectId: number) {
  supabase
    .from("projects")
    .select("editor")
    .eq("id", projectId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error("[supabase:editor] initial fetch error:", error);
        return;
      }
      if (data) {
        console.log("[supabase:editor] initial fetch ok, applying editor data");
        applyEditorData(data as ProjectsData);
      }
    });
}

export function startEditorSync(projectId: number = 1) {
  console.log("[supabase:editor] starting editor sync for project", projectId);

  // Kick off the initial fetch in the background
  getEditorData(projectId);

  const channel = supabase
    .channel(`projects:editor:${projectId}`)
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
        console.log("[supabase:editor] realtime payload", payload.eventType);
        const row = (payload.new ?? payload.old ?? {}) as ProjectsData;
        applyEditorData(row);
      },
    )
    .on("system", { event: "status_changed" }, (status) => {
      console.log("[supabase:editor] channel status:", status);
    })
    .subscribe();

  // Set up store -> database sync with debouncing and loop prevention
  let lastSnapshotString = stringify(pickEditorFields());

  const postUpdate = async () => {
    const editor = pickEditorFields();
    const update = {
      editor,
      edited_by_client: clientId,
      edited_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("projects")
      .update(update)
      .eq("id", projectId);

    if (updateError) {
      console.error("[supabase:editor] update error:", updateError);
    } else {
      // Snapshot after successful write
      lastSnapshotString = stringify(editor);
    }
  };

  const debouncedPostUpdate = debounce(postUpdate, 10, { maxWait: 50 });

  const unsubscribeEditorStore = useEditorStore.subscribe(() => {
    const next = pickEditorFields();
    const nextString = stringify(next);
    if (getIsApplyingRemoteUpdate()) {
      // Keep snapshot aligned but skip posting
      lastSnapshotString = nextString;
      return;
    }
    if (nextString === lastSnapshotString) return;
    debouncedPostUpdate();
  });

  return () => {
    supabase.removeChannel(channel);
    unsubscribeEditorStore();
  };
}
