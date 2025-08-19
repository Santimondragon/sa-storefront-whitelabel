"use client";

import { useCallback, useState } from "react";
import { api } from "~/trpc/react";

export type ThreeColumnFields = {
  column1: string;
  column2: string;
  column3: string;
};

export function ThreeColumnContentEditor({
  sectionId,
  initial,
  onUpdated,
}: {
  sectionId: string;
  initial: Partial<ThreeColumnFields>;
  onUpdated?: () => void;
}) {
  const [fields, setFields] = useState<ThreeColumnFields>({
    column1: initial.column1 ?? "",
    column2: initial.column2 ?? "",
    column3: initial.column3 ?? "",
  });

  const updateSection = api.section.update.useMutation();

  const onChange = useCallback(
    (key: keyof ThreeColumnFields, value: string) =>
      setFields((prev) => ({ ...prev, [key]: value })),
    []
  );

  const save = async () => {
    await updateSection.mutateAsync({
      id: sectionId,
      fields: Object.entries(fields).map(([key, value]) => ({ key, value })),
    });
    onUpdated?.();
  };

  return (
    <div className="grid gap-2 md:grid-cols-3">
      {(["column1", "column2", "column3"] as const).map((key) => (
        <input
          key={key}
          className="border rounded px-3 py-2"
          placeholder={key}
          value={fields[key]}
          onChange={(e) => onChange(key, e.target.value)}
        />
      ))}
      <div className="md:col-span-3">
        <button
          className="px-3 py-1 rounded border"
          onClick={() => void save()}
          disabled={updateSection.isPending}
        >
          {updateSection.isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export default ThreeColumnContentEditor;
