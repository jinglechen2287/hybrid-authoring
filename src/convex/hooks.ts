import { useQuery, useMutation } from "convex/react";
import { useEffect, useRef, useCallback } from "react";
import { api } from "../../convex/_generated/api";
import { useSceneStore } from "~/stores/sceneStore";
import { useEditorStore } from "~/stores/editorStore";
import { cameraStore } from "~/stores/cameraStore";
import { useRoomStore } from "~/stores/roomStore";
import { PROJECT_ID } from "./projectId";
import type { SceneObj, ObjState, Transform, TriggerType } from "~/types";

// Debounce timeout refs
type DebouncedFn = {
  timeoutId: ReturnType<typeof setTimeout> | null;
};

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
  // Ref counter to prevent sync loops (handles concurrent updates)
  const applyingRemoteCount = useRef(0);

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
    applyingRemoteCount.current++;
    useSceneStore.setState({
      lightPosition: sceneData.lightPosition as [number, number, number],
      content: Object.fromEntries(
        Object.entries(sceneData.content).map(([id, obj]) => [
          id,
          convertConvexToSceneObj(obj as ConvexSceneObj),
        ])
      ),
    });
    // Use microtask to ensure the counter is decremented after store update propagates
    queueMicrotask(() => {
      applyingRemoteCount.current--;
    });
  }, [sceneData]);

  // Apply editor data from Convex
  useEffect(() => {
    if (!editorData) return;
    applyingRemoteCount.current++;
    useEditorStore.setState({
      mode: editorData.mode,
      selectedObjId: editorData.selectedObjId,
      objStateIdxMap: editorData.objStateIdxMap,
      isHybrid: editorData.isHybrid,
    });
    queueMicrotask(() => {
      applyingRemoteCount.current--;
    });
  }, [editorData]);

  // Apply camera data from Convex
  useEffect(() => {
    if (!cameraData) return;
    applyingRemoteCount.current++;
    cameraStore.setState({
      distance: cameraData.distance,
      yaw: cameraData.yaw,
      pitch: cameraData.pitch,
      origin: cameraData.origin as [number, number, number],
    });
    queueMicrotask(() => {
      applyingRemoteCount.current--;
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

  // Debounce refs
  const sceneDebounce = useRef<DebouncedFn>({ timeoutId: null });
  const editorDebounce = useRef<DebouncedFn>({ timeoutId: null });
  const cameraDebounce = useRef<DebouncedFn>({ timeoutId: null });

  const pushScene = useCallback(() => {
    if (sceneDebounce.current.timeoutId) {
      clearTimeout(sceneDebounce.current.timeoutId);
    }
    sceneDebounce.current.timeoutId = setTimeout(() => {
      if (applyingRemoteCount.current > 0) return;
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
      });
    }, 50);
  }, [mutateScene]);

  const pushEditor = useCallback(() => {
    if (editorDebounce.current.timeoutId) {
      clearTimeout(editorDebounce.current.timeoutId);
    }
    editorDebounce.current.timeoutId = setTimeout(() => {
      if (applyingRemoteCount.current > 0) return;
      const state = useEditorStore.getState();
      mutateEditor({
        projectId: PROJECT_ID,
        mode: state.mode,
        selectedObjId: state.selectedObjId,
        objStateIdxMap: state.objStateIdxMap,
        isHybrid: state.isHybrid,
      });
    }, 50);
  }, [mutateEditor]);

  const pushCamera = useCallback(() => {
    if (cameraDebounce.current.timeoutId) {
      clearTimeout(cameraDebounce.current.timeoutId);
    }
    cameraDebounce.current.timeoutId = setTimeout(() => {
      if (applyingRemoteCount.current > 0) return;
      const state = cameraStore.getState();
      mutateCamera({
        projectId: PROJECT_ID,
        distance: state.distance,
        yaw: state.yaw,
        pitch: state.pitch,
        origin: [...state.origin],
      });
    }, 50);
  }, [mutateCamera]);

  // Subscribe to store changes and push to Convex
  useEffect(() => {
    // Capture refs for cleanup
    const sceneDebounceRef = sceneDebounce.current;
    const editorDebounceRef = editorDebounce.current;
    const cameraDebounceRef = cameraDebounce.current;

    const unsubScene = useSceneStore.subscribe(() => {
      if (applyingRemoteCount.current === 0) pushScene();
    });
    const unsubEditor = useEditorStore.subscribe(() => {
      if (applyingRemoteCount.current === 0) pushEditor();
    });
    const unsubCamera = cameraStore.subscribe(() => {
      if (applyingRemoteCount.current === 0) pushCamera();
    });

    return () => {
      unsubScene();
      unsubEditor();
      unsubCamera();
      // Clear any pending debounced mutations
      if (sceneDebounceRef.timeoutId) {
        clearTimeout(sceneDebounceRef.timeoutId);
      }
      if (editorDebounceRef.timeoutId) {
        clearTimeout(editorDebounceRef.timeoutId);
      }
      if (cameraDebounceRef.timeoutId) {
        clearTimeout(cameraDebounceRef.timeoutId);
      }
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
    });
  }, [mutateRoom]);

  return { pushRoom };
}
