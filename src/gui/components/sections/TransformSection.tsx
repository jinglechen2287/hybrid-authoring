import { memo } from "react";
import Vec3InputContextProvider from "~/gui/contexts/Vec3InputContextProvider";
import Section from "../layouts/Section";
import Vec3Input from "../layouts/Vec3Input";

const TransformSection = memo(function TransformSection() {
  return (
    <Section title="Transform">
      <Vec3InputContextProvider type="position">
        <Vec3Input />
      </Vec3InputContextProvider>
      <Vec3InputContextProvider type="rotation">
        <Vec3Input />
      </Vec3InputContextProvider>
      <Vec3InputContextProvider type="scale">
        <Vec3Input />
      </Vec3InputContextProvider>
    </Section>
  );
});

export default TransformSection;
