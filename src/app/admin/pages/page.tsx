import Link from "next/link";
import { revalidatePath } from "next/cache";
import { api } from "~/trpc/server";
import { EyeIcon, Trash2Icon } from "lucide-react";
import { Button } from "~/components/ui/button";

async function createPageAction(formData: FormData) {
  "use server";
  const name = (formData.get("name") ?? "").toString().trim();
  if (!name) return;

  const blankPage = {
    sections: [],
    data: {},
  };

  await api.page.create({ name, content: blankPage });
  revalidatePath("/admin/pages");
}

async function deletePageAction(formData: FormData) {
  "use server";
  const id = (formData.get("id") ?? "").toString();
  if (!id) return;
  await api.page.delete({ id });
  revalidatePath("/admin/pages");
}

export default async function AdminPages() {
  const pages = await api.page.list({ first: 50 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin: Pages</h1>

      <form action={createPageAction} className="grid gap-3 max-w-xl">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Name</span>
          <input
            className="border rounded px-3 py-2"
            name="name"
            placeholder="Page name"
          />
        </label>
        <Button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Create Page
        </Button>
      </form>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Existing Pages</h2>
        <ul className="divide-y border rounded">
          {pages.length === 0 && (
            <li className="p-3 text-sm text-gray-600">No pages yet.</li>
          )}
          {pages.map((p) => {
            const nameField = p.fields.find((f) => f.key === "name")?.value ?? "Untitled";
            return (
              <li key={p.id} className="flex w-full items-center pr-3">
                <Link
                  className="p-3 flex items-center justify-between gap-3 flex-1 hover:underline"
                  href={`/admin/pages/${p.handle}`}
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{nameField}</div>
                    <div className="text-xs text-gray-600 truncate">/{p.handle}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <form action={deletePageAction} id={p.id}>
                      <input type="hidden" name="id" value={p.id} />
                    </form>
                  </div>
                </Link>
                <Button
                  className="text-red-600 hover:text-red-700"
                  type="submit"
                  title="Delete page"
                  variant="ghost"
                  form={p.id}
                >
                  <Trash2Icon />
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
