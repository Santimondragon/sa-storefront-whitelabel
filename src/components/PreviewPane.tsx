"use client";

import { api } from "~/trpc/react";

export default function PreviewPane() {
  const { data, isLoading, isError } = api.content.getHomepageContent.useQuery();

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="text-lg font-medium">Preview</h2>
      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {isError && <div className="text-sm text-red-500">Failed to load content</div>}
      {data && (
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium">Hero Title</div>
            <div className="text-base">{data.heroTitle || <span className="text-muted-foreground">(empty)</span>}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Hero Image</div>
            {data.heroImageUrl ? (
              <img src={data.heroImageUrl} alt="Hero" className="h-32 w-auto rounded border object-cover" />
            ) : (
              <div className="text-muted-foreground">(no image)</div>
            )}
          </div>
          <div>
            <div className="text-sm font-medium">Banner Text</div>
            <div className="text-base">{data.bannerText || <span className="text-muted-foreground">(empty)</span>}</div>
          </div>
        </div>
      )}
    </div>
  );
}
