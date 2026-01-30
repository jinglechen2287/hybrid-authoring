import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSceneStore } from "~/stores/sceneStore";
import { useEditorStore } from "~/stores/editorStore";
import { useRoomStore } from "~/stores/roomStore";
import type { CoreEditorData, CameraData, RoomPlaneData } from "~/types";

// Mock convex hooks
const mockMutateScene = vi.fn();
const mockMutateEditor = vi.fn();
const mockMutateCamera = vi.fn();
const mockMutateRoom = vi.fn();

let mockSceneData: { lightPosition: number[]; content: Record<string, unknown> } | undefined;
let mockEditorData: CoreEditorData | undefined;
let mockCameraData: CameraData | undefined;
let mockRoomData: RoomPlaneData[] | undefined;

vi.mock("convex/react", () => ({
  useQuery: vi.fn((queryRef: unknown) => {
    // The queryRef is a FunctionReference object, check its name property
    const fnStr = JSON.stringify(queryRef);
    if (fnStr.includes("getScene")) return mockSceneData;
    if (fnStr.includes("getEditor")) return mockEditorData;
    if (fnStr.includes("getCamera")) return mockCameraData;
    if (fnStr.includes("getRoom")) return mockRoomData;
    return undefined;
  }),
  useMutation: vi.fn((mutationRef: unknown) => {
    const fnStr = JSON.stringify(mutationRef);
    if (fnStr.includes("updateScene")) return mockMutateScene;
    if (fnStr.includes("updateEditor")) return mockMutateEditor;
    if (fnStr.includes("updateCamera")) return mockMutateCamera;
    if (fnStr.includes("updateRoom")) return mockMutateRoom;
    return vi.fn();
  }),
}));

// Mock the api import
vi.mock("../../../convex/_generated/api", () => ({
  api: {
    projects: {
      getScene: { _functionRef: "getScene" },
      getEditor: { _functionRef: "getEditor" },
      getCamera: { _functionRef: "getCamera" },
      getRoom: { _functionRef: "getRoom" },
      updateScene: { _functionRef: "updateScene" },
      updateEditor: { _functionRef: "updateEditor" },
      updateCamera: { _functionRef: "updateCamera" },
      updateRoom: { _functionRef: "updateRoom" },
    },
  },
}));

// Mock the projectId
vi.mock("../projectId", () => ({
  PROJECT_ID: "test-project-id",
}));

// Re-import after mocking
import { useProjectSync } from "../hooks";

describe("useProjectSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSceneData = undefined;
    mockEditorData = undefined;
    mockCameraData = undefined;
    mockRoomData = undefined;

    // Reset stores
    useSceneStore.setState({
      lightPosition: [0.3, 0.3, 0.3],
      content: {},
    });
    useEditorStore.setState({
      mode: "edit",
      selectedObjId: undefined,
      objStateIdxMap: {},
      isHybrid: false,
    });
    useRoomStore.setState({ planes: [] });
  });

  describe("remote -> local sync", () => {
    it("applies scene data from Convex to Zustand store", async () => {
      mockSceneData = {
        lightPosition: [1, 2, 3],
        content: {
          obj1: {
            type: "cube" as const,
            name: "Test Cube",
            states: [],
          },
        },
      };

      renderHook(() => useProjectSync());

      await waitFor(() => {
        const state = useSceneStore.getState();
        expect(state.lightPosition).toEqual([1, 2, 3]);
        expect(state.content).toHaveProperty("obj1");
      });
    });

    it("applies editor data from Convex to Zustand store", async () => {
      mockEditorData = {
        mode: "play",
        selectedObjId: "obj1",
        objStateIdxMap: { obj1: 2 },
        isHybrid: true,
      };

      renderHook(() => useProjectSync());

      await waitFor(() => {
        const state = useEditorStore.getState();
        expect(state.mode).toBe("play");
        expect(state.selectedObjId).toBe("obj1");
        expect(state.isHybrid).toBe(true);
      });
    });

    it("applies room data from Convex to Zustand store", async () => {
      mockRoomData = [
        {
          id: "plane1",
          semanticLabel: "floor",
          orientation: "horizontal" as const,
          poseMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
          polygon: [{ x: 0, y: 0, z: 0 }],
        },
      ];

      renderHook(() => useProjectSync());

      await waitFor(() => {
        const state = useRoomStore.getState();
        expect(state.planes).toHaveLength(1);
        expect(state.planes[0].id).toBe("plane1");
      });
    });
  });

  describe("local -> remote sync", () => {
    it("pushes scene changes to Convex", async () => {
      mockSceneData = {
        lightPosition: [0, 0, 0],
        content: {},
      };

      renderHook(() => useProjectSync());

      // Wait for initial sync
      await waitFor(() => {
        expect(useSceneStore.getState().lightPosition).toEqual([0, 0, 0]);
      });

      // Modify store locally
      act(() => {
        useSceneStore.setState({ lightPosition: [5, 5, 5] });
      });

      // Wait for debounced mutation
      await waitFor(
        () => {
          expect(mockMutateScene).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });

    it("does not push when applying remote update (loop prevention)", async () => {
      mockSceneData = {
        lightPosition: [1, 2, 3],
        content: {},
      };

      renderHook(() => useProjectSync());

      // The remote data application should not trigger a mutation back
      await waitFor(() => {
        expect(useSceneStore.getState().lightPosition).toEqual([1, 2, 3]);
      });

      // Clear any initial calls
      mockMutateScene.mockClear();

      // Wait a bit to ensure no spurious mutations
      await new Promise((r) => setTimeout(r, 100));
      expect(mockMutateScene).not.toHaveBeenCalled();
    });
  });
});
