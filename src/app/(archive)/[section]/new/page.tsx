import { EditorPage } from "@/components/editors";
export default async function NewPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  return <EditorPage kind={(await params).section} />;
}
