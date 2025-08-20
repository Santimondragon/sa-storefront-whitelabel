"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ctaSchema, type CTA } from "~/lib/schemas";
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

type Props = {
  defaultValue?: CTA;
  onSave: (data: CTA) => void;
};

export function CTABuilder({ defaultValue, onSave }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CTA>({
    resolver: zodResolver(ctaSchema),
    defaultValues: defaultValue,
  });

  const handleSelectChange = (name: keyof CTA, value: string) => {
    setValue(name, value as any, { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <Label htmlFor="cta-name">Name</Label>
        <Input id="cta-name" {...register("name")} />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      {/* URL */}
      <div>
        <Label htmlFor="cta-url">URL</Label>
        <Input id="cta-url" {...register("url")} />
        {errors.url && <p className="text-red-500 text-sm">{errors.url.message}</p>}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="cta-description">Description</Label>
        <Textarea id="cta-description" {...register("description")} />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description.message}</p>
        )}
      </div>

      {/* Target */}
      <div>
        <Label htmlFor="cta-target">Target</Label>
        <Select
          onValueChange={(value) => handleSelectChange("target", value)}
          defaultValue={watch("target") || "self"}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a target" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectGroupLabel>Targets</SelectGroupLabel>
              <SelectItem value="self">Self</SelectItem>
              <SelectItem value="blank">Blank</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.target && <p className="text-red-500 text-sm">{errors.target.message}</p>}
      </div>

      {/* Variant */}
      <div>
        <Label htmlFor="cta-variant">Variant</Label>
        <Select
          onValueChange={(value) => handleSelectChange("variant", value)}
          defaultValue={watch("variant") || "primary"}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a variant" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectGroupLabel>Variants</SelectGroupLabel>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="tertiary">Tertiary</SelectItem>
              <SelectItem value="link">Link</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.variant && <p className="text-red-500 text-sm">{errors.variant.message}</p>}
      </div>

      <Button type="button" onClick={handleSubmit(onSave)} className="w-full">
        Save CTA
      </Button>
    </div>
  );
}