"use client";

import { useCallback, useState } from "react";
import { api } from "~/trpc/react";

export type HeroImageFields = {
  heading: string;
  subheading: string;
  image: string; // file id or URL
  cta_label: string;
  cta_link: string;
};

export function HeroImageEditor({
  sectionId,
  initial,
  onUpdated,
}: {
  sectionId: string;
  initial: Partial<HeroImageFields>;
  onUpdated?: () => void;
}) {
  const [fields, setFields] = useState<HeroImageFields>({
    heading: initial.heading ?? "",
    subheading: initial.subheading ?? "",
    image: initial.image ?? "",
    cta_label: initial.cta_label ?? "",
    cta_link: initial.cta_link ?? "",
  });

  const updateSection = api.section.update.useMutation();
  const uploadImage = api.section.uploadImage?.useMutation
    ? api.section.uploadImage.useMutation()
    : (undefined as unknown as {
        mutateAsync: (args: {
          filename: string;
          mimeType: string;
          base64: string;
          fileSize: number;
        }) => Promise<{ fileId: string }>;
        isPending: boolean;
      });
  const updateFieldRef = api.section.updateFieldReference?.useMutation
    ? api.section.updateFieldReference.useMutation()
    : (undefined as unknown as {
        mutateAsync: (args: { id: string; key: string; fileId: string }) => Promise<unknown>;
        isPending: boolean;
      });

  const onChange = useCallback(
    (key: keyof HeroImageFields, value: string) =>
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

  const onUpload = async (file: File) => {
    if (!uploadImage || !updateFieldRef) return;

    const reader = new FileReader();
    const base64: string = await new Promise((resolve, reject) => {
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = () => {
        const res = reader.result as string; // data:*/*;base64,....
        const comma = res.indexOf(",");
        resolve(res.slice(comma + 1));
      };
      reader.readAsDataURL(file);
    });

    const uploaded = await uploadImage.mutateAsync({
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      base64,
      fileSize: file.size,
    });

    await updateFieldRef.mutateAsync({ id: sectionId, key: "image", fileId: uploaded.fileId });
    setFields((prev) => ({ ...prev, image: uploaded.fileId }));
    onUpdated?.();
  };

  return (
    <div className="grid gap-2">
      <input
        className="border rounded px-3 py-2"
        placeholder="Heading"
        value={fields.heading}
        onChange={(e) => onChange("heading", e.target.value)}
      />
      <input
        className="border rounded px-3 py-2"
        placeholder="Subheading"
        value={fields.subheading}
        onChange={(e) => onChange("subheading", e.target.value)}
      />
      <div className="grid gap-2 md:grid-cols-2 items-center">
        <input
          className="border rounded px-3 py-2"
          placeholder="Image (file ID or URL)"
          value={fields.image}
          onChange={(e) => onChange("image", e.target.value)}
        />
        <label className="text-sm text-gray-700">
          Upload image
          <input
            type="file"
            accept="image/*"
            className="block mt-1"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
            }}
          />
        </label>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <input
          className="border rounded px-3 py-2"
          placeholder="CTA Label"
          value={fields.cta_label}
          onChange={(e) => onChange("cta_label", e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="CTA Link (URL)"
          value={fields.cta_link}
          onChange={(e) => onChange("cta_link", e.target.value)}
        />
      </div>
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

export default HeroImageEditor;
