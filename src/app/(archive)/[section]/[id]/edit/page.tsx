import { EditorPage } from "@/components/editors";
export default async function EditPage({
  params,
}: {
  params: Promise<{ section: string; id: string }>;
}) {
  const { section, id } = await params;
  return <EditorPage kind={section} id={id} />;
}
