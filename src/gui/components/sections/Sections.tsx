import TransformSection from "./TransformSection";
import StatesSection from "./StatesSection";
import BehaviorSection from "./BehaviorSection";

export default function Sections() {
  return (
    <div className="flex flex-col gap-8">
      <TransformSection />
      <BehaviorSection />
      <StatesSection />
    </div>
  );
}
