export type ShopifyFetchParams<V> = {
  query: string;
  variables?: V;
  headers?: Record<string, string>;
};

const getStoreUrl = () => {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is not set");
  const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || "2025-07";
  return `https://${domain}/api/${version}/graphql.json`;
};

const getAccessToken = () => {
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!token) throw new Error("SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set");
  return token;
};

export async function shopifyFetch<T, V = Record<string, unknown>>({
  query,
  variables,
  headers = {},
}: ShopifyFetchParams<V>): Promise<T> {
  const res = await fetch(getStoreUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": getAccessToken(),
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
    // Important for Next.js server runtime
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify request failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  if (!json.data) throw new Error("No data returned from Shopify");
  return json.data;
}

// ===== Admin API client (reusable) =====
export type ShopifyAdminFetchParams<V> = ShopifyFetchParams<V>;

const getAdminUrl = () => {
  const domain = (process.env.SHOPIFY_STORE_DOMAIN ?? "").trim();
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is not set");
  const normalized = domain.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const version = process.env.SHOPIFY_ADMIN_API_VERSION || "2025-07";
  return `https://${normalized}/admin/api/${version}/graphql.json`;
};

const getAdminToken = () => {
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
  if (!token) throw new Error("SHOPIFY_ADMIN_API_TOKEN is not set");
  return token;
};

export async function shopifyAdminFetch<T, V = Record<string, unknown>>({
  query,
  variables,
  headers = {},
}: ShopifyAdminFetchParams<V>): Promise<T> {
  const res = await fetch(getAdminUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": getAdminToken(),
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify Admin request failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors) {
    throw new Error(`Shopify Admin GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  if (!json.data) throw new Error("No data returned from Shopify Admin");
  return json.data;
}
