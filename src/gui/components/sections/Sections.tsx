import { memo } from "react";
import BehaviorSection from "./BehaviorSection";
import SelectionSection from "./SelectionSection";
import StatesSection from "./StatesSection";
import TransformSection from "./TransformSection";

const Sections = memo(function Sections() {
  return (
    <div className="flex flex-col gap-8">
      <SelectionSection />
      <StatesSection />
      <TransformSection />
      <BehaviorSection />
    </div>
  );
});

export default Sections;
