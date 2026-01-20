import { useEditorStore, useSceneStore } from "~/stores";
import { produce } from "immer";
import { memo } from "react";
import type { SceneData } from "~/types";

export const TextInput = memo(function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-20">
      <div className="grid h-9 grid-cols-[1fr] grid-rows-1 overflow-hidden rounded-lg border border-neutral-200 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/50 dark:border-neutral-700 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/50">
        <div className="relative row-span-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-full w-full border-none bg-white px-3 py-1 font-medium text-neutral-900 outline-hidden focus:outline-hidden focus-visible:outline-hidden dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>
    </div>
  );
});

export function NameInput() {
  const selectedObjId = useEditorStore((s) => s.selectedObjId);
  const name = useSceneStore((s) =>
    selectedObjId ? (s.content[selectedObjId]?.name ?? "") : "",
  );

  const updateName = (value: string) => {
    if (!selectedObjId) return;
    useSceneStore.setState(
      produce((sceneData: SceneData) => {
        const target = sceneData.content[selectedObjId];
        if (!target) return;
        target.name = value;
      }),
    );
  };
  return <TextInput value={name} onChange={updateName} />;
}
