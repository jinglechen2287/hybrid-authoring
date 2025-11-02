import { produce } from "immer";
import { Minus, Plus } from "lucide-react";
import { useMemo } from "react";
import { useEditorStore, useSceneStore } from "~/stores";
import type { SceneData } from "~/types";
import Section from "../layouts/Section";

export default function StatesSection() {
  const selectedObjId = useEditorStore((s) => s.selectedObjId);
  const objStateIdxMap = useEditorStore((s) => s.objStateIdxMap);
  const setObjStateIdxMap = useEditorStore((s) => s.setObjStateIdxMap);
  const objStates = useSceneStore((s) =>
    selectedObjId ? (s.content[selectedObjId]?.states ?? []) : [],
  );
  const selectedObjStateIdx = selectedObjId
    ? (objStateIdxMap[selectedObjId] ?? 0)
    : 0;

  const canAdd = selectedObjId != null;

  const onAddObjState = () => {
    if (!selectedObjId) return;
    useSceneStore.setState(
      produce((sceneData: SceneData) => {
        const objStates = sceneData.content[selectedObjId]?.states;
        if (!objStates || objStates.length === 0) return;
        const base =
          objStates[selectedObjStateIdx] ?? objStates[objStates.length - 1];
        objStates.splice(selectedObjStateIdx + 1, 0, {
          position: [...base.position],
          rotation: [...base.rotation],
          scale: [...base.scale],
        });
      }),
    );
    setObjStateIdxMap(selectedObjStateIdx + 1);
  };

  const onRemoveObjState = () => {
    if (!selectedObjId) return;
    let nextObjStateIdx = selectedObjStateIdx;
    useSceneStore.setState(
      produce((sceneData: SceneData) => {
        const objStates = sceneData.content[selectedObjId]?.states;
        if (!objStates || objStates.length <= 1) return;
        objStates.splice(selectedObjStateIdx, 1);
        if (nextObjStateIdx >= objStates.length) {
          nextObjStateIdx = objStates.length - 1;
        }
      }),
    );
    setObjStateIdxMap(nextObjStateIdx);
  };

  const onSelectObjState = (newObjStateIdx: number) => {
    setObjStateIdxMap(newObjStateIdx);
  };

  const items = useMemo(() => objStates ?? [], [objStates]);

  const getStateLabel = (index: number) => {
    if (index === 0) return "Base State";
    return `State ${index}`;
  };

  return (
    <Section
      title="States"
      actions={
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-neutral-600 p-1 text-neutral-100 hover:bg-neutral-800 disabled:opacity-50"
            onClick={onAddObjState}
            disabled={!canAdd}
          >
            <Plus size={16} />
          </button>
          <button
            className="rounded-md border border-neutral-600 p-1 text-neutral-100 hover:bg-neutral-800 disabled:opacity-50"
            onClick={onRemoveObjState}
            disabled={!canAdd || items.length <= 1}
          >
            <Minus size={16} />
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            className={
              "w-full rounded-md px-3 py-2 text-left text-sm transition-colors " +
              (i === selectedObjStateIdx
                ? "bg-neutral-600 text-white"
                : "bg-neutral-800 text-neutral-100 hover:bg-neutral-700")
            }
            onClick={() => onSelectObjState(i)}
          >
            {getStateLabel(i)}
          </button>
        ))}
      </div>
    </Section>
  );
}
