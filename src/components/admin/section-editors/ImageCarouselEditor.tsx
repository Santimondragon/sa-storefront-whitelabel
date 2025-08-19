"use client";

import { useCallback, useState } from "react";
import { api } from "~/trpc/react";

export type ImageCarouselFields = {
  images: string; // comma-separated URLs or file ids
};

export function ImageCarouselEditor({
  sectionId,
  initial,
  onUpdated,
}: {
  sectionId: string;
  initial: Partial<ImageCarouselFields>;
  onUpdated?: () => void;
}) {
  const [fields, setFields] = useState<ImageCarouselFields>({
    images: initial.images ?? "",
  });

  const updateSection = api.section.update.useMutation();

  const onChange = useCallback(
    (value: string) => setFields({ images: value }),
    []
  );

  const save = async () => {
    await updateSection.mutateAsync({
      id: sectionId,
      fields: [{ key: "images", value: fields.images }],
    });
    onUpdated?.();
  };

  return (
    <div className="grid gap-2">
      <textarea
        className="border rounded px-3 py-2"
        placeholder="Comma-separated image URLs"
        rows={3}
        value={fields.images}
        onChange={(e) => onChange(e.target.value)}
      />
      <div>
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

export default ImageCarouselEditor;
