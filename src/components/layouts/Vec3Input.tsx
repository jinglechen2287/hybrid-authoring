import NumberInput from "../ui/NumberInput";
import { useVec3Input } from "~/contexts/Vec3InputContext";

export default function Vec3Input() {
  const { type } = useVec3Input();
  return (
    <div className="flex flex-col gap-2">
      <label className="text-md font-medium text-neutral-700 dark:text-neutral-300">
        {type}
      </label>
      <div className="flex flex-row gap-2">
        <NumberInput coordinate="X" />
        <NumberInput coordinate="Y" />
        <NumberInput coordinate="Z" />
      </div>
    </div>
  );
}
