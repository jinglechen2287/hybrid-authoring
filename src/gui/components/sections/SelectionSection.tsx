import { memo } from "react";
import Section from "../layouts/Section";
import { NameInput } from "../ui/TextInput";

const SelectionSection = memo(function SelectionSection() {
  return (
    <Section title="Name">
      <NameInput />
    </Section>
  );
});

export default SelectionSection;
