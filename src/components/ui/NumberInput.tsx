import { NumberInput as ArkNumberInput } from "@ark-ui/react/number-input";
import { useVec3Input } from "~/contexts/Vec3InputContext";
import { useSceneStore } from "~/stores";
import type { ValueChangeDetails } from "node_modules/@ark-ui/react/dist/components/number-input/number-input";
import { produce } from "immer";

export default function NumberInput({
  coordinate,
}: {
  coordinate: "X" | "Y" | "Z";
}) {
  const { type } = useVec3Input();
  const store = useSceneStore();
  if (!store.selected) return null;
  const index = ["X", "Y", "Z"].indexOf(coordinate);
  const value = store[`${store.selected}Transformation`][type][index];

  const valueChangeHandler = (details: ValueChangeDetails) => {
    useSceneStore.setState(
      produce((draft) => {
        draft[`${store.selected}Transformation`][type][index] = parseFloat(
          details.value,
        );
      }),
    );
  };

  return (
    <ArkNumberInput.Root
      value={value.toFixed(2)}
      step={0.01}
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
