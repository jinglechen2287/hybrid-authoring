import debounce from "lodash.debounce";
import { cameraStore } from "~/stores";
import type { CameraData, ProjectsData } from "~/types";
import { isValidCameraData } from "~/utils/validation";
import { supabase } from "./supabase";
import {
    getIsApplyingRemoteUpdate,
    withRemoteUpdateFlag,
} from "./syncState";
import { clientId, pickCameraFields, stringify } from "./util";

function applyCameraData(row: ProjectsData) {
    const incoming = row.camera;
    if (!isValidCameraData(incoming)) return;

    withRemoteUpdateFlag(() => {
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
    });
}

async function getCameraData(projectId: number) {
    const { data, error } = await supabase
        .from("projects")
        .select("camera")
        .eq("id", projectId)
        .single();
    if (error) {
        console.error("[supabase:camera] initial fetch error:", error);
        return;
    }
    if (data) {
        console.log("[supabase:camera] initial fetch ok, applying camera data");
        applyCameraData(data as ProjectsData);
    }
}

export function startCameraSync(projectId: number = 1) {
    console.log("[supabase:camera] starting camera sync for project", projectId);

    // Kick off the initial fetch in the background
    getCameraData(projectId);

    const channel = supabase
        .channel(`projects:camera:${projectId}`)
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
                console.log("[supabase:camera] realtime payload", payload.eventType);
                const row = (payload.new ?? payload.old ?? {}) as ProjectsData;
                applyCameraData(row);
            },
        )
        .on("system", { event: "status_changed" }, (status) => {
            console.log("[supabase:camera] channel status:", status);
        })
        .subscribe();

    // Set up store -> database sync with debouncing and loop prevention
    let lastSnapshotString = stringify(pickCameraFields());

    const postUpdate = async () => {
        const camera = pickCameraFields();
        const update = {
            camera,
            edited_by_client: clientId,
            edited_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
            .from("projects")
            .update(update)
            .eq("id", projectId);

        if (updateError) {
            console.error("[supabase:camera] update error:", updateError);
        } else {
            // Snapshot after successful write
            lastSnapshotString = stringify(camera);
        }
    };

    const debouncedPostUpdate = debounce(postUpdate, 10, { maxWait: 50 });

    const unsubscribeCameraStore = cameraStore.subscribe(() => {
        const next = pickCameraFields();
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
        unsubscribeCameraStore();
    };
}


