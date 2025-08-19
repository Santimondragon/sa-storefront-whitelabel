"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";
import HeroImageEditor from "~/components/admin/section-editors/HeroImageEditor";
import ThreeColumnContentEditor from "~/components/admin/section-editors/ThreeColumnContentEditor";
import ImageCarouselEditor from "~/components/admin/section-editors/ImageCarouselEditor";

// Helpers
function fieldsArrayToObject(fields: Array<{ key: string; value: string | null }>) {
  const obj: Record<string, string> = {};
  for (const f of fields) obj[f.key] = f.value ?? "";
  return obj;
}

function objectToFieldsArray(obj: Record<string, string>) {
  return Object.entries(obj).map(([key, value]) => ({ key, value }));
}

const SECTION_TYPES = [
  { value: "hero_image", label: "Hero Image" },
  { value: "three_column_content", label: "Three Column Content" },
  { value: "image_carousel", label: "Image Carousel" },
] as const;

type EditableSection = {
  id: string;
  type: string;
  fields: Record<string, string>;
};

export default function EditorClient({ slug }: { slug: string }) {
  const pageQuery = api.page.getBySlug.useQuery({ slug });
  const updateSections = api.page.updateSections.useMutation();
  const createSection = api.section.create.useMutation();
  // Section-specific updates (fields, uploads) are handled inside section editor components
  // Temporary: allow initializing hero_image metaobject definition
  const ensureHeroDefinition = api.section.ensureHeroDefinition?.useMutation
    ? api.section.ensureHeroDefinition.useMutation()
    : (undefined as unknown as { mutate: () => void; isPending: boolean; isSuccess: boolean; isError: boolean; error: { message: string } });

  const [sections, setSections] = useState<EditableSection[]>([]);
  const pageId = pageQuery.data?.id ?? null;

  // Initialize local sections when query loads
  useEffect(() => {
    if (!pageQuery.data) return;
    const sectionsField = pageQuery.data.fields.find((f) => f.key === "sections");
    // Handle both legacy array shape and connection shape { nodes: [...] }
    const raw = (sectionsField as any)?.references;
    const refs: Array<{ id: string; type: string; fields: Array<{ key: string; value: string | null }> }> = Array.isArray(raw)
      ? raw
      : raw?.nodes ?? [];
    const editable: EditableSection[] = refs.map((r) => ({
      id: r.id,
      type: r.type,
      fields: fieldsArrayToObject(r.fields),
    }));
    setSections(editable);
  }, [pageQuery.data]);

  const title = useMemo(() => {
    return pageQuery.data?.fields.find((f) => f.key === "title")?.value ?? slug;
  }, [pageQuery.data, slug]);

  const [newType, setNewType] = useState<(typeof SECTION_TYPES)[number]["value"]>("hero_image");

  // Uploads and field saves are managed inside relevant section editors

  const addSection = async () => {
    // Create with default fields per type
    const defaults: Record<string, string> =
      newType === "hero_image"
        ? { heading: "Hero Heading", subheading: "", image: "", cta_label: "", cta_link: "" }
        : newType === "three_column_content"
          ? { column1: "", column2: "", column3: "" }
          : { images: "" };

    const created = await createSection.mutateAsync({
      type: newType,
      fields: objectToFieldsArray(defaults),
    });

    if (!created?.id) return;
    const next = [...sections, { id: created.id, type: newType, fields: defaults }];
    setSections(next);

    if (pageId) {
      await updateSections.mutateAsync({
        pageId,
        sections: next.map((s) => ({ metaobjectId: s.id })),
      });
      await pageQuery.refetch();
    }
  };

  const removeSection = async (id: string) => {
    const next = sections.filter((s) => s.id !== id);
    setSections(next);
    if (pageId) {
      await updateSections.mutateAsync({
        pageId,
        sections: next.map((s) => ({ metaobjectId: s.id })),
      });
      await pageQuery.refetch();
    }
  };

  const saveSection = async (idx: number) => {
    // kept for backward-compat; no-op since editors handle their own save
    await pageQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editing Page: {title}</h1>
        <Link href={`/${slug}`} className="text-blue-600 underline">
          View public page
        </Link>
      </div>

      {/* Add section */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Add section</span>
          <select
            className="border rounded px-3 py-2"
            value={newType}
            onChange={(e) => setNewType(e.target.value as (typeof SECTION_TYPES)[number]["value"])}
          >
            {SECTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={addSection}
        // disabled={createSection.isPending || !pageId}
        >
          {createSection.isPending ? "Adding..." : "Add Section"}
        </button>
        {ensureHeroDefinition && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => ensureHeroDefinition.mutate()}
              className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50"
              disabled={ensureHeroDefinition.isPending}
            >
              {ensureHeroDefinition.isPending ? "Initializing Hero..." : "Init Hero Definition"}
            </button>
            {ensureHeroDefinition.isSuccess && (
              <span className="text-green-700 text-sm">Hero definition ensured.</span>
            )}
            {ensureHeroDefinition.isError && (
              <span className="text-red-700 text-sm">{ensureHeroDefinition.error.message}</span>
            )}
          </div>
        )}
      </div>

      {/* Sections list */}
      <div className="space-y-6">
        {sections.map((s, idx) => (
          <div key={s.id} className="border rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{s.type}</h2>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded border text-red-600"
                  onClick={() => void removeSection(s.id)}
                  disabled={updateSections.isPending}
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Render type-specific editors */}
            {s.type === "hero_image" && (
              <HeroImageEditor
                sectionId={s.id}
                initial={{
                  heading: s.fields.heading ?? "",
                  subheading: s.fields.subheading ?? "",
                  image: s.fields.image ?? "",
                  cta_label: s.fields.cta_label ?? "",
                  cta_link: s.fields.cta_link ?? "",
                }}
                onUpdated={() => void pageQuery.refetch()}
              />
            )}

            {s.type === "three_column_content" && (
              <ThreeColumnContentEditor
                sectionId={s.id}
                initial={{
                  column1: s.fields.column1 ?? "",
                  column2: s.fields.column2 ?? "",
                  column3: s.fields.column3 ?? "",
                }}
                onUpdated={() => void pageQuery.refetch()}
              />
            )}

            {s.type === "image_carousel" && (
              <ImageCarouselEditor
                sectionId={s.id}
                initial={{ images: s.fields.images ?? "" }}
                onUpdated={() => void pageQuery.refetch()}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
