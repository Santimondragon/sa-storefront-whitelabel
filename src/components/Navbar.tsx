"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "~/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function Navbar() {
  const pathname = usePathname();
  const link = (href: string, label: string) => (
    <Link href={href} className={`px-3 py-2 ${pathname === href ? "font-semibold" : "text-muted-foreground"}`}>
      {label}
    </Link>
  );
  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-bold">Storefront</Link>
        <nav className="flex items-center gap-2">
          {link("/", "Home")}
          {link("/products", "Products")}
          {link("/admin", "Admin")}
          <Link href="/cart">
            <Button size="sm" variant="outline"><ShoppingCart className="mr-2 h-4 w-4"/>Cart</Button>
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm">Sign in</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton appearance={{ elements: { userButtonPopoverCard: "min-w-[220px]" } }} />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
export default Navbar;
