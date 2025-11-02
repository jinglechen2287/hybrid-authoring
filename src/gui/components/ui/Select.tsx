import { Portal } from "@ark-ui/react/portal";
import {
  Select as ArkSelect,
  createListCollection,
} from "@ark-ui/react/select";
import { ChevronDownIcon } from "lucide-react";

export default function Select({
  label,
  placeholder,
  items,
  value,
  onValueChange,
}: {
  label: string;
  placeholder?: string;
  items: Array<string | { label: string; value: string }>;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const normalized = items.map((i) =>
    typeof i === "string" ? { label: i, value: i } : i,
  );
  const valueToLabel = new Map(normalized.map((i) => [i.value, i.label]));
  const collection = createListCollection({
    items: normalized.map((i) => i.value),
    itemToString: (value) => valueToLabel.get(String(value)) ?? String(value),
  });

  return (
    <ArkSelect.Root
      collection={collection}
      className="flex min-w-20 flex-col gap-2"
      value={value ? [value] : []}
      onValueChange={(details) => {
        const v = details.value?.[0];
        if (v != null) onValueChange?.(v);
      }}
    >
      <ArkSelect.Label className="text-md font-medium text-neutral-700 dark:text-neutral-400">
        {label}
      </ArkSelect.Label>
      <ArkSelect.Control>
        <ArkSelect.Trigger className="flex h-10 w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-400 dark:focus:border-neutral-400 dark:focus:ring-neutral-400">
          <ArkSelect.ValueText placeholder={placeholder ?? "-"} />
          <ArkSelect.Indicator>
            <ChevronDownIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
          </ArkSelect.Indicator>
        </ArkSelect.Trigger>
      </ArkSelect.Control>
      <Portal>
        <ArkSelect.Positioner>
          <ArkSelect.Content className="z-50 min-w-(--reference-width) rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
            <ArkSelect.ItemGroup>
              {normalized.map((item) => (
                <ArkSelect.Item
                  key={item.value}
                  item={item.value}
                  className="relative flex cursor-pointer items-center px-3 py-2 text-sm text-neutral-900 select-none data-highlighted:bg-neutral-100 data-[state=checked]:bg-neutral-50 dark:text-neutral-100 dark:data-highlighted:bg-neutral-700 dark:data-[state=checked]:bg-neutral-700"
                >
                  <ArkSelect.ItemText>{item.label}</ArkSelect.ItemText>
                  <ArkSelect.ItemIndicator className="absolute right-3 text-blue-600 dark:text-blue-400">
                    ✓
                  </ArkSelect.ItemIndicator>
                </ArkSelect.Item>
              ))}
            </ArkSelect.ItemGroup>
          </ArkSelect.Content>
        </ArkSelect.Positioner>
      </Portal>
      <ArkSelect.HiddenSelect />
    </ArkSelect.Root>
  );
}
