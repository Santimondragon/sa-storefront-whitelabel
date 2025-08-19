export const CREATE_PAGE_MUTATION = /* GraphQL */ `
  mutation CreatePage($name: String!, $content: String!) {
    metaobjectCreate(
      metaobject: {
        type: "custom_page"
        fields: [
          { key: "name", value: $name }
          { key: "content", value: $content }
        ]
      }
    ) {
      metaobject {
        id
        handle
        type
        fields {
          key
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const GET_PAGES_QUERY = /* GraphQL */ `
  query GetPages($first: Int!) {
    metaobjects(type: "custom_page", first: $first) {
      nodes {
        id
        handle
        type
        fields {
          key
          value
        }
      }
    }
  }
`;

export const CREATE_PAGE_DEFINITION_MUTATION = /* GraphQL */ `
  mutation CreatePageDefinition {
    metaobjectDefinitionCreate(
      definition: {
        name: "Custom Page"
        type: "custom_page"
        fieldDefinitions: [
          { name: "Name", key: "name", type: "single_line_text_field" }
          { name: "Content", key: "content", type: "single_line_text_field" }
        ]
      }
    ) {
      metaobjectDefinition {
        id
        name
        type
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const GET_PAGE_BY_HANDLE_QUERY = /* GraphQL */ `
  query GetPageByHandle($handle: String!) {
    metaobjectByHandle(handle: { type: "custom_page", handle: $handle }) {
      id
      handle
      type
      fields {
        key
        value
      }
    }
  }
`;

export const DELETE_PAGE_MUTATION = /* GraphQL */ `
  mutation DeletePage($id: ID!) {
    metaobjectDelete(id: $id) {
      deletedId
      userErrors {
        field
        message
      }
    }
  }
`;

