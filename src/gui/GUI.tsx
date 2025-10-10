import Tabs from "~/gui/components/sections/Tabs";
import { useSceneStore } from "~/stores";

export default function GUI() {
  const selected = useSceneStore((state) => state.selected);
  return (
    <section className="h-full w-1/3 min-w-96 bg-neutral-900 p-4">
      {selected && <Tabs />}
      {!selected && <p className="text-white">Select an object</p>}
    </section>
  );
}
