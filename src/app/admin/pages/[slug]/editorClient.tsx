"use client";

import { api } from "~/trpc/react";
import Link from "next/link";

export default function EditorClient({ slug }: { slug: string }) {
  const pageQuery = api.page.getByHandle.useQuery({ handle: slug });

  const name = pageQuery.data?.fields.find((f) => f.key === "name")?.value ?? slug;
  const contentRaw = pageQuery.data?.fields.find((f) => f.key === "content")?.value ?? "{}";
  let content: unknown = {};
  try {
    content = JSON.parse(contentRaw || "{}");
  } catch {
    content = contentRaw;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Page: {name}</h1>
        <Link href={`/${slug}`} className="text-blue-600 underline">
          View public page
        </Link>
      </div>
      {pageQuery.isLoading && <p className="text-sm text-gray-600">Loading...</p>}
      {pageQuery.isError && <p className="text-sm text-red-700">{pageQuery.error.message}</p>}
      {pageQuery.isSuccess && (
        <pre className="p-4 bg-gray-50 border rounded text-sm overflow-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      )}
    </div>
  );
}
