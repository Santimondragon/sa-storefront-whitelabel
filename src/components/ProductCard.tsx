"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { formatPrice } from "~/utils/formatPrice";
import { api } from "~/trpc/react";
import { Trash } from "lucide-react";

type Props = {
  product: {
    id: string;
    title: string;
    handle: string;
    featuredImage?: { url: string; altText?: string | null } | null;
    priceRange?: { minVariantPrice?: { amount: string; currencyCode: string } };
    variants?: { edges?: Array<{ node: { id: string } }> };
  };
};

export default function ProductCard({ product }: Props) {
  const imageUrl = product.featuredImage?.url;
  const price = product.priceRange?.minVariantPrice;
  const variantId = product.variants?.edges?.[0]?.node?.id;

  // Cart data via TRPC React
  const { data: cart, isLoading: cartLoading } = api.cart.get.useQuery();
  const utils = api.useUtils();
  const addItem = api.cart.addItem.useMutation({
    onSuccess: async () => {
      await utils.cart.get.invalidate();
    },
  });
  const updateItem = api.cart.updateItem.useMutation({
    onSuccess: async () => {
      await utils.cart.get.invalidate();
    },
  });

  // Find existing line for this product (by variant id if available, else by handle)
  const line = useMemo(() => {
    const edges = cart?.lines?.edges ?? [];
    if (!edges.length) return undefined;
    if (variantId) {
      return edges.find((e: any) => e.node.merchandise?.id === variantId)?.node;
    }
    return edges.find((e: any) => e.node.merchandise?.product?.handle === product.handle)?.node;
  }, [cart, product.handle, variantId]);

  const [qty, setQty] = useState<number>(line?.quantity ?? 0);
  useEffect(() => {
    setQty(line?.quantity ?? 0);
  }, [line?.quantity]);

  const pending = addItem.isPending || updateItem.isPending || cartLoading;

  const handleAdd = async () => {
    if (!cart?.id || !variantId) return;
    await addItem.mutateAsync({ cartId: cart.id, merchandiseId: variantId, quantity: 1 });
  };

  const commitQty = async (next: number) => {
    if (!cart?.id || !line?.id) return;
    // Clamp to >= 0 and reasonable max
    const clamped = Math.max(0, Math.min(999, Math.floor(next)));
    setQty(clamped);
    await updateItem.mutateAsync({ cartId: cart.id, lineId: line.id, quantity: clamped });
  };

  const dec = () => {
    if (!line) return;
    const next = (qty || 0) - 1;
    void commitQty(next);
  };

  const inc = () => {
    if (!line) return;
    const next = (qty || 0) + 1;
    void commitQty(next);
  };

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const v = e.target.value.replace(/[^0-9]/g, "");
    setQty(v === "" ? 0 : Number(v));
  };

  const onInputBlur: React.FocusEventHandler<HTMLInputElement> = () => {
    if (!line) return;
    void commitQty(qty);
  };
  return (
    <Card className="overflow-hidden">
      <Link href={`/products/${product.handle}`}>
        <CardHeader className="p-0">
          {imageUrl ? (
            <Image src={imageUrl} alt={product.title} width={600} height={600} className="h-60 w-full object-cover" />
          ) : (
            <div className="h-60 w-full bg-muted" />
          )}
        </CardHeader>
      </Link>
      <CardContent className="p-4">
        <CardTitle className="line-clamp-1 text-base">{product.title}</CardTitle>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <span className="text-sm text-muted-foreground">
          {price ? formatPrice(price.amount, price.currencyCode) : ""}
        </span>
        {line ? (
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={pending}
              onClick={dec}
              aria-label={qty <= 1 ? "Remove from cart" : "Decrease quantity"}
              title={qty <= 1 ? "Remove" : "-1"}
            >
              {qty <= 1 ? <Trash className="h-4 w-4" /> : <span className="text-lg leading-none">-</span>}
            </Button>
            <Input
              className="h-8 w-14 text-center"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qty}
              onChange={onInputChange}
              onBlur={onInputBlur}
              disabled={pending}
            />
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={pending}
              onClick={inc}
              aria-label="Increase quantity"
              title="+1"
            >
              <span className="text-lg leading-none">+</span>
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={handleAdd} disabled={pending || !variantId}>
            Add to cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
