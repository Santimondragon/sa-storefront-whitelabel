import { api } from "~/trpc/server";
import ProductGrid from "~/components/ProductGrid";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await api.product.getAll({ first: 12 });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Products</h1>
      <ProductGrid products={products} />
    </div>
  );
}
