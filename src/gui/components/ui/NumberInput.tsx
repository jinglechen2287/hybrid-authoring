import { NumberInput as ArkNumberInput } from "@ark-ui/react/number-input";
import { produce } from "immer";
import type { ValueChangeDetails } from "node_modules/@ark-ui/react/dist/components/number-input/number-input";
import { useCallback } from "react";
import { useVec3Input } from "~/gui/contexts/Vec3InputContext";
import { useEditorStore, useSceneStore } from "~/stores";
import type { SceneData } from "~/types";
import { degToRad, radToDeg } from "~/utils/angleConversion";

export default function NumberInput({
  coordinate,
}: {
  coordinate: "X" | "Y" | "Z";
}) {
  const { type } = useVec3Input();
  const sceneStore = useSceneStore();
  const editorStore = useEditorStore();
  const selectedObjId = editorStore.selectedObjId;
  const objStateIdxMap = editorStore.objStateIdxMap;
  const index = ["X", "Y", "Z"].indexOf(coordinate);
  const obj = selectedObjId ? sceneStore.content[selectedObjId] : undefined;
  const objStates = obj?.states ?? [];
  const objStateIdx = selectedObjId ? (objStateIdxMap[selectedObjId] ?? 0) : 0;
  const objState = objStates[objStateIdx] ?? objStates[0];
  const rawValue = objState?.transform[type][index];
  const isRotation = type === "rotation";
  const value = rawValue !== undefined && isRotation ? Math.round(radToDeg(rawValue)) : rawValue;

  const valueChangeHandler = useCallback(
    (details: ValueChangeDetails) => {
      if (!selectedObjId) return;
      useSceneStore.setState(
        produce((sceneData: SceneData) => {
          let value = parseFloat(details.value);
          if (isNaN(value)) value = 0;
          if (isRotation) value = degToRad(value);
          const target = sceneData.content[selectedObjId];
          if (!target) return;
          const objStates = target.states;
          if (!objStates || objStates.length === 0) return;
          const idx = Math.min(objStateIdx, objStates.length - 1);
          objStates[idx].transform[type][index] = value;
        }),
      );
    },
    [selectedObjId, objStateIdx, type, index, isRotation],
  );

  if (!selectedObjId || !obj || !objState || value === undefined) return null;

  return (
    <ArkNumberInput.Root
      value={value.toString()}
      formatOptions={{
        maximumFractionDigits: isRotation ? 0 : 2,
      }}
      step={isRotation ? 1 : 0.01}
      className="min-w-20"
      onValueChange={valueChangeHandler}
    >
      <ArkNumberInput.Control className="grid h-9 grid-cols-[1fr] grid-rows-1 overflow-hidden rounded-lg border border-neutral-200 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/50 dark:border-neutral-700 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/50">
        <div className="relative row-span-2">
          <ArkNumberInput.Scrubber className="absolute top-1/2 left-3 -translate-y-1/2 transform cursor-ew-resize text-neutral-400 dark:text-neutral-500">
            <span className="unselectable">{coordinate}</span>
          </ArkNumberInput.Scrubber>
          <ArkNumberInput.Input className="h-full w-full border-none bg-white py-1 pr-3 pl-10 font-medium text-neutral-900 outline-hidden focus:outline-hidden focus-visible:outline-hidden dark:bg-neutral-900 dark:text-neutral-100" />
        </div>
      </ArkNumberInput.Control>
    </ArkNumberInput.Root>
  );
}
