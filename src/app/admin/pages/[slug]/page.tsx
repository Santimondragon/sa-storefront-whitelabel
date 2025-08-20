import EditorClient from "./editorClient";

export default function AdminPageEditor({ params }: { params: { slug: string } }) {
  const { slug } = params;
  return <EditorClient slug={slug} />;
}
