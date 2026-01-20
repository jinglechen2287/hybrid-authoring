import { produce } from "immer";
import type { Vector3Tuple } from "three";
import { useSceneStore } from "~/stores";
import type { SceneData, TriggerType } from "~/types";

/**
 * Adds a new object state after the current state index.
 * The new state clones the transform from the current state.
 * @param selectedObjId - The ID of the selected object
 * @param currentStateIdx - The current state index
 * @returns The new state index after insertion
 */
export function addObjState(
  selectedObjId: string,
  currentStateIdx: number,
): number {
  let newIdx = currentStateIdx;
  useSceneStore.setState(
    produce((sceneData: SceneData) => {
      const objStates = sceneData.content[selectedObjId]?.states;
      if (!objStates || objStates.length === 0) return;
      const base = objStates[currentStateIdx] ?? objStates[objStates.length - 1];
      const newState = {
        id: crypto.randomUUID(),
        transform: {
          position: [...base.transform.position] as Vector3Tuple,
          rotation: [...base.transform.rotation] as Vector3Tuple,
          scale: [...base.transform.scale] as Vector3Tuple,
        },
        trigger: "" as TriggerType,
        transitionTo: "",
      };
      objStates.splice(currentStateIdx + 1, 0, newState);
      newIdx = currentStateIdx + 1;
    }),
  );
  return newIdx;
}

/**
 * Removes the object state at the given index.
 * Will not remove if only one state remains.
 * @param selectedObjId - The ID of the selected object
 * @param currentStateIdx - The state index to remove
 * @returns The adjusted state index after removal
 */
export function removeObjState(
  selectedObjId: string,
  currentStateIdx: number,
): number {
  let nextStateIdx = currentStateIdx;
  useSceneStore.setState(
    produce((sceneData: SceneData) => {
      const objStates = sceneData.content[selectedObjId]?.states;
      if (!objStates || objStates.length <= 1) return;
      objStates.splice(currentStateIdx, 1);
      if (nextStateIdx >= objStates.length) {
        nextStateIdx = objStates.length - 1;
      }
    }),
  );
  return nextStateIdx;
}

/**
 * Gets the current state index for an object from the map.
 * @param objStateIdxMap - The map of object IDs to state indices
 * @param selectedObjId - The ID of the selected object
 * @returns The state index, defaulting to 0
 */
export function getObjStateIdx(
  objStateIdxMap: Record<string, number>,
  selectedObjId: string | undefined,
): number {
  if (!selectedObjId) return 0;
  return objStateIdxMap[selectedObjId] ?? 0;
}

/**
 * Returns a human-readable label for a state index.
 * @param index - The state index
 * @returns "Base State" for index 0, or "State N" for other indices
 */
export function getStateLabel(index: number): string {
  return index === 0 ? "Base State" : `State ${index}`;
}
