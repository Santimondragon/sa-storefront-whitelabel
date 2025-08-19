"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

export default function PageAdminClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  const utils = api.useUtils();
  const createPage = api.page.create.useMutation({
    onSuccess: (_data, vars) => {
      // Navigate to editor for the new page
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
    </div>
  );
}
