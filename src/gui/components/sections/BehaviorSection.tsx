import { produce } from "immer";
import { useMemo } from "react";
import { useEditorStore, useSceneStore } from "~/stores";
import type { SceneData, TriggerType } from "~/types";
import Section from "../layouts/Section";
import Select from "../ui/Select";
import { getObjStateIdx } from "~/utils/stateOperations";

export default function BehaviorSection() {
  const selectedObjId = useEditorStore((s) => s.selectedObjId);
  const objStateIdxMap = useEditorStore((s) => s.objStateIdxMap);
  const objStates = useSceneStore((s) =>
    selectedObjId ? s.content[selectedObjId]?.states ?? [] : [],
  );
  const selectedObjStateIdx = getObjStateIdx(objStateIdxMap, selectedObjId);
  const current = objStates[selectedObjStateIdx];

  const triggerItems = useMemo(
    () => [
      { label: "None", value: "" },
      { label: "Click", value: "click" },
      { label: "Hover Start", value: "hoverStart" },
      { label: "Hover End", value: "hoverEnd" },
      { label: "Auto", value: "auto" },
    ],
    [],
  );

  const transitionItems = useMemo(() => {
    const items = [{ label: "None", value: "" }];
    for (let i = 0; i < objStates.length; i++) {
      const state = objStates[i];
      items.push({
        label: i === 0 ? "Base State" : `State ${i}`,
        value: state.id,
      });
    }
    return items;
  }, [objStates]);

  const setTrigger = (value: string) => {
    if (!selectedObjId) return;
    useSceneStore.setState(
      produce((scene: SceneData) => {
        const states = scene.content[selectedObjId]?.states;
        if (!states || !states[selectedObjStateIdx]) return;
        states[selectedObjStateIdx].trigger = value as TriggerType;
      }),
    );
  };

  const setTransitionTo = (value: string) => {
    if (!selectedObjId) return;
    useSceneStore.setState(
      produce((scene: SceneData) => {
        const states = scene.content[selectedObjId]?.states;
        if (!states || !states[selectedObjStateIdx]) return;
        states[selectedObjStateIdx].transitionTo = value;
      }),
    );
  };

  return (
    <Section title="Behavior">
      <Select
        label="trigger"
        items={triggerItems}
        value={current?.trigger ?? ""}
        onValueChange={setTrigger}
      />
      <Select
        label="transition to"
        items={transitionItems}
        value={current?.transitionTo ?? ""}
        onValueChange={setTransitionTo}
      />
    </Section>
  );
}
