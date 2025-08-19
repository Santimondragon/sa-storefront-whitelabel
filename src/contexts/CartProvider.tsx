"use client";

import React, { createContext, useContext, useMemo } from "react";
import { api } from "~/trpc/react";

export type CartContextValue = {
  cart: any | undefined;
  pending: boolean;
  addItem: (merchandiseId: string, quantity?: number) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  invalidate: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: cart, isLoading } = api.cart.get.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const utils = api.useUtils();
  const addItemMut = api.cart.addItem.useMutation({
    onSuccess: async () => {
      await utils.cart.get.invalidate();
    },
  });
  const updateItemMut = api.cart.updateItem.useMutation({
    onSuccess: async () => {
      await utils.cart.get.invalidate();
    },
  });
  const removeItemMut = api.cart.removeItem.useMutation({
    onSuccess: async () => {
      await utils.cart.get.invalidate();
    },
  });

  // Only mutation pending should block interactions; allow actions even while initial query is loading
  const pending = addItemMut.isPending || updateItemMut.isPending || removeItemMut.isPending;

  const value = useMemo<CartContextValue>(() => ({
    cart,
    pending,
    addItem: async (merchandiseId: string, quantity = 1) => {
      const id = cart?.id ?? (await utils.cart.get.fetch())?.id;
      if (!id) return;
      await addItemMut.mutateAsync({ cartId: id, merchandiseId, quantity });
    },
    updateItem: async (lineId: string, quantity: number) => {
      const id = cart?.id ?? (await utils.cart.get.fetch())?.id;
      if (!id) return;
      await updateItemMut.mutateAsync({ cartId: id, lineId, quantity });
    },
    removeItem: async (lineId: string) => {
      const id = cart?.id ?? (await utils.cart.get.fetch())?.id;
      if (!id) return;
      await removeItemMut.mutateAsync({ cartId: id, lineId });
    },
    invalidate: async () => {
      await utils.cart.get.invalidate();
    },
  }), [cart, pending, addItemMut, updateItemMut, removeItemMut, utils.cart.get]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
