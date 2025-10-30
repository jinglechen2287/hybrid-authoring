import { Tabs } from "@ark-ui/react/tabs";
import { useEditorStore, useSceneStore } from "~/stores";
import Animation from "./Animation";
import Transform from "./Transform";

const tabs = [
  {
    value: "property",
    label: "Proterty",
    content: <Transform />,
  },
  {
    value: "animation",
    label: "Animation",
    content: <Animation />,
  },
  {
    value: "interaction",
    label: "Interaction",
    content: "Needs implementation",
  },
];

export default function TabsUnderline() {
  const setIsAuthoringAnimation = useEditorStore(
    (s) => s.setIsAuthoringAnimation,
  );
  return (
    <Tabs.Root
      defaultValue="property"
      className="flex w-full flex-col"
      onValueChange={(details) => {
        if (details.value === "property") {
          useSceneStore.setState({ selectedKeyframe: 0 });
        }
        if (details.value === "animation") {
          setIsAuthoringAnimation(true);
        } else {
          setIsAuthoringAnimation(false);
        }
      }}
    >
      <Tabs.List className="relative mb-4 flex w-full justify-between border-b border-neutral-200 dark:border-neutral-700">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className="relative w-fit border-b-2 border-transparent px-4 py-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700 data-selected:border-neutral-900 data-selected:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 dark:data-selected:border-neutral-100 dark:data-selected:text-neutral-100"
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {tabs.map((tab) => (
        <Tabs.Content
          key={tab.value}
          value={tab.value}
          className="text-neutral-600 dark:text-neutral-300"
        >
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
