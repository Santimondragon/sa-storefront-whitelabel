"use client";

import { api } from "~/trpc/react";
import { z } from "zod";
import { heroSchema, pageSchema, type Hero, type PageContent } from "~/lib/schemas";
import { HeroBuilder } from "~/components/builder/Hero.builder";
import { HeroPreview } from "~/components/preview/Hero.preview";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import Link from "next/link";
import { EyeIcon } from "lucide-react";

export default function EditorClient({ slug }: { slug: string }) {
  const pageQuery = api.page.getByHandle.useQuery({ handle: slug });
  const saveMutation = api.page.update.useMutation();
  const router = useRouter();

  const [content, setContent] = useState<PageContent>(pageSchema.parse({}));
  const [isDirty, setIsDirty] = useState(false);

  // Warn on refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Sync content from query when data arrives, but don't overwrite local edits
  useEffect(() => {
    if (!pageQuery.data || isDirty) return;
    const raw = pageQuery.data.fields.find((f) => f.key === "content")?.value ?? "{}";
    try {
      const parsed = JSON.parse(raw || "{}");
      const next = pageSchema.parse(parsed);
      setContent(next);
    } catch (err) {
      console.warn("Invalid page JSON, falling back to blank page", err);
      setContent(pageSchema.parse({}));
    }
  }, [pageQuery.data, isDirty]);

  const handleSave = async () => {
    if (!content) return;
    try {
      if (!pageQuery.data?.id) return;
      await saveMutation.mutateAsync({ id: pageQuery.data.id, content });
      setIsDirty(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSection = (type: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      const newSections = [...prev.sections, type];
      const newData = { ...prev.data };

      if (type === "hero") {
        newData.hero = {
          title: "New Hero Title",
          subtitle: "",
          description: "",
          cta: [],
          variant: "color",
          color: "#ffffff",
        };
      }

      return { sections: newSections, data: newData };
    });
    setIsDirty(true);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <h1 className="text-xl font-bold">Editing: {slug}</h1>
        <Button
          onClick={handleSave}
          disabled={!isDirty || saveMutation.isPending}
          variant={isDirty ? "default" : "secondary"}
        >
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
        <Link href={`/${slug}`} target="_blank">
          <Button>
            <EyeIcon /> View public page
          </Button>
        </Link>
      </div>

      {/* 2-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Builders) */}
        <div className="w-1/3 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <Button
              onClick={() => handleAddSection("hero")}
              className="w-full"
              variant="outline"
            >
              + Add Hero Section
            </Button>
          </div>

          <div className="flex-1 p-4 space-y-4">
            {content?.sections.map((sectionKey) => {
              const sectionData = content.data[sectionKey];

              switch (sectionKey) {
                case "hero": {
                  let hero: Hero | null = null;
                  try {
                    hero = heroSchema.parse(sectionData);
                  } catch (err) {
                    console.error("Invalid hero data", err);
                  }
                  if (!hero) return null;

                  return (
                    <Card key={sectionKey}>
                      <CardHeader>
                        <CardTitle>Hero Builder</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <HeroBuilder
                          defaultValue={hero}
                          onSave={(updated) => {
                            setContent((prev) =>
                              prev
                                ? {
                                  ...prev,
                                  data: { ...prev.data, hero: updated },
                                }
                                : prev
                            );
                            setIsDirty(true);
                          }}
                        />
                      </CardContent>
                    </Card>
                  );
                }

                default:
                  return (
                    <Card key={sectionKey}>
                      <CardHeader>
                        <CardTitle>Unknown Section</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{sectionKey}</p>
                      </CardContent>
                    </Card>
                  );
              }
            })}
          </div>
        </div>

        {/* Main Preview */}
        <div className="flex-1 p-6 bg-background">
          {content?.sections.length === 0 && (
            <p className="text-muted-foreground italic">
              No sections yet. Add one from the left sidebar.
            </p>
          )}

          {content?.sections.map((sectionKey) => {
            const sectionData = content.data[sectionKey];

            switch (sectionKey) {
              case "hero": {
                let hero: Hero | null = null;
                try {
                  hero = heroSchema.parse(sectionData);
                } catch (err) {
                  console.error("Invalid hero data", err);
                }
                if (!hero) return null;

                return (
                  <div key={sectionKey} className="mb-6">
                    <HeroPreview data={hero} />
                  </div>
                );
              }

              default:
                return (
                  <Card key={sectionKey} className="mb-6">
                    <CardHeader>
                      <CardTitle>Unknown Section</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{sectionKey}</p>
                    </CardContent>
                  </Card>
                );
            }
          })}
        </div>
      </div>
    </div>
  );
}