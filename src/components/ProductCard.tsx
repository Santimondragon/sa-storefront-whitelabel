"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { formatPrice } from "~/utils/formatPrice";
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
  line?: { id: string; quantity: number } | any;
  pending: boolean;
  onAdd: (merchandiseId: string) => Promise<void> | void;
  onUpdateLine: (lineId: string, quantity: number) => Promise<void> | void;
};

export default function ProductCard({ product, line, pending, onAdd, onUpdateLine }: Props) {
  const imageUrl = product.featuredImage?.url;
  const price = product.priceRange?.minVariantPrice;
  const variantId = product.variants?.edges?.[0]?.node?.id;

  const [qty, setQty] = useState<number>(line?.quantity ?? 0);
  useEffect(() => {
    setQty(line?.quantity ?? 0);
  }, [line?.quantity]);

  const handleAdd = async () => {
    if (!variantId) return;
    await onAdd(variantId);
  };

  const commitQty = async (next: number) => {
    if (!line?.id) return;
    // Clamp to >= 0 and reasonable max
    const clamped = Math.max(0, Math.min(999, Math.floor(next)));
    setQty(clamped);
    await onUpdateLine(line.id, clamped);
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
