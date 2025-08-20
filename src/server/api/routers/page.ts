import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { shopifyAdminFetch } from "~/server/shopify/client";

import {
  CREATE_PAGE_MUTATION,
  UPDATE_PAGE_MUTATION,
  GET_PAGE_BY_HANDLE_QUERY,
  GET_PAGES_QUERY,
  DELETE_PAGE_MUTATION,
} from "~/server/shopify/queries/pages";

// No additional helpers are needed in the new minimal model

export const pageRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        // content will be stored as JSON string in Shopify, accept any JSON-like structure
        content: z.unknown(),
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
        variables: { name: input.name, content: JSON.stringify(input.content ?? {}) },
      });

      const errs = data.metaobjectCreate.userErrors;
      if (errs && errs.length) {
        throw new Error(`CreatePage error: ${errs.map((e) => e.message).join(", ")}`);
      }
      return data.metaobjectCreate.metaobject as { id?: string } | null;
    }),

  getByHandle: publicProcedure
    .input(z.object({ handle: z.string() }))
    .query(async ({ input }) => {
      const data = await shopifyAdminFetch<{
        metaobjectByHandle: {
          id: string;
          type: string;
          fields: Array<{
            key: string;
            value: string | null;
          }>;
        } | null;
      }>({
        query: GET_PAGE_BY_HANDLE_QUERY,
        variables: { handle: input.handle },
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

  update: publicProcedure
    .input(
      z.object({
        id: z.string(), // Shopify metaobject ID
        name: z.string().optional(),
        content: z.unknown().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Build fields array dynamically
      const fields: Array<{ key: string; value: string }> = [];

      if (input.name !== undefined) {
        fields.push({ key: "name", value: input.name });
      }

      if (input.content !== undefined) {
        fields.push({
          key: "content",
          value: JSON.stringify(input.content ?? {}),
        });
      }

      const data = await shopifyAdminFetch<{
        metaobjectUpdate: {
          metaobject: {
            id: string;
            handle: string;
            type: string;
            fields: Array<{ key: string; value: string | null }>;
          } | null;
          userErrors: Array<{ field: string[] | null; message: string }>;
        };
      }>({
        query: UPDATE_PAGE_MUTATION,
        variables: {
          id: input.id,
          fields,
        },
      });

      const errs = data.metaobjectUpdate.userErrors;
      if (errs && errs.length) {
        throw new Error(
          `UpdatePage error: ${errs.map((e) => e.message).join(", ")}`
        );
      }

      return data.metaobjectUpdate.metaobject;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const data = await shopifyAdminFetch<{
        metaobjectDelete: {
          deletedId: string | null;
          userErrors: Array<{ field: string[] | null; message: string }>;
        };
      }>({
        query: DELETE_PAGE_MUTATION,
        variables: { id: input.id },
      });

      const errs = data.metaobjectDelete.userErrors;
      if (errs && errs.length) {
        throw new Error(`DeletePage error: ${errs.map((e) => e.message).join(", ")}`);
      }
      return { deletedId: data.metaobjectDelete.deletedId };
    }),
});
