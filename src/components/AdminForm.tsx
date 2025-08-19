"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "~/trpc/react";

export default function AdminForm() {
  const utils = api.useUtils();
  const { data, isLoading, isError } = api.content.getHomepageContent.useQuery();
  const mutation = api.content.updateHomepageContent.useMutation({
    onSuccess: async () => {
      await utils.content.getHomepageContent.invalidate();
      setSelectedFile(undefined);
      setPreviewUrl(undefined);
    },
  });

  const [heroTitle, setHeroTitle] = useState("");
  const [bannerText, setBannerText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();

  useEffect(() => {
    if (data) {
      setHeroTitle(data.heroTitle ?? "");
      setBannerText(data.bannerText ?? "");
      setPreviewUrl(data.heroImageUrl ?? undefined);
    }
  }, [data]);

  const heroImagePayload = useMemo(async () => {
    if (!selectedFile) return undefined;
    const base64 = await fileToBase64(selectedFile);
    return { filename: selectedFile.name, mimeType: selectedFile.type, base64 } as const;
  }, [selectedFile]);

  async function onSave() {
    const image = selectedFile ? await heroImagePayload : undefined;
    await mutation.mutateAsync({ heroTitle, bannerText, heroImage: image });
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setSelectedFile(f);
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    }
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading homepage content…</div>;
  if (isError) return <div className="text-sm text-red-500">Failed to load homepage content</div>;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="text-lg font-medium">Homepage Content</h2>

      <div className="grid gap-3">
        <label className="text-sm font-medium">Hero Title</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={heroTitle}
          onChange={(e) => setHeroTitle(e.target.value)}
          placeholder="Enter hero title"
        />
      </div>

      <div className="grid gap-3">
        <label className="text-sm font-medium">Hero Image</label>
        <input type="file" accept="image/*" onChange={onFileChange} />
        {previewUrl ? (
          <img src={previewUrl} alt="Hero preview" className="h-32 w-auto rounded border object-cover" />
        ) : null}
        {!selectedFile && data?.heroImageUrl ? (
          <div className="text-xs text-muted-foreground">Current: {data.heroImageUrl}</div>
        ) : null}
      </div>

      <div className="grid gap-3">
        <label className="text-sm font-medium">Banner Text</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={bannerText}
          onChange={(e) => setBannerText(e.target.value)}
          placeholder="Enter banner text"
        />
      </div>

      <div className="pt-2">
        <button
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
          onClick={onSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving…" : "Save Homepage"}
        </button>
      </div>
    </div>
  );
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}
