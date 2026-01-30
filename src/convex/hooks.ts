import { useQuery, useMutation } from "convex/react";
import { useEffect, useRef, useMemo, useCallback } from "react";
import debounce from "lodash.debounce";
import { api } from "../../convex/_generated/api";
import { useSceneStore } from "~/stores/sceneStore";
import { useEditorStore } from "~/stores/editorStore";
import { cameraStore } from "~/stores/cameraStore";
import { useRoomStore } from "~/stores/roomStore";
import { PROJECT_ID } from "./projectId";
import { DEBOUNCE_TIMING } from "~/constants";
import type { SceneObj, ObjState, Transform, TriggerType } from "~/types";

// Tolerance for floating point comparison to prevent sync loops
const EPSILON = 1e-9;
const nearEqual = (a: number, b: number) => Math.abs(a - b) < EPSILON;
const arraysNearEqual = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => nearEqual(v, b[i]));

// Type-safe conversion for scene content from Convex
type ConvexSceneObj = {
  type: "sphere" | "cube" | "cone";
  name: string;
  states: Array<{
    id: string;
    transform: {
      position: number[];
      rotation: number[];
      scale: number[];
    };
    trigger: "click" | "hoverStart" | "hoverEnd" | "auto" | "";
    transitionTo: string;
  }>;
};

function convertConvexToSceneObj(obj: ConvexSceneObj): SceneObj {
  return {
    type: obj.type,
    name: obj.name,
    states: obj.states.map(
      (state): ObjState => ({
        id: state.id,
        transform: {
          position: state.transform.position as [number, number, number],
          rotation: state.transform.rotation as [number, number, number],
          scale: state.transform.scale as [number, number, number],
        } as Transform,
        trigger: state.trigger as TriggerType,
        transitionTo: state.transitionTo,
      })
    ),
  };
}

export function useProjectSync() {
  // Track last applied remote data to prevent sync loops
  // More robust than counter + queueMicrotask which can be racy
  const lastRemoteScene = useRef<typeof sceneData>(null);
  const lastRemoteEditor = useRef<typeof editorData>(null);
  const lastRemoteCamera = useRef<typeof cameraData>(null);

  // Convex queries - auto-realtime
  const sceneData = useQuery(api.projects.getScene, { projectId: PROJECT_ID });
  const editorData = useQuery(api.projects.getEditor, { projectId: PROJECT_ID });
  const cameraData = useQuery(api.projects.getCamera, { projectId: PROJECT_ID });
  const roomData = useQuery(api.projects.getRoom, { projectId: PROJECT_ID });

  // Convex mutations
  const mutateScene = useMutation(api.projects.updateScene);
  const mutateEditor = useMutation(api.projects.updateEditor);
  const mutateCamera = useMutation(api.projects.updateCamera);
  const mutateRoom = useMutation(api.projects.updateRoom);

  // ============ Remote -> Local Sync ============

  // Apply scene data from Convex
  useEffect(() => {
    if (!sceneData) return;
    lastRemoteScene.current = sceneData;
    useSceneStore.setState({
      lightPosition: sceneData.lightPosition as [number, number, number],
      content: Object.fromEntries(
        Object.entries(sceneData.content).map(([id, obj]) => [
          id,
          convertConvexToSceneObj(obj as ConvexSceneObj),
        ])
      ),
    });
  }, [sceneData]);

  // Apply editor data from Convex
  useEffect(() => {
    if (!editorData) return;
    lastRemoteEditor.current = editorData;
    useEditorStore.setState({
      mode: editorData.mode,
      selectedObjId: editorData.selectedObjId,
      objStateIdxMap: editorData.objStateIdxMap,
      isHybrid: editorData.isHybrid,
    });
  }, [editorData]);

  // Apply camera data from Convex
  useEffect(() => {
    if (!cameraData) return;
    lastRemoteCamera.current = cameraData;
    cameraStore.setState({
      distance: cameraData.distance,
      yaw: cameraData.yaw,
      pitch: cameraData.pitch,
      origin: cameraData.origin as [number, number, number],
    });
  }, [cameraData]);

  // Apply room data from Convex (one-shot)
  useEffect(() => {
    if (!roomData) return;
    useRoomStore.setState({
      planes: roomData.map((plane) => ({
        ...plane,
        semanticLabel: plane.semanticLabel,
      })),
    });
  }, [roomData]);

  // ============ Local -> Remote Sync ============

  // Helper to check if scene state matches last remote
  const isSceneUnchangedFromRemote = () => {
    const remote = lastRemoteScene.current;
    if (!remote) return false;
    const local = useSceneStore.getState();
    return JSON.stringify(local.lightPosition) === JSON.stringify(remote.lightPosition) &&
      JSON.stringify(local.content) === JSON.stringify(
        Object.fromEntries(
          Object.entries(remote.content).map(([id, obj]) => [
            id,
            convertConvexToSceneObj(obj as ConvexSceneObj),
          ])
        )
      );
  };

  // Debounced push functions
  const pushScene = useMemo(
    () =>
      debounce(
        () => {
          if (isSceneUnchangedFromRemote()) return;
          const state = useSceneStore.getState();
          mutateScene({
            projectId: PROJECT_ID,
            lightPosition: [...state.lightPosition],
            content: Object.fromEntries(
              Object.entries(state.content).map(([id, obj]) => [
                id,
                {
                  type: obj.type,
                  name: obj.name,
                  states: obj.states.map((s) => ({
                    id: s.id,
                    transform: {
                      position: [
                        s.transform.position[0],
                        s.transform.position[1],
                        s.transform.position[2],
                      ],
                      // Only take x, y, z - exclude Euler order string
                      rotation: [
                        s.transform.rotation[0],
                        s.transform.rotation[1],
                        s.transform.rotation[2],
                      ],
                      scale: [
                        s.transform.scale[0],
                        s.transform.scale[1],
                        s.transform.scale[2],
                      ],
                    },
                    trigger: s.trigger,
                    transitionTo: s.transitionTo,
                  })),
                },
              ])
            ),
          }).catch((err) => {
            console.error("Failed to sync scene:", err);
          });
        },
        DEBOUNCE_TIMING.DEBOUNCE_MS,
        { maxWait: DEBOUNCE_TIMING.MAX_WAIT_MS }
      ),
    [mutateScene]
  );

  // Helper to check if editor state matches last remote
  const isEditorUnchangedFromRemote = () => {
    const remote = lastRemoteEditor.current;
    if (!remote) return false;
    const local = useEditorStore.getState();
    return local.mode === remote.mode &&
      local.selectedObjId === remote.selectedObjId &&
      JSON.stringify(local.objStateIdxMap) === JSON.stringify(remote.objStateIdxMap) &&
      local.isHybrid === remote.isHybrid;
  };

  const pushEditor = useMemo(
    () =>
      debounce(
        () => {
          if (isEditorUnchangedFromRemote()) return;
          const state = useEditorStore.getState();
          mutateEditor({
            projectId: PROJECT_ID,
            mode: state.mode,
            selectedObjId: state.selectedObjId,
            objStateIdxMap: state.objStateIdxMap,
            isHybrid: state.isHybrid,
          }).catch((err) => {
            console.error("Failed to sync editor:", err);
          });
        },
        DEBOUNCE_TIMING.DEBOUNCE_MS,
        { maxWait: DEBOUNCE_TIMING.MAX_WAIT_MS }
      ),
    [mutateEditor]
  );

  // Helper to check if camera state matches last remote
  const isCameraUnchangedFromRemote = () => {
    const remote = lastRemoteCamera.current;
    if (!remote) return false;
    const local = cameraStore.getState();
    return (
      nearEqual(local.distance, remote.distance) &&
      nearEqual(local.yaw, remote.yaw) &&
      nearEqual(local.pitch, remote.pitch) &&
      arraysNearEqual([...local.origin], remote.origin as number[])
    );
  };

  const pushCamera = useMemo(
    () =>
      debounce(
        () => {
          if (isCameraUnchangedFromRemote()) return;
          const state = cameraStore.getState();
          mutateCamera({
            projectId: PROJECT_ID,
            distance: state.distance,
            yaw: state.yaw,
            pitch: state.pitch,
            origin: [...state.origin],
          }).catch((err) => {
            console.error("Failed to sync camera:", err);
          });
        },
        DEBOUNCE_TIMING.CAMERA_DEBOUNCE_MS,
        { maxWait: DEBOUNCE_TIMING.CAMERA_MAX_WAIT_MS }
      ),
    [mutateCamera]
  );

  // Subscribe to store changes and push to Convex
  useEffect(() => {
    const unsubScene = useSceneStore.subscribe(() => {
      pushScene();
    });
    const unsubEditor = useEditorStore.subscribe(() => {
      pushEditor();
    });
    const unsubCamera = cameraStore.subscribe(() => {
      pushCamera();
    });

    return () => {
      unsubScene();
      unsubEditor();
      unsubCamera();
      // Cancel any pending debounced mutations
      pushScene.cancel();
      pushEditor.cancel();
      pushCamera.cancel();
    };
  }, [pushScene, pushEditor, pushCamera]);

  // Room data push (one-shot, not realtime subscription)
  const pushRoom = useCallback(() => {
    const state = useRoomStore.getState();
    mutateRoom({
      projectId: PROJECT_ID,
      room: state.planes.map((p) => ({
        id: p.id,
        semanticLabel: p.semanticLabel,
        orientation: p.orientation,
        poseMatrix: p.poseMatrix,
        polygon: p.polygon,
      })),
    }).catch((err) => {
      console.error("Failed to sync room:", err);
    });
  }, [mutateRoom]);

  return { pushRoom };
}
