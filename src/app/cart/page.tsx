import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { formatPrice } from "~/utils/formatPrice";

type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title?: string;
    price?: {
      amount: string;
      currencyCode: string;
    };
    product?: {
      title?: string;
    };
  };
};

export default async function CartPage() {
  let cart;
  try {
    // Let the API manage cart creation and cookies internally
    cart = await api.cart.get();
  } catch (error) {
    console.error("Failed to fetch cart:", error);
    // If the current cart is invalid, rely on API to recreate on next load
    redirect("/cart");
  }

  const lines = cart?.lines?.edges ?? [];
  const subtotal = cart?.cost?.subtotalAmount;
  const total = cart?.cost?.totalAmount;

  async function removeLine(formData: FormData) {
    "use server";
    const lineId = formData.get("lineId") as string;
    // The backend resolves cartId from cookies; no need to read here
    if (!lineId) return;

    try {
      // removeItem will use the cookie-stored cartId
      // If needed, the server can be extended to infer cartId when omitted
      const jarless = await api.cart.get();
      await api.cart.removeItem({ cartId: jarless.id, lineId });
      revalidatePath("/cart");
    } catch (error) {
      console.error("Failed to remove item:", error);
      // Handle error appropriately
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your Cart</h1>

      {lines.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Your cart is empty.</p>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {lines.map(({ node }: { node: CartLine }) => {
              const variant = node.merchandise;
              const product = variant?.product;
              const price = variant?.price;

              return (
                <div
                  key={node.id}
                  className="flex items-center justify-between rounded border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="font-medium">
                        {product?.title ?? variant?.title ?? "Unknown Product"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {node.quantity}
                      </div>
                      {price && (
                        <div className="text-sm font-medium">
                          {formatPrice(price.amount, price.currencyCode)}
                        </div>
                      )}
                    </div>
                  </div>
                  <form action={removeLine}>
                    <input type="hidden" name="lineId" value={node.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 rounded border p-4 h-fit">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {subtotal
                  ? formatPrice(subtotal.amount, subtotal.currencyCode)
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">
                {total ? formatPrice(total.amount, total.currencyCode) : "—"}
              </span>
            </div>
            <Button
              asChild
              className="w-full"
              disabled={!cart?.checkoutUrl || lines.length === 0}
            >
              <Link href={cart?.checkoutUrl ?? "#"}>Proceed to Checkout</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}