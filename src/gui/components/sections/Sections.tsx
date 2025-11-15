import TransformSection from "./TransformSection";
import StatesSection from "./StatesSection";
import BehaviorSection from "./BehaviorSection";

export default function Sections() {
//   TODO: some types of text input?
    return (
    <div className="flex flex-col gap-8">
      <StatesSection />
      <TransformSection />
      <BehaviorSection />
    </div>
  );
}
