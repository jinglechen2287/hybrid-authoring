import Section from "../layouts/Section";
import Select from "../ui/Select";

export default function BehaviorSection() {
  return (
    <Section title="Behavior">
      <Select label="trigger" items={["Click", "Hover Start", "Hover End", "Auto"]} />
      <Select label="transition to" items={["Base State", "State 1", "State 2", "State 3"]} />
    </Section>
  );
}
