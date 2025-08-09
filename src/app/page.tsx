import { api } from "~/trpc/server";
import ProductGrid from "~/components/ProductGrid";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await api.product.getAll({ first: 8 });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Featured Products</h1>
      <ProductGrid products={products} />
    </div>
  );
}
