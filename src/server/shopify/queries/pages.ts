export const CREATE_PAGE_MUTATION = /* GraphQL */ `
  mutation CreatePage($title: String!, $slug: String!) {
    metaobjectCreate(
      metaobject: {
        type: "custom_page"
        handle: $slug
        fields: [
          { key: "title", value: $title }
          { key: "slug", value: $slug }
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
          {
            name: "Title"
            key: "title"
            type: "single_line_text_field"
          }
          {
            name: "Slug"
            key: "slug"
            type: "single_line_text_field"
          }
          {
            name: "Sections (refs)"
            key: "sections_refs"
            type: "list.metaobject_reference"
            description: "List of section metaobject references"
          }
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

export const GET_PAGE_BY_SLUG_QUERY = /* GraphQL */ `
  query GetPageBySlug($slug: String!) {
    metaobjectByHandle(handle: { type: "custom_page", handle: $slug }) {
      id
      handle
      type
      fields {
        key
        value
        references(first: 50) {
          nodes {
            ... on Metaobject {
              id
              type
              fields {
                key
                value
              }
            }
          }
        }
      }
    }
  }
`;

// Used after creating a page, to set only references on the sections field
export const UPDATE_PAGE_SECTIONS_WITH_REFS = /* GraphQL */ `
  mutation UpdatePageSections($id: ID!, $sectionsJson: String!) {
    metaobjectUpdate(
      id: $id
      metaobject: {
        fields: [
          { key: "sections_refs", value: $sectionsJson }
        ]
      }
    ) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

// Used by updateSections procedure, includes value field shape
export const UPDATE_PAGE_SECTIONS = /* GraphQL */ `
  mutation UpdatePageSections($id: ID!, $sectionsJson: String!) {
    metaobjectUpdate(
      id: $id
      metaobject: { fields: [{ key: "sections_refs", value: $sectionsJson }] }
    ) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;
