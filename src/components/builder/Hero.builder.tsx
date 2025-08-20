"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { heroSchema, type Hero, type CTA } from "~/lib/schemas";
import { CTABuilder } from "./CTA.builder";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel as SelectGroupLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { X } from "lucide-react"; // For the remove icon

type Props = {
  defaultValue?: Hero;
  onSave: (data: Hero) => void;
};

export function HeroBuilder({ defaultValue, onSave }: Props) {
  const [ctas, setCtas] = useState<CTA[]>(defaultValue?.cta || []);
  const [editingCtaIndex, setEditingCtaIndex] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Hero>({
    resolver: zodResolver(heroSchema),
    defaultValues: defaultValue,
  });

  const handleAddOrUpdateCTA = (cta: CTA) => {
    if (editingCtaIndex !== null) {
      setCtas((prevCtas) =>
        prevCtas.map((item, index) => (index === editingCtaIndex ? cta : item))
      );
      setEditingCtaIndex(null); // Exit editing mode
    } else {
      setCtas((prevCtas) => [...prevCtas, cta]);
    }
  };

  const removeCTA = (indexToRemove: number) => {
    setCtas((prevCtas) => prevCtas.filter((_, index) => index !== indexToRemove));
    if (editingCtaIndex === indexToRemove) {
      setEditingCtaIndex(null); // If the removed CTA was being edited, clear editing state
    }
  };

  const editCTA = (indexToEdit: number) => {
    setEditingCtaIndex(indexToEdit);
  };

  const handleSelectChange = (name: keyof Hero, value: string) => {
    setValue(name, value as any, { shouldValidate: true });
  };

  return (
    <form
      onSubmit={handleSubmit((data) => onSave({ ...data, cta: ctas }))}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="hero-title">Title</Label>
        <Input id="hero-title" {...register("title")} />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="hero-subtitle">Subtitle</Label>
        <Input id="hero-subtitle" {...register("subtitle")} />
        {errors.subtitle && (
          <p className="text-red-500 text-sm">{errors.subtitle.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="hero-description">Description</Label>
        <Textarea id="hero-description" {...register("description")} />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="hero-variant">Variant</Label>
        <Select
          onValueChange={(value) => handleSelectChange("variant", value)}
          defaultValue={watch("variant") || "color"}
        >
          <SelectTrigger className="w-full" id="hero-variant">
            <SelectValue placeholder="Select a variant" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectGroupLabel>Variants</SelectGroupLabel>
              <SelectItem value="color">Color</SelectItem>
              <SelectItem value="gradient">Gradient</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="full-image">Full Image</SelectItem>
              <SelectItem value="image-carousel">Image Carousel</SelectItem>
              <SelectItem value="full-image-carousel">Full Image Carousel</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.variant && <p className="text-red-500 text-sm">{errors.variant.message}</p>}
      </div>

      {/* CTA Management */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Call to Actions (Max 2)</h3>
        {ctas.length > 0 && (
          <ul className="space-y-2 mb-4">
            {ctas.map((cta, i) => (
              <li
                key={i}
                className="flex items-center justify-between p-3 border rounded-md bg-muted/20"
              >
                <span className="font-medium">{cta.name || "Untitled CTA"}</span>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editCTA(i)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeCTA(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {ctas.length < 2 && (
          <>
            <h4 className="text-md font-medium mb-2">
              {editingCtaIndex !== null ? "Edit CTA" : "Add New CTA"}
            </h4>
            <CTABuilder
              onSave={handleAddOrUpdateCTA}
              defaultValue={editingCtaIndex !== null ? ctas[editingCtaIndex] : undefined}
              key={editingCtaIndex} // Key to re-render CTABuilder when editing starts/stops
            />
          </>
        )}

        {ctas.length >= 2 && editingCtaIndex === null && (
          <p className="text-sm text-muted-foreground">Maximum of 2 CTAs reached.</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Save Hero
      </Button>
    </form>
  );
}