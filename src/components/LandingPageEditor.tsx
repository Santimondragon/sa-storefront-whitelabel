"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

export default function LandingPageEditor() {
  const utils = api.useUtils();
  const pagesQuery = api.content.getLandingPages.useQuery();

  const [selectedPageId, setSelectedPageId] = useState<string | undefined>();

  const contentQuery = api.content.getLandingPageContent.useQuery(
    { pageId: selectedPageId ?? "" },
    { enabled: !!selectedPageId },
  );

  const updateMutation = api.content.updateLandingPageContent.useMutation({
    onSuccess: async () => {
      if (selectedPageId) await utils.content.getLandingPageContent.invalidate({ pageId: selectedPageId });
    },
  });

  const [html, setHtml] = useState("");

  useEffect(() => {
    if (contentQuery.data) setHtml(contentQuery.data.contentHtml ?? "");
  }, [contentQuery.data]);

  async function onSave() {
    if (!selectedPageId) return;
    await updateMutation.mutateAsync({ pageId: selectedPageId, contentHtml: html });
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="text-lg font-medium">Landing Pages</h2>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Select Page</label>
        <select
          className="w-full rounded border px-3 py-2"
          value={selectedPageId ?? ""}
          onChange={(e) => setSelectedPageId(e.target.value || undefined)}
        >
          <option value="" disabled>
            {pagesQuery.isLoading ? "Loading pages…" : "Choose a page"}
          </option>
          {pagesQuery.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.handle})
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Content (HTML)</label>
        <textarea
          className="min-h-48 w-full rounded border px-3 py-2 font-mono"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder="<p>Enter HTML content…</p>"
        />
      </div>

      <div className="pt-2">
        <button
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
          onClick={onSave}
          disabled={!selectedPageId || updateMutation.isPending}
        >
          {updateMutation.isPending ? "Saving…" : "Save Landing Page"}
        </button>
      </div>
    </div>
  );
}
