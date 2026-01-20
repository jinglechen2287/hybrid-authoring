import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSceneStore } from "~/stores/sceneStore";
import {
  addObjState,
  removeObjState,
  getObjStateIdx,
  getStateLabel,
} from "../stateOperations";

// Mock crypto.randomUUID for consistent test IDs
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-1234"),
});

describe("stateOperations", () => {
  const testObjId = "test-obj-1";

  beforeEach(() => {
    // Reset sceneStore with a test object that has one state
    useSceneStore.setState({
      lightPosition: [0.3, 0.3, 0.3],
      content: {
        [testObjId]: {
          type: "cube",
          name: "Test Cube",
          states: [
            {
              id: "state-0",
              transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
              trigger: "",
              transitionTo: "",
            },
          ],
        },
      },
    });
  });

  describe("addObjState", () => {
    it("adds a new state after the current state index", () => {
      const newIdx = addObjState(testObjId, 0);

      expect(newIdx).toBe(1);
      const states = useSceneStore.getState().content[testObjId]?.states;
      expect(states).toHaveLength(2);
    });

    it("clones the transform from the current state", () => {
      // First, set a custom transform on the base state
      useSceneStore.setState({
        lightPosition: [0.3, 0.3, 0.3],
        content: {
          [testObjId]: {
            type: "cube",
            name: "Test Cube",
            states: [
              {
                id: "state-0",
                transform: {
                  position: [1, 2, 3],
                  rotation: [0.1, 0.2, 0.3],
                  scale: [2, 2, 2],
                },
                trigger: "",
                transitionTo: "",
              },
            ],
          },
        },
      });

      addObjState(testObjId, 0);

      const states = useSceneStore.getState().content[testObjId]?.states;
      const newState = states?.[1];
      expect(newState?.transform.position).toEqual([1, 2, 3]);
      expect(newState?.transform.rotation).toEqual([0.1, 0.2, 0.3]);
      expect(newState?.transform.scale).toEqual([2, 2, 2]);
    });

    it("generates a unique ID using crypto.randomUUID", () => {
      addObjState(testObjId, 0);

      const states = useSceneStore.getState().content[testObjId]?.states;
      const newState = states?.[1];
      expect(newState?.id).toBe("test-uuid-1234");
      expect(crypto.randomUUID).toHaveBeenCalled();
    });

    it("inserts at the correct index when adding after a middle state", () => {
      // Setup: object with 3 states
      useSceneStore.setState({
        lightPosition: [0.3, 0.3, 0.3],
        content: {
          [testObjId]: {
            type: "cube",
            name: "Test Cube",
            states: [
              {
                id: "state-0",
                transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                trigger: "",
                transitionTo: "",
              },
              {
                id: "state-1",
                transform: { position: [1, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                trigger: "",
                transitionTo: "",
              },
              {
                id: "state-2",
                transform: { position: [2, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                trigger: "",
                transitionTo: "",
              },
            ],
          },
        },
      });

      // Add after state-1 (index 1)
      const newIdx = addObjState(testObjId, 1);

      expect(newIdx).toBe(2);
      const states = useSceneStore.getState().content[testObjId]?.states;
      expect(states).toHaveLength(4);
      expect(states?.[0].id).toBe("state-0");
      expect(states?.[1].id).toBe("state-1");
      expect(states?.[2].id).toBe("test-uuid-1234"); // New state inserted here
      expect(states?.[3].id).toBe("state-2");
    });

    it("initializes new state with empty trigger and transitionTo", () => {
      addObjState(testObjId, 0);

      const states = useSceneStore.getState().content[testObjId]?.states;
      const newState = states?.[1];
      expect(newState?.trigger).toBe("");
      expect(newState?.transitionTo).toBe("");
    });

    it("does not modify store if object has no states", () => {
      useSceneStore.setState({
        lightPosition: [0.3, 0.3, 0.3],
        content: {
          [testObjId]: {
            type: "cube",
            name: "Empty Cube",
            states: [],
          },
        },
      });

      const newIdx = addObjState(testObjId, 0);

      expect(newIdx).toBe(1); // Returns currentStateIdx + 1
      const states = useSceneStore.getState().content[testObjId]?.states;
      expect(states).toHaveLength(0); // No state was added
    });

    it("uses last state as base if currentStateIdx is out of bounds", () => {
      // Object has only 1 state but we request index 5
      addObjState(testObjId, 5);

      const states = useSceneStore.getState().content[testObjId]?.states;
      expect(states).toHaveLength(2);
      // New state should clone from state-0 (the last available state)
      expect(states?.[1]?.transform.position).toEqual([0, 0, 0]);
    });
  });

  describe("removeObjState", () => {
    beforeEach(() => {
      // Setup: object with 3 states
      useSceneStore.setState({
        lightPosition: [0.3, 0.3, 0.3],
        content: {
          [testObjId]: {
            type: "cube",
            name: "Test Cube",
            states: [
              {
                id: "state-0",
                transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                trigger: "",
                transitionTo: "",
              },
              {
                id: "state-1",
                transform: { position: [1, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                trigger: "",
                transitionTo: "",
              },
              {
                id: "state-2",
                transform: { position: [2, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                trigger: "",
                transitionTo: "",
              },
            ],
          },
        },
      });
    });

    it("removes state at the given index", () => {
      removeObjState(testObjId, 1);

      const states = useSceneStore.getState().content[testObjId]?.states;
      expect(states).toHaveLength(2);
      expect(states?.[0].id).toBe("state-0");
      expect(states?.[1].id).toBe("state-2");
    });

    it("returns the same index if not at end", () => {
      const newIdx = removeObjState(testObjId, 1);

      expect(newIdx).toBe(1); // Can still point to index 1 (now state-2)
    });

    it("adjusts index if removing the last state", () => {
      const newIdx = removeObjState(testObjId, 2);

      expect(newIdx).toBe(1); // Should adjust to point to new last state
    });

    it("prevents removal if only one state remains", () => {
      // First remove two states
      removeObjState(testObjId, 0);
      removeObjState(testObjId, 0);

      // Now try to remove the last state
      const statesBefore = useSceneStore.getState().content[testObjId]?.states;
      expect(statesBefore).toHaveLength(1);

      removeObjState(testObjId, 0);

      const statesAfter = useSceneStore.getState().content[testObjId]?.states;
      expect(statesAfter).toHaveLength(1); // Still 1 state, removal prevented
    });

    it("removes the first state correctly", () => {
      removeObjState(testObjId, 0);

      const states = useSceneStore.getState().content[testObjId]?.states;
      expect(states).toHaveLength(2);
      expect(states?.[0].id).toBe("state-1");
      expect(states?.[1].id).toBe("state-2");
    });
  });

  describe("getObjStateIdx", () => {
    it("returns 0 if selectedObjId is undefined", () => {
      const idx = getObjStateIdx({ "some-obj": 5 }, undefined);
      expect(idx).toBe(0);
    });

    it("returns 0 if selectedObjId is not in the map", () => {
      const idx = getObjStateIdx({}, "non-existent-obj");
      expect(idx).toBe(0);
    });

    it("returns the correct index from the map", () => {
      const idx = getObjStateIdx({ [testObjId]: 3 }, testObjId);
      expect(idx).toBe(3);
    });

    it("returns 0 for index 0 in the map", () => {
      const idx = getObjStateIdx({ [testObjId]: 0 }, testObjId);
      expect(idx).toBe(0);
    });
  });

  describe("getStateLabel", () => {
    it("returns 'Base State' for index 0", () => {
      expect(getStateLabel(0)).toBe("Base State");
    });

    it("returns 'State N' for index N > 0", () => {
      expect(getStateLabel(1)).toBe("State 1");
      expect(getStateLabel(2)).toBe("State 2");
      expect(getStateLabel(10)).toBe("State 10");
    });
  });
});
