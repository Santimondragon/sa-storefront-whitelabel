import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { shopifyFetch } from "~/server/shopify/client";
import { shopifyAdminFetch } from "~/server/shopify/adminClient";
import { auth, currentUser } from "@clerk/nextjs/server";

// Helpers
async function assertAdmin() {
  // Temporary development bypass: set ADMIN_BYPASS=true in .env
  if (process.env.ADMIN_BYPASS === "true") return;
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await currentUser();
  const hasRole = user?.publicMetadata?.role === "admin";
  if (!hasRole) throw new Error("Forbidden");
}

async function getShopId(): Promise<string> {
  const data = await shopifyAdminFetch<{ shop: { id: string } }>({
    query: `#graphql
      query ShopId { shop { id } }
    `,
  });
  return data.shop.id;
}

export const contentRouter = createTRPCRouter({
  // Section 1: Homepage content
  getHomepageContent: publicProcedure.query(async () => {
    // Storefront API query for shop metafields
    const data = await shopifyFetch<{
      shop: {
        metafieldHeroTitle: { value: string } | null;
        metafieldBannerText: { value: string } | null;
        metafieldHeroImage:
          | ({
              reference:
                | ({
                    __typename: "MediaImage";
                    image: { url: string } | null;
                    id?: string | null;
                  } & { id?: string | null })
                | ({ __typename: "GenericFile"; url: string; id?: string | null });
            } | null)
          | null;
      };
    }>({
      query: `#graphql
        query GetHomepageMetafields {
          shop {
            metafieldHeroTitle: metafield(namespace: "homepage", key: "hero_title") { value }
            metafieldBannerText: metafield(namespace: "homepage", key: "banner_text") { value }
            metafieldHeroImage: metafield(namespace: "homepage", key: "hero_image") {
              reference {
                __typename
                ... on MediaImage { id image { url } }
                ... on GenericFile { id url }
              }
            }
          }
        }
      `,
    });

    const imageUrl = (() => {
      const ref: any = data.shop.metafieldHeroImage?.reference;
      if (!ref) return null;
      if (ref.__typename === "MediaImage") return ref.image?.url ?? null;
      if (ref.__typename === "GenericFile") return ref.url ?? null;
      return null;
    })();

    return {
      heroTitle: data.shop.metafieldHeroTitle?.value ?? "",
      bannerText: data.shop.metafieldBannerText?.value ?? "",
      heroImageUrl: imageUrl,
    };
  }),

  updateHomepageContent: publicProcedure
    .input(
      z.object({
        heroTitle: z.string().optional(),
        bannerText: z.string().optional(),
        heroImage: z
          .object({ filename: z.string(), mimeType: z.string(), base64: z.string() })
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await assertAdmin();
      const ownerId = await getShopId();

      // If image provided, upload and upsert file_reference
      if (input.heroImage) {
        const { filename, mimeType, base64 } = input.heroImage;
        const fileBuffer = Buffer.from(base64, "base64");

        // 1) staged upload to Files
        const staged = await shopifyAdminFetch<{
          stagedUploadsCreate: {
            stagedTargets: Array<{
              url: string;
              resourceUrl: string;
              parameters: Array<{ name: string; value: string }>;
            }>;
            userErrors: Array<{ field: string[] | null; message: string }>;
          };
        }>({
          query: `#graphql
            mutation StagedUploads($input: [StagedUploadInput!]!) {
              stagedUploadsCreate(input: $input) {
                stagedTargets { url resourceUrl parameters { name value } }
                userErrors { field message }
              }
            }
          `,
          variables: {
            input: [
              { resource: "FILE", filename, mimeType, httpMethod: "POST" },
            ],
          },
        });

        const target = staged.stagedUploadsCreate.stagedTargets[0];
        if (!target) throw new Error("Failed to stage upload");

        const form = new FormData();
        for (const p of target.parameters) form.append(p.name, p.value);
        form.append("file", new Blob([fileBuffer], { type: mimeType }), filename);
        const uploadRes = await fetch(target.url, { method: "POST", body: form });
        if (!uploadRes.ok) throw new Error("File upload failed");

        // Create file
        const created = await shopifyAdminFetch<{
          fileCreate: { files: Array<{ id: string }>; userErrors: Array<{ message: string }> };
        }>({
          query: `#graphql
            mutation FileCreate($files: [FileCreateInput!]!) {
              fileCreate(files: $files) { files { id } userErrors { message } }
            }
          `,
          variables: { files: [{ originalSource: target.resourceUrl, contentType: "IMAGE" }] },
        });
        const fileId = created.fileCreate.files[0]?.id;
        if (!fileId) throw new Error("FileCreate did not return an id");

        // Upsert hero_image metafield as file_reference
        await shopifyAdminFetch<{
          metafieldUpsert: { metafield: { id: string } | null; userErrors: Array<{ message: string }> };
        }>({
          query: `#graphql
            mutation UpsertFileRef($input: MetafieldInput!) {
              metafieldUpsert(input: $input) { metafield { id } userErrors { message } }
            }
          `,
          variables: {
            input: {
              ownerId,
              namespace: "homepage",
              key: "hero_image",
              value: fileId,
              type: "file_reference",
            },
          },
        });
      }

      // Upsert text metafields if provided
      const toUpsert: Array<{ key: string; value: string; type: string }> = [];
      if (typeof input.heroTitle === "string")
        toUpsert.push({ key: "hero_title", value: input.heroTitle, type: "single_line_text_field" });
      if (typeof input.bannerText === "string")
        toUpsert.push({ key: "banner_text", value: input.bannerText, type: "single_line_text_field" });

      for (const item of toUpsert) {
        await shopifyAdminFetch<{
          metafieldUpsert: { metafield: { id: string } | null; userErrors: Array<{ message: string }> };
        }>({
          query: `#graphql
            mutation UpsertShopMetafield($input: MetafieldInput!) {
              metafieldUpsert(input: $input) { metafield { id } userErrors { message } }
            }
          `,
          variables: {
            input: { ownerId, namespace: "homepage", key: item.key, value: item.value, type: item.type },
          },
        });
      }

      return { ok: true };
    }),

  // Section 2: Landing pages
  getLandingPages: publicProcedure.query(async () => {
    const data = await shopifyFetch<{
      pages: { edges: Array<{ node: { id: string; title: string; handle: string } }> };
    }>({
      query: `#graphql
        query GetPages {
          pages(first: 50) { edges { node { id title handle } } }
        }
      `,
    });

    return data.pages.edges.map((e) => e.node);
  }),

  getLandingPageContent: publicProcedure
    .input(z.object({ pageId: z.string() }))
    .query(async ({ input }) => {
      const data = await shopifyFetch<{
        node: null | { __typename: string; metafield?: { value: string | null } | null };
      }>({
        query: `#graphql
          query GetPageContent($id: ID!) {
            node(id: $id) {
              __typename
              ... on Page {
                metafield(namespace: "landing", key: "content_html") { value }
              }
            }
          }
        `,
        variables: { id: input.pageId },
      });

      const value = (data.node as any)?.metafield?.value ?? "";
      return { contentHtml: value };
    }),

  updateLandingPageContent: publicProcedure
    .input(z.object({ pageId: z.string(), contentHtml: z.string() }))
    .mutation(async ({ input }) => {
      await assertAdmin();
      await shopifyAdminFetch<{
        metafieldUpsert: { metafield: { id: string } | null; userErrors: Array<{ message: string }> };
      }>({
        query: `#graphql
          mutation UpsertPageContent($input: MetafieldInput!) {
            metafieldUpsert(input: $input) { metafield { id } userErrors { message } }
          }
        `,
        variables: {
          input: {
            ownerId: input.pageId,
            namespace: "landing",
            key: "content_html",
            value: input.contentHtml,
            type: "rich_text_field",
          },
        },
      });
      return { ok: true };
    }),
});
