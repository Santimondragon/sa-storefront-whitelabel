export const GET_PRODUCT_BY_HANDLE = /* GraphQL */ `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      featuredImage { url altText }
      images(first: 10) { edges { node { url altText } } }
      variants(first: 10) {
        edges { node { id title price { amount currencyCode } } }
      }
      priceRange { minVariantPrice { amount currencyCode } }
    }
  }
`;
