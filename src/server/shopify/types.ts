export type Money = { amount: string; currencyCode: string };

export type ProductListItem = {
  id: string;
  title: string;
  handle: string;
  featuredImage?: { url: string; altText?: string | null } | null;
  priceRange: { minVariantPrice: Money };
};

export type ProductDetail = ProductListItem & {
  description?: string | null;
  images?: { edges: { node: { url: string; altText?: string | null } }[] };
  variants?: { edges: { node: { id: string; title: string; price: Money } }[] };
};
