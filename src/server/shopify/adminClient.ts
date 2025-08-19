export type ShopifyAdminFetchParams<V> = {
  query: string;
  variables?: V;
  headers?: Record<string, string>;
};

const getAdminUrl = () => {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is not set");
  // Normalize domain: remove protocol and any trailing slash
  const normalized = domain
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
  const version = process.env.SHOPIFY_ADMIN_API_VERSION || "2024-10";
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

// Minimal staged upload flow for images -> returns created file ID
export async function uploadImageAndCreateFile(params: {
  filename: string;
  mimeType: string;
  fileBuffer: Buffer;
}): Promise<{ fileId: string }> {
  // 1) stagedUploadsCreate
  const staged = await shopifyAdminFetch<{
    stagedUploadsCreate: {
      stagedTargets: Array<{
        url: string;
        resourceUrl: string;
        parameters: Array<{ name: string; value: string }>;
      }>;
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  }>({
    query: `#graphql
      mutation StagedUploads($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets { url resourceUrl parameters { name value } }
          userErrors { field message }
        }
      }
    `,
    variables: {
      input: [
        {
          resource: "FILE",
          filename: params.filename,
          mimeType: params.mimeType,
          httpMethod: "POST",
        },
      ],
    },
  });

  const target = staged.stagedUploadsCreate.stagedTargets[0];
  if (!target) throw new Error("Failed to get staged upload target");

  // 2) POST to S3
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([params.fileBuffer], { type: params.mimeType }), params.filename);
  const uploadRes = await fetch(target.url, { method: "POST", body: form });
  if (!uploadRes.ok) throw new Error(`Failed S3 upload: ${uploadRes.statusText}`);

  // 3) fileCreate from resourceUrl
  const created = await shopifyAdminFetch<{
    fileCreate: {
      files: Array<{ id: string }>;
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  }>({
    query: `#graphql
      mutation FileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) { files { id } userErrors { field message } }
      }
    `,
    variables: {
      files: [
        {
          originalSource: target.resourceUrl,
          contentType: "IMAGE",
        },
      ],
    },
  });

  const fileId = created.fileCreate.files[0]?.id;
  if (!fileId) throw new Error("fileCreate did not return an ID");
  return { fileId };
}
