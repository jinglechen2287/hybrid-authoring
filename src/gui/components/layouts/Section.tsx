import { memo } from "react";

const Section = memo(function Section({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-700 dark:text-neutral-300">{title}</h2>
        {actions}
      </div>
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
});

export default Section;