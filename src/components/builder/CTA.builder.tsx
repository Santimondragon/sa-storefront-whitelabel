"use client";

import { useFieldArray, Controller, type Control } from "react-hook-form";
import { type CTA } from "~/lib/schemas";
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
import { Plus, X } from "lucide-react";

type Props = {
  control: Control<any>; // Hero form control
  name: string; // e.g. "cta"
  max?: number; // default 2
  errors?: any;
};

export function CTABuilder({ control, name, max = 2, errors }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="p-4 border rounded-md bg-muted/10 space-y-4 relative"
        >
          <h4 className="font-medium">CTA #{index + 1}</h4>

          {/* Name */}
          <div>
            <Label htmlFor={`${name}.${index}.name`}>Name</Label>
            <Input id={`${name}.${index}.name`} {...control.register(`${name}.${index}.name`)} />
            {errors?.[index]?.name && (
              <p className="text-red-500 text-sm">{errors[index].name.message}</p>
            )}
          </div>

          {/* URL */}
          <div>
            <Label htmlFor={`${name}.${index}.url`}>URL</Label>
            <Input id={`${name}.${index}.url`} {...control.register(`${name}.${index}.url`)} />
            {errors?.[index]?.url && (
              <p className="text-red-500 text-sm">{errors[index].url.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor={`${name}.${index}.description`}>Description</Label>
            <Textarea
              id={`${name}.${index}.description`}
              {...control.register(`${name}.${index}.description`)}
            />
            {errors?.[index]?.description && (
              <p className="text-red-500 text-sm">
                {errors[index].description.message}
              </p>
            )}
          </div>

          {/* Target */}
          <div>
            <Label>Target</Label>
            <Controller
              control={control}
              name={`${name}.${index}.target`}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
              )}
            />
            {errors?.[index]?.target && (
              <p className="text-red-500 text-sm">{errors[index].target.message}</p>
            )}
          </div>

          {/* Variant */}
          <div>
            <Label>Variant</Label>
            <Controller
              control={control}
              name={`${name}.${index}.variant`}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
              )}
            />
            {errors?.[index]?.variant && (
              <p className="text-red-500 text-sm">{errors[index].variant.message}</p>
            )}
          </div>

          {/* Remove CTA */}
          {fields.length >= 1 && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => remove(index)}
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      {/* Add CTA (max 2) */}
      {fields.length < max && (
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              name: "",
              url: "",
              description: "",
              target: "self",
              variant: "primary",
            } as CTA)
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Add CTA
        </Button>
      )}

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No CTAs added. You can add up to 2.
        </p>
      )}

      {/* Global error */}
      {errors?.message && (
        <p className="text-red-500 text-sm">{errors.message}</p>
      )}

    </div>
  );
}