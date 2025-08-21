"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { heroSchema, type Hero } from "~/lib/schemas";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { CTABuilder } from "./CTA.builder";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel as SelectGroupLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import { useEffect } from "react";

type Props = {
  defaultValue?: Hero;
  onSave: (data: Hero) => void;
};

export function HeroBuilder({ defaultValue, onSave }: Props) {
  const form = useForm<Hero>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      variant: "color",
      ...defaultValue,
    },
  });

  useEffect(() => {
    if (defaultValue) {
      form.reset(defaultValue);
    }
  }, [defaultValue, form]);

  const variant = form.watch("variant");

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((data) => {
          onSave(data);
          form.reset(data);
        })}
      >
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Subtitle */}
        <FormField
          control={form.control}
          name="subtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtitle</FormLabel>
              <FormControl>
                <Input placeholder="Enter subtitle" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Variant */}
        <FormField
          control={form.control}
          name="variant"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variant</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a variant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectGroupLabel>Variants</SelectGroupLabel>
                      <SelectItem value="color">Color</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="full-image">Full Image</SelectItem>
                      <SelectItem value="image-carousel">
                        Image Carousel
                      </SelectItem>
                      <SelectItem value="full-image-carousel">
                        Full Image Carousel
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Variant-specific fields */}
        {variant === "color" && (
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {variant === "gradient" && (
          <FormField
            control={form.control}
            name="gradient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gradient</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a gradient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunset">Sunset</SelectItem>
                      <SelectItem value="ocean">Ocean</SelectItem>
                      <SelectItem value="forest">Forest</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(variant === "image" || variant === "full-image") && (
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // TODO: replace with upload service
                        const fakeUrl = URL.createObjectURL(file);
                        form.setValue("image", fakeUrl, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(variant === "image-carousel" ||
          variant === "full-image-carousel") && (
            <FormField
              control={form.control}
              name="images"
              render={() => (
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          const fakeUrls = files.map((f) =>
                            URL.createObjectURL(f)
                          );
                          form.setValue("images", fakeUrls, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

        {/* CTA Builder */}
        <FormField
          control={form.control}
          name="cta"
          render={() => (
            <FormItem>
              <FormLabel>Call to Actions (Max 2)</FormLabel>
              <FormControl>
                <CTABuilder
                  control={form.control}
                  name="cta"
                  max={2}
                  errors={form.formState.errors.cta}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        {defaultValue && form.formState.isDirty && (
          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={defaultValue ? !form.formState.isDirty : false}
            >
              Save Hero
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => form.reset(defaultValue)}
            >
              Reset
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}