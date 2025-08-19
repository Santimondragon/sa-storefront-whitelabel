"use client";

import ProductCard from "./ProductCard";
import { useMemo } from "react";
import { useCart } from "~/contexts/CartProvider";

type Props = { products: any[] };

export default function ProductGrid({ products }: Props) {
  const { cart, pending, addItem, updateItem } = useCart();

  // Build quick lookup maps for lines by variant id and by product handle
  const { byVariantId, byHandle } = useMemo(() => {
    const edges: any[] = cart?.lines?.edges ?? [];
    const _byVariantId = new Map<string, any>();
    const _byHandle = new Map<string, any>();
    for (const e of edges) {
      const node = e?.node;
      const merch = node?.merchandise;
      const vId = merch?.id as string | undefined;
      const handle = merch?.product?.handle as string | undefined;
      if (vId) _byVariantId.set(vId, node);
      if (handle) _byHandle.set(handle, node);
    }
    return { byVariantId: _byVariantId, byHandle: _byHandle };
  }, [cart]);

  const onAdd = async (merchandiseId: string) => {
    await addItem(merchandiseId, 1);
  };

  const onUpdateLine = async (lineId: string, quantity: number) => {
    await updateItem(lineId, quantity);
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => {
        const variantId: string | undefined = p?.variants?.edges?.[0]?.node?.id;
        const line = variantId ? byVariantId.get(variantId) : byHandle.get(p.handle);
        return (
          <ProductCard
            key={p.id}
            product={p}
            line={line}
            pending={pending}
            onAdd={onAdd}
            onUpdateLine={onUpdateLine}
          />
        );
      })}
    </div>
  );
}
