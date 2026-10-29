import { requireUser, check } from "@/lib/supabase";
import { ArchiveShell } from "@/components/archive-shell";
export const dynamic = "force-dynamic";
export default async function ArchiveLayout({children}: {children: React.ReactNode}) {
  const { db, user } = await requireUser();
  const profile = await db.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
  check(profile.error);
  return <ArchiveShell name={profile.data?.display_name || user.user_metadata?.display_name || "Your archive"}>{children}</ArchiveShell>;
}
