import { z } from "zod";
import { cookies } from "next/headers";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { shopifyFetch } from "~/server/shopify/client";
import {
  CART_CREATE,
  CART_QUERY,
  CART_LINES_ADD,
  CART_LINES_REMOVE,
  CART_LINES_UPDATE,
} from "~/server/shopify/queries/createCheckout";

// Add proper types
interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: {
      amount: string;
      currencyCode: string;
    };
    product: {
      title: string;
    };
  };
}

interface Cart {
  id: string;
  checkoutUrl: string;
  lines: {
    edges: Array<{ node: CartLine }>;
  };
  cost: {
    subtotalAmount: {
      amount: string;
      currencyCode: string;
    };
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
}

export const cartRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ cartId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const jar = await cookies();
      let cartId = input?.cartId || jar.get("cartId")?.value;

      if (!cartId) {
        const created = await shopifyFetch<{
          cartCreate: { cart: Cart; userErrors: any[] };
        }>({
          query: CART_CREATE,
          variables: { lines: [] },
        });

        if (created.cartCreate.userErrors?.length > 0) {
          throw new Error(
            `Cart creation failed: ${JSON.stringify(
              created.cartCreate.userErrors
            )}`
          );
        }

        // Set cookie for the new cart
        jar.set("cartId", created.cartCreate.cart.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return created.cartCreate.cart;
      }

      const data = await shopifyFetch<{ cart: Cart }>({
        query: CART_QUERY,
        variables: { id: cartId },
      });

      if (!data.cart) {
        // Cart doesn't exist, create a new one
        jar.delete("cartId");
        
        // Create new cart directly instead of recursive call
        const created = await shopifyFetch<{
          cartCreate: { cart: Cart; userErrors: any[] };
        }>({
          query: CART_CREATE,
          variables: { lines: [] },
        });

        if (created.cartCreate.userErrors?.length > 0) {
          throw new Error(
            `Cart creation failed: ${JSON.stringify(
              created.cartCreate.userErrors
            )}`
          );
        }

        // Set cookie for the new cart
        jar.set("cartId", created.cartCreate.cart.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return created.cartCreate.cart;
      }

      return data.cart;
    }),

  addItem: publicProcedure
    .input(
      z.object({
        cartId: z.string(),
        merchandiseId: z.string(),
        quantity: z.number().min(1).default(1),
      })
    )
    .mutation(async ({ input }) => {
      const data = await shopifyFetch<{
        cartLinesAdd: { cart: Cart; userErrors: any[] };
      }>({
        query: CART_LINES_ADD,
        variables: {
          cartId: input.cartId,
          lines: [
            { merchandiseId: input.merchandiseId, quantity: input.quantity },
          ],
        },
      });

      if (data.cartLinesAdd.userErrors?.length > 0) {
        throw new Error(
          `Add to cart failed: ${JSON.stringify(
            data.cartLinesAdd.userErrors
          )}`
        );
      }

      return data.cartLinesAdd.cart;
    }),

  removeItem: publicProcedure
    .input(z.object({ cartId: z.string(), lineId: z.string() }))
    .mutation(async ({ input }) => {
      const data = await shopifyFetch<{
        cartLinesRemove: { cart: Cart; userErrors: any[] };
      }>({
        query: CART_LINES_REMOVE,
        variables: { cartId: input.cartId, lineIds: [input.lineId] },
      });

      if (data.cartLinesRemove.userErrors?.length > 0) {
        throw new Error(
          `Remove from cart failed: ${JSON.stringify(
            data.cartLinesRemove.userErrors
          )}`
        );
      }

      return data.cartLinesRemove.cart;
    }),

  updateItem: publicProcedure
    .input(
      z.object({
        cartId: z.string(),
        lineId: z.string(),
        quantity: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      // If quantity is 0, delegate to removeItem behavior for simplicity
      if (input.quantity === 0) {
        const data = await shopifyFetch<{
          cartLinesRemove: { cart: Cart; userErrors: any[] };
        }>({
          query: CART_LINES_REMOVE,
          variables: { cartId: input.cartId, lineIds: [input.lineId] },
        });

        if (data.cartLinesRemove.userErrors?.length > 0) {
          throw new Error(
            `Remove from cart failed: ${JSON.stringify(
              data.cartLinesRemove.userErrors
            )}`
          );
        }

        return data.cartLinesRemove.cart;
      }

      const data = await shopifyFetch<{
        cartLinesUpdate: { cart: Cart; userErrors: any[] };
      }>({
        query: CART_LINES_UPDATE,
        variables: {
          cartId: input.cartId,
          lines: [{ id: input.lineId, quantity: input.quantity }],
        },
      });

      if (data.cartLinesUpdate.userErrors?.length > 0) {
        throw new Error(
          `Update cart failed: ${JSON.stringify(
            data.cartLinesUpdate.userErrors
          )}`
        );
      }

      return data.cartLinesUpdate.cart;
    }),
});