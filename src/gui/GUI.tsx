import Tabs from "~/gui/components/sections/Tabs";
import { useModeStore, useSceneStore } from "~/stores";

export default function GUI() {
  const selected = useSceneStore((state) => state.selected);
  const mode = useModeStore((state) => state.mode);
  return (
    <section className="h-full w-1/3 min-w-96 bg-neutral-900 p-4">
      {selected && mode === "edit" && <Tabs />}
      {!selected && mode === "edit" && (
        <p className="text-white">Select an object</p>
      )}
      {mode === "play" && <p className="text-white">Play mode</p>}
    </section>
  );
}
