import { EditorPage } from "@/components/editors";
import { DeleteForm } from "@/components/forms";
import { requireUser, check } from "@/lib/supabase";
import { uuid } from "@/lib/validation";
import { notFound } from "next/navigation";
export default async function Person({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    uuid(id);
  } catch {
    notFound();
  }
  const { db } = await requireUser();
  const p = await db.from("people").select("name").eq("id", id).maybeSingle();
  check(p.error);
  if (!p.data) notFound();
  return (
    <>
      <EditorPage kind="people" id={id} />
      <DeleteForm kind="people" id={id} title={p.data.name} />
    </>
  );
}
