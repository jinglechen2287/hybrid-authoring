import Tabs from "~/gui/components/sections/Tabs";
import { useEditorStore } from "~/stores";

export default function GUI() {
  const selectedObjId = useEditorStore((state) => state.selectedObjId);
  const mode = useEditorStore((state) => state.mode);
  return (
    <section className="h-full w-1/3 min-w-96 bg-neutral-900 p-4">
      {selectedObjId && mode === "edit" && <Tabs />}
      {!selectedObjId && mode === "edit" && (
        <p className="text-white">Select an object</p>
      )}
      {mode === "play" && <p className="text-white">Play mode</p>}
    </section>
  );
}
