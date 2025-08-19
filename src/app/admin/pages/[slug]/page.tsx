import EditorClient from "./editorClient";

export default async function AdminPageEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EditorClient slug={slug} />;
}
