import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { shopifyAdminFetch } from "~/server/shopify/client";

import {
  CREATE_PAGE_DEFINITION_MUTATION,
  CREATE_PAGE_MUTATION,
  GET_PAGE_BY_SLUG_QUERY,
  GET_PAGES_QUERY,
  UPDATE_PAGE_SECTIONS,
  UPDATE_PAGE_SECTIONS_WITH_REFS,
} from "~/server/shopify/queries/pages";

// Local GraphQL helpers to ensure the definition has the 'sections_refs' field
const GET_PAGE_DEFINITION_BY_TYPE = `#graphql
  query GetPageDefByType($type: String!) {
    metaobjectDefinitionByType(type: $type) {
      id
      type
      fieldDefinitions { key }
    }
  }
`;

const ADD_SECTIONS_FIELD_TO_PAGE_DEF = `#graphql
  mutation AddSectionsField($id: ID!) {
    metaobjectDefinitionUpdate(
      id: $id
      definition: {
        fieldDefinitions: [
          { create: { key: "sections_refs", name: "Sections (refs)", type: "list.metaobject_reference" } }
        ]
      }
    ) {
      metaobjectDefinition { id }
      userErrors { field message }
    }
  }
`;

const metaobjectReferenceInput = z
  .object({
    metaobjectId: z.string(),
  })
  .passthrough();

export const pageRouter = createTRPCRouter({
  ensureDefinition: publicProcedure
    .mutation(async () => {
      const data = await shopifyAdminFetch<{
        metaobjectDefinitionCreate: {
          metaobjectDefinition: unknown;
          userErrors: Array<{ field: string[] | null; message: string }>;
        };
      }>({
        query: CREATE_PAGE_DEFINITION_MUTATION,
        variables: {},
      });

      const errs = data.metaobjectDefinitionCreate.userErrors;
      if (errs && errs.length) {
        const ignorable = errs.every((e) =>
          /already exists/i.test(e.message || ""),
        );
        if (!ignorable) {
          throw new Error(
            `CreatePageDefinition error: ${errs.map((e) => e.message).join(", ")}`,
          );
        }
      }
      // Ensure existing definition has the 'sections_refs' field; if missing, add it
      try {
        const defRes = await shopifyAdminFetch<{
          metaobjectDefinitionByType: { id: string; fieldDefinitions: Array<{ key: string }> } | null;
        }>({
          query: GET_PAGE_DEFINITION_BY_TYPE,
          variables: { type: "custom_page" },
        });
        const def = defRes.metaobjectDefinitionByType;
        const hasSectionsRefs = !!def?.fieldDefinitions?.some((f) => f.key === "sections_refs");
        if (def?.id && !hasSectionsRefs) {
          const upd = await shopifyAdminFetch<{
            metaobjectDefinitionUpdate: { metaobjectDefinition: { id: string } | null; userErrors: Array<{ field: string[] | null; message: string }> };
          }>({
            query: ADD_SECTIONS_FIELD_TO_PAGE_DEF,
            variables: { id: def.id },
          });
          const uerrs = upd.metaobjectDefinitionUpdate.userErrors;
          if (uerrs && uerrs.length) {
            throw new Error(`Add sections field failed: ${uerrs.map((e) => e.message).join(", ")}`);
          }
        }
      } catch (e) {
        // Surface but don't crash the route
        console.error(e);
      }
      return data.metaobjectDefinitionCreate.metaobjectDefinition;
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        slug: z.string(),
        sections: z.array(metaobjectReferenceInput).optional().default([]),
      }),
    )
    .mutation(async ({ input }) => {
      const data = await shopifyAdminFetch<{
        metaobjectCreate: {
          metaobject: unknown;
          userErrors: Array<{ field: string[] | null; message: string }>;
        };
      }>({
        query: CREATE_PAGE_MUTATION,
        variables: { title: input.title, slug: input.slug },
      });

      const errs = data.metaobjectCreate.userErrors;
      if (errs && errs.length) {
        throw new Error(`CreatePage error: ${errs.map((e) => e.message).join(", ")}`);
      }
      const created = data.metaobjectCreate.metaobject as { id?: string } | null;
      // If sections were provided, set them in a second step
      if (created?.id && input.sections && input.sections.length) {
        // Ensure the 'sections_refs' field exists on the page definition
        try {
          const defRes = await shopifyAdminFetch<{
            metaobjectDefinitionByType: { id: string; fieldDefinitions: Array<{ key: string }> } | null;
          }>({
            query: GET_PAGE_DEFINITION_BY_TYPE,
            variables: { type: "custom_page" },
          });
          const def = defRes.metaobjectDefinitionByType;
          const hasSectionsRefs = !!def?.fieldDefinitions?.some((f) => f.key === "sections_refs");
          if (def?.id && !hasSectionsRefs) {
            const upd = await shopifyAdminFetch<{
              metaobjectDefinitionUpdate: { metaobjectDefinition: { id: string } | null; userErrors: Array<{ field: string[] | null; message: string }> };
            }>({
              query: ADD_SECTIONS_FIELD_TO_PAGE_DEF,
              variables: { id: def.id },
            });
            const uerrs = upd.metaobjectDefinitionUpdate.userErrors;
            if (uerrs && uerrs.length) {
              throw new Error(`Add sections field failed: ${uerrs.map((e) => e.message).join(", ")}`);
            }
          }
        } catch (e) {
          console.error(e);
        }
        const sectionsJson = JSON.stringify(
          input.sections.map((s) => s.metaobjectId),
        );
        await shopifyAdminFetch({
          query: UPDATE_PAGE_SECTIONS_WITH_REFS,
          variables: { id: created.id, sectionsJson },
        });
      }
      return created;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const data = await shopifyAdminFetch<{
        metaobjectByHandle: {
          id: string;
          type: string;
          fields: Array<{
            key: string;
            value: string | null;
            references?: { nodes: Array<{ id: string; type: string; fields: Array<{ key: string; value: string | null }> }> } | null;
          }>;
        } | null;
      }>({
        query: GET_PAGE_BY_SLUG_QUERY,
        variables: { slug: input.slug },
      });

      return data.metaobjectByHandle;
    }),

  list: publicProcedure
    .input(z.object({ first: z.number().min(1).max(250).optional() }).optional())
    .query(async ({ input }) => {
      const first = input?.first ?? 50;
      const data = await shopifyAdminFetch<{
        metaobjects: { nodes: Array<{ id: string; handle: string; type: string; fields: Array<{ key: string; value: string | null }> }> };
      }>({
        query: GET_PAGES_QUERY,
        variables: { first },
      });
      return data.metaobjects.nodes;
    }),

  updateSections: publicProcedure
    .input(
      z.object({
        pageId: z.string(),
        sections: z.array(metaobjectReferenceInput),
      }),
    )
    .mutation(async ({ input }) => {
      // Ensure the 'sections_refs' field exists on the page definition
      try {
        const defRes = await shopifyAdminFetch<{
          metaobjectDefinitionByType: { id: string; fieldDefinitions: Array<{ key: string }> } | null;
        }>({
          query: GET_PAGE_DEFINITION_BY_TYPE,
          variables: { type: "custom_page" },
        });
        const def = defRes.metaobjectDefinitionByType;
        const hasSectionsRefs = !!def?.fieldDefinitions?.some((f) => f.key === "sections_refs");
        if (def?.id && !hasSectionsRefs) {
          const upd = await shopifyAdminFetch<{
            metaobjectDefinitionUpdate: { metaobjectDefinition: { id: string } | null; userErrors: Array<{ field: string[] | null; message: string }> };
          }>({
            query: ADD_SECTIONS_FIELD_TO_PAGE_DEF,
            variables: { id: def.id },
          });
          const uerrs = upd.metaobjectDefinitionUpdate.userErrors;
          if (uerrs && uerrs.length) {
            throw new Error(`Add sections field failed: ${uerrs.map((e) => e.message).join(", ")}`);
          }
        }
      } catch (e) {
        console.error(e);
      }
      // Use metaobjectUpdate to set the value for the sections field (JSON array of IDs)
      const data = await shopifyAdminFetch<{
        metaobjectUpdate: {
          metaobject: unknown;
          userErrors: Array<{ field: string[] | null; message: string }>;
        };
      }>({
        query: UPDATE_PAGE_SECTIONS,
        variables: {
          id: input.pageId,
          sectionsJson: JSON.stringify(input.sections.map((s) => s.metaobjectId)),
        },
      });

      const errs = data.metaobjectUpdate.userErrors;
      if (errs && errs.length) {
        throw new Error(`UpdatePageSections error: ${errs.map((e) => e.message).join(", ")}`);
      }
      return data.metaobjectUpdate.metaobject;
    }),
});
