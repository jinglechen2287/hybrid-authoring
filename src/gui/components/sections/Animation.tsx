import { produce } from "immer";
import { Minus, Plus } from "lucide-react";
import { useMemo } from "react";
import { useSceneStore } from "~/stores";
import type { SceneStore } from "~/types";
import Transform from "./Transform";

export default function Animation() {
  const selected = useSceneStore((s) => s.selected);
  const selectedKeyframe = useSceneStore((s) => s.selectedKeyframe);
  const keyframes = useSceneStore((s) =>
    selected ? (s as SceneStore)[`${selected}Transformation`] : [],
  );

  const canAdd = selected != null;

  const onAddKeyframe = () => {
    if (!selected) return;
    useSceneStore.setState(
      produce((draft: SceneStore) => {
        const arr = draft[`${selected}Transformation`];
        const base = arr[selectedKeyframe] ?? arr[arr.length - 1];
        arr.splice(selectedKeyframe + 1, 0, {
          position: [...base.position],
          rotation: [...base.rotation],
          scale: [...base.scale],
        });
        draft.selectedKeyframe = selectedKeyframe + 1;
      }),
    );
  };

  const onRemoveKeyframe = () => {
    if (!selected) return;
    useSceneStore.setState(
      produce((draft: SceneStore) => {
        const arr = draft[`${selected}Transformation`];
        if (arr.length <= 1) return;
        arr.splice(selectedKeyframe, 1);
        if (draft.selectedKeyframe >= arr.length) {
          draft.selectedKeyframe = arr.length - 1;
        }
      }),
    );
  };

  const onSelectKeyframe = (index: number) => {
    useSceneStore.setState({ selectedKeyframe: index });
  };

  const items = useMemo(() => keyframes ?? [], [keyframes]);

  return (
    <>
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-md text-neutral-300">keyframes</p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-neutral-600 px-1 py-1 text-neutral-100 hover:bg-neutral-800 disabled:opacity-50"
              onClick={onAddKeyframe}
              disabled={!canAdd}
            >
              <Plus />
            </button>
            <button
              className="rounded-md border border-neutral-600 px-1 py-1 text-neutral-100 hover:bg-neutral-800 disabled:opacity-50"
              onClick={onRemoveKeyframe}
              disabled={!canAdd || items.length <= 1}
            >
              <Minus />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              className={
                "rounded-md px-2 py-2 text-center text-sm " +
                (i === selectedKeyframe
                  ? "bg-neutral-200 text-neutral-900"
                  : "bg-neutral-800 text-neutral-100 hover:bg-neutral-700")
              }
              onClick={() => onSelectKeyframe(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>
      <Transform />
    </>
  );
}
