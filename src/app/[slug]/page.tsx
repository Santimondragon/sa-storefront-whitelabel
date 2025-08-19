import { notFound } from "next/navigation";
import { api } from "~/trpc/server";

export default async function Page({
  params,
}: {
  // In newer Next.js versions, params can be a Promise and must be awaited
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolved = (await params) as { slug: string };
  const handle = resolved.slug;
  const page = await api.page.getByHandle({ handle });
  if (!page) return notFound();

  const fields = page.fields;
  const name = fields.find((f) => f.key === "name")?.value ?? handle;
  const contentRaw = fields.find((f) => f.key === "content")?.value ?? "{}";
  let content: unknown;
  try {
    content = JSON.parse(contentRaw || "{}");
  } catch {
    content = contentRaw;
  }

  return (
    <main className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">{name}</h1>
      <pre className="p-4 bg-gray-50 border rounded text-sm overflow-auto">
        {JSON.stringify(content, null, 2)}
      </pre>
    </main>
  );
}
