import { Minus, Plus } from "lucide-react";
import { memo, useMemo } from "react";
import { useEditorStore, useSceneStore } from "~/stores";
import { addObjState, removeObjState, getObjStateIdx, getStateLabel } from "~/utils/stateOperations";
import Section from "../layouts/Section";

const StatesSection = memo(function StatesSection() {
  const selectedObjId = useEditorStore((s) => s.selectedObjId);
  const objStateIdxMap = useEditorStore((s) => s.objStateIdxMap);
  const setObjStateIdxMap = useEditorStore((s) => s.setObjStateIdxMap);
  const objStates = useSceneStore((s) =>
    selectedObjId ? (s.content[selectedObjId]?.states ?? []) : [],
  );
  const selectedObjStateIdx = getObjStateIdx(objStateIdxMap, selectedObjId);

  const canAdd = selectedObjId != null;

  const onAddObjState = () => {
    if (!selectedObjId) return;
    const newIdx = addObjState(selectedObjId, selectedObjStateIdx);
    setObjStateIdxMap(newIdx);
  };

  const onRemoveObjState = () => {
    if (!selectedObjId) return;
    const newIdx = removeObjState(selectedObjId, selectedObjStateIdx);
    setObjStateIdxMap(newIdx);
  };

  const onSelectObjState = (newObjStateIdx: number) => {
    setObjStateIdxMap(newObjStateIdx);
  };

  const items = useMemo(() => objStates ?? [], [objStates]);

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
        {items.map((state, i) => (
          <button
            key={state.id}
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
});

export default StatesSection;
