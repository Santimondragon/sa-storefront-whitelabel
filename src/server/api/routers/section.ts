import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { shopifyAdminFetch } from "~/server/shopify/client";

// Create metaobject definition for hero_image
const CREATE_HERO_DEFINITION_MUTATION = `#graphql
mutation EnsureHeroDefinition {
  metaobjectDefinitionCreate(
    definition: {
      name: "Hero Image"
      type: "hero_image"
      capabilities: { publishable: { enabled: true } }
      fieldDefinitions: [
        { name: "Heading", key: "heading", type: "single_line_text_field", adminUi: { summary: true }, description: "Main title text displayed prominently in the hero section." }
        { name: "Subheading", key: "subheading", type: "multi_line_text_field", description: "Supporting text that appears below the heading." }
        { name: "Image", key: "image", type: "file_reference", description: "Background or main image for the hero section." }
        { name: "CTA Label", key: "cta_label", type: "single_line_text_field", description: "Text for the call-to-action button." }
        { name: "CTA Link", key: "cta_link", type: "url", description: "Link the call-to-action button should point to." }
      ]
    }
  ) {
    metaobjectDefinition { id name type }
    userErrors { field message }
  }
}`;

// Shopify staged uploads and file create
const STAGED_UPLOADS_CREATE = `#graphql
mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets {
      url
      resourceUrl
      parameters { name value }
    }
    userErrors { field message }
  }
}`;

const FILE_CREATE_MUTATION = `#graphql
mutation FileCreate($files: [FileCreateInput!]!) {
  fileCreate(files: $files) {
    files { id __typename }
    userErrors { field message }
  }
}`;

// GraphQL operations as provided
const CREATE_SECTION_MUTATION = `#graphql
mutation CreateSection($type: String!, $fields: [MetaobjectFieldInput!]!) {
  metaobjectCreate(
    metaobject: {
      type: $type
      fields: $fields
    }
  ) {
    metaobject {
      id
      handle
      type
      fields {
        key
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}`;

const UPDATE_SECTION_MUTATION = `#graphql
mutation UpdateSection($id: ID!, $fields: [MetaobjectFieldInput!]!) {
  metaobjectUpdate(
    id: $id
    metaobject: { fields: $fields }
  ) {
    metaobject {
      id
      handle
      type
      fields {
        key
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}`;

// Publish (activate) a metaobject by setting its publishable capability status to ACTIVE
const PUBLISH_SECTION_MUTATION = `#graphql
mutation PublishSection($id: ID!) {
  metaobjectUpdate(
    id: $id
    metaobject: { capabilities: { publishable: { status: ACTIVE } } }
  ) {
    metaobject { id }
    userErrors { field message }
  }
}`;

// Ensure the metaobject definition for a given type has publishable capability enabled
const GET_DEFINITION_BY_TYPE = `#graphql
  query GetDefinitionByType($type: String!) {
    metaobjectDefinitionByType(type: $type) {
      id
      type
      capabilities { publishable { enabled } }
    }
  }
`;

const ENABLE_PUBLISHABLE_ON_DEFINITION = `#graphql
  mutation EnablePublishableOnDefinition($id: ID!) {
    metaobjectDefinitionUpdate(
      id: $id
      definition: { capabilities: { publishable: { enabled: true } } }
    ) {
      metaobjectDefinition { id }
      userErrors { field message }
    }
  }
`;

// Minimal Zod schemas to pass variables correctly
const metaobjectFieldInput = z
  .object({
    key: z.string(),
    value: z.string().optional(),
    // allow extra keys for flexibility; Shopify ignores unknown keys in this input
  })
  .passthrough();

export const sectionRouter = createTRPCRouter({
  ensureHeroDefinition: publicProcedure.mutation(async () => {
    const data = await shopifyAdminFetch<{
      metaobjectDefinitionCreate: {
        metaobjectDefinition: unknown;
        userErrors: Array<{ field: string[] | null; message: string }>;
      };
    }>({
      query: CREATE_HERO_DEFINITION_MUTATION,
      variables: {},
    });

    const errs = data.metaobjectDefinitionCreate.userErrors;
    if (errs && errs.length) {
      const ignorable = errs.every((e) => /already exists/i.test(e.message || ""));
      if (!ignorable) {
        throw new Error(`EnsureHeroDefinition error: ${errs.map((e) => e.message).join(", ")}`);
      }
    }
    return data.metaobjectDefinitionCreate.metaobjectDefinition;
  }),
  create: publicProcedure
    .input(
      z.object({
        type: z.string(),
        fields: z.array(metaobjectFieldInput),
      }),
    )
    .mutation(async ({ input }) => {
      const data = await shopifyAdminFetch<{
        metaobjectCreate: {
          metaobject: {
            id: string;
            handle: string | null;
            type: string;
            fields: Array<{ key: string; value: string | null }>;
          } | null;
          userErrors: Array<{ field: string[] | null; message: string }>;
        };
      }>({
        query: CREATE_SECTION_MUTATION,
        variables: { type: input.type, fields: input.fields },
      });

      const errs = data.metaobjectCreate.userErrors;
      if (errs && errs.length) {
        throw new Error(`CreateSection error: ${errs.map((e) => e.message).join(", ")}`);
      }
      const created = data.metaobjectCreate.metaobject;
      // Ensure the type's definition has publishable capability enabled, then publish
      if (created?.id) {
        try {
          // 1) Ensure definition has publishable enabled
          const defRes = await shopifyAdminFetch<{
            metaobjectDefinitionByType: { id: string; capabilities?: { publishable?: { enabled?: boolean } } } | null;
          }>({
            query: GET_DEFINITION_BY_TYPE,
            variables: { type: input.type },
          });
          const def = defRes.metaobjectDefinitionByType;
          if (def?.id && !def.capabilities?.publishable?.enabled) {
            const upd = await shopifyAdminFetch<{
              metaobjectDefinitionUpdate: { metaobjectDefinition: { id: string } | null; userErrors: Array<{ field: string[] | null; message: string }> };
            }>({
              query: ENABLE_PUBLISHABLE_ON_DEFINITION,
              variables: { id: def.id },
            });
            const derrs = upd.metaobjectDefinitionUpdate.userErrors;
            if (derrs && derrs.length) {
              // Not fatal for creation; log via error to surface in client
              throw new Error(`Enable publishable failed: ${derrs.map((e) => e.message).join(", ")}`);
            }
          }

          // 2) Publish (set status ACTIVE)
          const publishRes = await shopifyAdminFetch<{
            metaobjectUpdate: {
              metaobject: { id: string } | null;
              userErrors: Array<{ field: string[] | null; message: string }>;
            };
          }>({
            query: PUBLISH_SECTION_MUTATION,
            variables: { id: created.id },
          });
          const perrs = publishRes.metaobjectUpdate.userErrors;
          if (perrs && perrs.length) {
            throw new Error(`PublishSection error: ${perrs.map((e) => e.message).join(", ")}`);
          }
        } catch (e) {
          // Re-throw to signal failure to activate
          throw e;
        }
      }
      return created;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        fields: z.array(metaobjectFieldInput),
      }),
    )
    .mutation(async ({ input }) => {
      const data = await shopifyAdminFetch<{
        metaobjectUpdate: {
          metaobject: {
            id: string;
            handle: string | null;
            type: string;
            fields: Array<{ key: string; value: string | null }>;
          } | null;
          userErrors: Array<{ field: string[] | null; message: string }>;
        };
      }>({
        query: UPDATE_SECTION_MUTATION,
        variables: { id: input.id, fields: input.fields },
      });

      const errs = data.metaobjectUpdate.userErrors;
      if (errs && errs.length) {
        throw new Error(`UpdateSection error: ${errs.map((e) => e.message).join(", ")}`);
      }
      return data.metaobjectUpdate.metaobject;
    }),

  // Upload an image to Shopify Files and return the file ID
  uploadImage: publicProcedure
    .input(
      z.object({
        filename: z.string(),
        mimeType: z.string(),
        base64: z.string(),
        fileSize: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      // 1) Get staged upload target
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
        query: STAGED_UPLOADS_CREATE,
        variables: {
          input: [
            {
              resource: "FILE",
              filename: input.filename,
              mimeType: input.mimeType,
              httpMethod: "POST",
            },
          ],
        },
      });

      const se = staged.stagedUploadsCreate;
      if (se.userErrors?.length) {
        throw new Error(`stagedUploadsCreate error: ${se.userErrors.map((e) => e.message).join(", ")}`);
      }
      const target = se.stagedTargets[0];
      if (!target) throw new Error("No staged upload target returned");

      // 2) Upload file to S3 using returned fields
      const form = new FormData();
      for (const p of target.parameters) form.append(p.name, p.value);
      // Append the file as the last field named 'file'
      const buffer = Buffer.from(input.base64, "base64");
      const blob = new Blob([buffer], { type: input.mimeType });
      form.append("file", blob, input.filename);

      const uploadRes = await fetch(target.url, { method: "POST", body: form });
      if (!uploadRes.ok) {
        const t = await uploadRes.text();
        throw new Error(`S3 upload failed (${uploadRes.status}): ${t}`);
      }

      // 3) Finalize into a Shopify File
      const contentTypeEnum = (() => {
        const mt = input.mimeType.toLowerCase();
        if (mt.startsWith("image/")) return "IMAGE" as const;
        if (mt.startsWith("video/")) return "VIDEO" as const;
        // Basic heuristic for 3d
        if (/(model|gltf|glb|usd|usdz)/i.test(mt)) return "MODEL_3D" as const;
        return "FILE" as const;
      })();
      const fileCreate = await shopifyAdminFetch<{
        fileCreate: {
          files: Array<{ id: string }>;
          userErrors: Array<{ field: string[] | null; message: string }>;
        };
      }>({
        query: FILE_CREATE_MUTATION,
        variables: {
          files: [
            {
              contentType: contentTypeEnum,
              originalSource: target.resourceUrl,
              filename: input.filename,
            },
          ],
        },
      });

      const fe = fileCreate.fileCreate;
      if (fe.userErrors?.length) {
        throw new Error(`fileCreate error: ${fe.userErrors.map((e) => e.message).join(", ")}`);
      }
      const file = fe.files?.[0];
      if (!file?.id) throw new Error("No file id returned from fileCreate");
      return { fileId: file.id };
    }),

  // Set a file_reference on a metaobject field
  updateFieldReference: publicProcedure
    .input(z.object({ id: z.string(), key: z.string(), fileId: z.string() }))
    .mutation(async ({ input }) => {
      const data = await shopifyAdminFetch<{
        metaobjectUpdate: {
          metaobject: unknown;
          userErrors: Array<{ field: string[] | null; message: string }>;
        };
      }>({
        query: `#graphql
          mutation UpdateFieldReference($id: ID!, $key: String!, $value: String!) {
            metaobjectUpdate(
              id: $id,
              metaobject: { fields: [{ key: $key, value: $value }] }
            ) {
              metaobject { id }
              userErrors { field message }
            }
          }
        `,
        variables: { id: input.id, key: input.key, value: input.fileId },
      });
      const errs = data.metaobjectUpdate.userErrors;
      if (errs && errs.length) {
        throw new Error(`UpdateFieldReference error: ${errs.map((e) => e.message).join(", ")}`);
      }
      return data.metaobjectUpdate.metaobject;
    }),
});
