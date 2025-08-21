import { z } from "zod";

// Page Schema
export const pageSchema = z.object({
  sections: z.array(z.string()).default([]),
  data: z.record(z.any()).default({}),
});

export type PageContent = z.infer<typeof pageSchema>;

// CTA Schema
export const ctaSchema = z.object({
  name: z.string().min(1, "CTA name is required"),
  url: z.string().url("Must be a valid URL"),
  description: z.string().optional(),
  target: z.enum(["self", "blank"]),
  variant: z.enum(["primary", "secondary", "tertiary", "link"]),
});

export type CTA = z.infer<typeof ctaSchema>;

export const ctasSchema = z.object({
  ctas: z
    .array(ctaSchema)
    .min(1, "At least 1 CTA is required")
    .max(2, "Maximum of 2 CTAs allowed"),
});

export type CTAsForm = z.infer<typeof ctasSchema>;

// Hero Schema
export const heroSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  cta: z.array(ctaSchema).max(2, "Maximum of 2 CTAs allowed").optional(),
  variant: z.enum([
    "color",
    "gradient",
    "image",
    "full-image",
    "image-carousel",
    "full-image-carousel",
  ]),
  color: z.string().optional(),
  gradient: z.string().optional(),
  image: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
});

export type Hero = z.infer<typeof heroSchema>;