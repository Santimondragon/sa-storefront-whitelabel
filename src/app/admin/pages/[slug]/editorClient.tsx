"use client";

import { api } from "~/trpc/react";
import { heroSchema, pageSchema, type Hero, type PageContent } from "~/lib/schemas";
import { HeroBuilder } from "~/components/builder/Hero.builder";
import { HeroPreview } from "~/components/preview/Hero.preview";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import Link from "next/link";
import {
  EyeIcon,
  Plus,
  Save,
  Loader2,
  ChevronLeft,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

export default function EditorClient({ slug }: { slug: string }) {
  const pageQuery = api.page.getByHandle.useQuery({ handle: slug });
  const saveMutation = api.page.update.useMutation();

  const [content, setContent] = useState<PageContent>(pageSchema.parse({}));
  const [isDirty, setIsDirty] = useState(false);
  const [resetKey, setResetKey] = useState(0);

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
      // Normalize: ensure sections are unique (only one 'hero' allowed)
      const uniqueSections = Array.from(new Set(next.sections));
      setContent({ sections: uniqueSections, data: next.data });
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
      await pageQuery.refetch();
      setIsDirty(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    if (!pageQuery.data) return;
    const raw = pageQuery.data.fields.find((f) => f.key === "content")?.value ?? "{}";
    try {
      const parsed = JSON.parse(raw || "{}");
      const next = pageSchema.parse(parsed);
      const uniqueSections = Array.from(new Set(next.sections));
      setContent({ sections: uniqueSections, data: next.data });
      setIsDirty(false);

      // ✅ bump resetKey so children reset too
      setResetKey((k) => k + 1);
    } catch (err) {
      console.warn("Invalid page JSON, falling back to blank page", err);
      setContent(pageSchema.parse({}));
      setIsDirty(false);
      setResetKey((k) => k + 1);
    }
  };

  const handleAddSection = (type: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      if (type === "hero" && prev.sections.includes("hero")) return prev;
      const newSections = [...prev.sections, type];
      const newData = { ...prev.data };

      if (type === "hero") {
        newData.hero = {
          title: "New Hero Title",
          subtitle: "",
          description: "",
          cta: [],
          variant: "color",
          color: "red", // default color
        };
      }

      return { sections: newSections, data: newData };
    });
    setIsDirty(true);
  };

  const handleRemoveSection = (sectionKey: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      const nextSections = prev.sections.filter((s) => s !== sectionKey);
      const { [sectionKey]: _removed, ...restData } = prev.data as Record<string, unknown>;
      return { sections: nextSections, data: restData as PageContent["data"] };
    });
    setIsDirty(true);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/pages" className="hidden sm:inline-flex">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold truncate">Editing: {slug}</h1>
                {isDirty ? (
                  <Badge variant="default">Unsaved</Badge>
                ) : (
                  <Badge variant="secondary">Saved</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Manage content sections and preview updates in real time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/${slug}`} target="_blank">
                    <Button variant="outline">
                      <EyeIcon className="mr-2 h-4 w-4" /> View
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Open public page in a new tab</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isDirty && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="min-w-[100px]"
              >
                Reset
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!isDirty || saveMutation.isPending}
              className="min-w-[100px]"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Builders) */}
        <div className="w-full md:w-1/3 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b bg-muted/30 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Sections</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Add Section
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => handleAddSection("hero")}
                    disabled={content?.sections.includes("hero")}
                  >
                    Hero
                  </DropdownMenuItem>
                  {/* Future section types */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {pageQuery.isLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-[140px] w-full" />
                  <Skeleton className="h-[140px] w-full" />
                </div>
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
                      <Card key={sectionKey}>
                        <Collapsible defaultOpen={false}>
                          <CardHeader className="py-2">
                            <div className="flex items-center justify-between gap-2">
                              <CardTitle className="text-base">Hero Builder</CardTitle>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  onClick={() => handleRemoveSection("hero")}
                                  title="Remove section"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <CollapsibleTrigger>
                                  <ChevronDown className="h-4 w-4" />
                                </CollapsibleTrigger>
                              </div>
                            </div>
                          </CardHeader>
                          <CollapsibleContent>
                            <CardContent>
                              <HeroBuilder
                                key={`hero-${resetKey}`} // ✅ force re-mount on reset
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
                          </CollapsibleContent>
                        </Collapsible>
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
          </ScrollArea>
        </div>

        {/* Main Preview */}
        <ScrollArea className="flex-1">
          <div className="p-6 bg-background">
            {pageQuery.isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-48 w-full" />
              </div>
            )}

            {content?.sections.length === 0 && !pageQuery.isLoading && (
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
                    <div
                      key={sectionKey}
                      className="mb-6 rounded-lg border bg-card"
                    >
                      <div className="bg-[linear-gradient(45deg,transparent_24%,rgba(0,0,0,0.03)_25%,rgba(0,0,0,0.03)_26%,transparent_27%,transparent_74%,rgba(0,0,0,0.03)_75%,rgba(0,0,0,0.03)_76%,transparent_77%)] bg-[length:20px_20px] rounded-t-lg border-b p-3 text-xs text-muted-foreground">
                        Preview • Hero
                      </div>
                      <div className="p-4">
                        <HeroPreview data={hero} />
                      </div>
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
        </ScrollArea>
      </div>
    </div>
  );
}