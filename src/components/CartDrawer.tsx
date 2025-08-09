"use client";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">Cart</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>
        <div className="py-4 text-sm text-muted-foreground">Cart items will appear here.</div>
        <Link href="/cart" onClick={() => setOpen(false)}>
          <Button className="w-full">Go to Cart</Button>
        </Link>
      </SheetContent>
    </Sheet>
  );
}
