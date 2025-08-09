import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { shopifyFetch } from "~/server/shopify/client";
import { GET_PRODUCTS } from "~/server/shopify/queries/getProducts";
import { GET_PRODUCT_BY_HANDLE } from "~/server/shopify/queries/getProductByHandle";

export const productRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ first: z.number().min(1).max(50).default(10) }).optional())
    .query(async ({ input }) => {
      const data = await shopifyFetch<{ products: { edges: { node: any }[] } }>({
        query: GET_PRODUCTS,
        variables: { first: input?.first ?? 10 },
      });
      return data.products.edges.map((e) => e.node);
    }),

  getByHandle: publicProcedure
    .input(z.object({ handle: z.string().min(1) }))
    .query(async ({ input }) => {
      const data = await shopifyFetch<{ product: any }>({
        query: GET_PRODUCT_BY_HANDLE,
        variables: { handle: input.handle },
      });
      return data.product;
    }),
});
