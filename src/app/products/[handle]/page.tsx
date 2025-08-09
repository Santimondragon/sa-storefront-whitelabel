import Image from "next/image";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { formatPrice } from "~/utils/formatPrice";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await api.product.getByHandle({ handle });
  const price = product?.priceRange?.minVariantPrice;
  const firstVariant = product?.variants?.edges?.[0]?.node;

  // Get or create cart at the page level
  const jar = await cookies();
  let cartId = jar.get("cartId")?.value;

  if (!cartId) {
    const cart = await api.cart.get();
    cartId = cart.id;
  }

  async function addToCart() {
    "use server";

    if (!firstVariant || !cartId) return;

    await api.cart.addItem({
      cartId,
      merchandiseId: firstVariant.id as string,
      quantity: 1,
    });

    revalidatePath("/cart");
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        {product?.featuredImage?.url && (
          <Image
            src={product.featuredImage.url}
            alt={product.title}
            width={800}
            height={800}
            className="w-full rounded"
          />
        )}
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{product?.title}</h1>
        {price && (
          <div className="text-xl text-muted-foreground">
            {formatPrice(price.amount, price.currencyCode)}
          </div>
        )}
        <p className="text-sm leading-6 text-muted-foreground">
          {product?.description}
        </p>
        {firstVariant && (
          <form action={addToCart}>
            <Button type="submit">Add to cart</Button>
          </form>
        )}
      </div>
    </div>
  );
}