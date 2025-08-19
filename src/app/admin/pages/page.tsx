"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPages() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  // Temporary: allow initializing the custom_page metaobject definition
  const ensureDefinition = api.page.ensureDefinition.useMutation();

  // List existing pages
  const pagesQuery = api.page.list.useQuery();

  const createPage = api.page.create.useMutation({
    onSuccess: (_data, vars) => {
      router.push(`/admin/pages/${vars.slug}`);
    },
    onError: (e) => alert(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) {
      alert("Title and slug are required");
      return;
    }
    createPage.mutate({ title, slug, sections: [] });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin: Pages</h1>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => ensureDefinition.mutate()}
          className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50"
          disabled={ensureDefinition.isPending}
        >
          {ensureDefinition.isPending ? "Initializing..." : "Initialize Page Definition"}
        </button>
        {ensureDefinition.isSuccess && (
          <span className="text-green-700 text-sm">Definition ensured.</span>
        )}
        {ensureDefinition.isError && (
          <span className="text-red-700 text-sm">{ensureDefinition.error.message}</span>
        )}
      </div>

      <form onSubmit={submit} className="grid gap-3 max-w-xl">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Title</span>
          <input
            className="border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Slug</span>
          <input
            className="border rounded px-3 py-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. home"
          />
        </label>
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={createPage.isPending}
        >
          {createPage.isPending ? "Creating..." : "Create Page"}
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Existing Pages</h2>
        {pagesQuery.isLoading && <p className="text-sm text-gray-600">Loading...</p>}
        {pagesQuery.isError && (
          <p className="text-sm text-red-700">{pagesQuery.error.message}</p>
        )}
        {pagesQuery.isSuccess && (
          <ul className="divide-y border rounded">
            {pagesQuery.data.length === 0 && (
              <li className="p-3 text-sm text-gray-600">No pages yet.</li>
            )}
            {pagesQuery.data.map((p) => {
              const titleField = p.fields.find((f) => f.key === "title")?.value ?? "Untitled";
              const slugField = p.fields.find((f) => f.key === "slug")?.value ?? p.handle;
              return (
                <li key={p.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{titleField}</div>
                    <div className="text-xs text-gray-600 truncate">/{slugField}</div>
                  </div>
                  <Link
                    href={`/admin/pages/${slugField}`}
                    className="text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Edit
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
