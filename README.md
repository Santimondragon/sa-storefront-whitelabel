# T3 Storefront (Next.js App Router + tRPC + Tailwind + Clerk + Shopify)

Full-stack e-commerce storefront built on the T3 Stack (Next.js App Router, tRPC, Tailwind CSS, TypeScript) with Clerk authentication and Shopify Storefront API integration.

## Features

- App Router (RSC) with tRPC server calls
- Clerk authentication (Sign-in/Sign-up, `/admin` protected)
- Shopify Storefront GraphQL (products, product detail, cart operations)
- Tailwind + shadcn/ui components
- Ready for Vercel deployment

## Project Structure

```
src/
  app/
    (auth)/sign-in/[[...sign-in]]/page.tsx
    (auth)/sign-up/[[...sign-up]]/page.tsx
    admin/page.tsx
    cart/page.tsx
    products/page.tsx
    products/[handle]/page.tsx
    layout.tsx
    page.tsx
  components/
    Navbar.tsx
    Footer.tsx
    ProductCard.tsx
    ProductGrid.tsx
    CartDrawer.tsx
  server/
    api/
      routers/
        product.ts
        cart.ts
      root.ts
      trpc.ts
    shopify/
      client.ts
      types.ts
      queries/
        getProducts.ts
        getProductByHandle.ts
        createCheckout.ts
  utils/formatPrice.ts
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

SHOPIFY_STORE_DOMAIN=your-shop.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
```

These are validated in `src/env.js` via `@t3-oss/env-nextjs`.

## Shopify Setup

1. In your Shopify admin, create a Storefront API access token.
2. Note your shop domain (e.g. `your-shop.myshopify.com`).
3. Add both to `.env`.

## Clerk Setup

1. Create a Clerk application at https://clerk.com/
2. In Clerk dashboard, copy the Publishable Key and Secret Key into `.env`.
3. To mark an account as admin, set `publicMetadata.role = "admin"` for that user in Clerk.

## Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## tRPC

- Router root: `src/server/api/root.ts`
- Product endpoints: `src/server/api/routers/product.ts`
- Cart endpoints: `src/server/api/routers/cart.ts`

## Images

`next.config.js` is configured to load images from `cdn.shopify.com`.

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import to Vercel
3. Set the same environment variables in Vercel dashboard
4. Deploy

## Notes

- Admin page is protected by Clerk and additionally checks `publicMetadata.role === "admin"`.
- Cart UI is minimal; server-side cart operations exist in tRPC and can be wired to client state (cookies or server actions) as needed.
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
