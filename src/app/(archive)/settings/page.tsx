import Link from "next/link";
import { Download, Users, ArrowUpRight, KeyRound } from "lucide-react";
import { requireUser, check } from "@/lib/supabase";
import { PageHeading } from "@/components/archive";
import { SettingsForm } from "@/components/forms";
export default async function Settings() {
  const { db, user } = await requireUser();
  const profile = await db
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  check(profile.error);
  return (
    <>
      <PageHeading
        title="A space that’s yours."
        description="Your profile, your people, and control of your archive."
      />
      <div className="settings-sections">
        <section>
          <h2>Your profile</h2>
          <p className="muted">Signed in as {user.email}</p>
          <SettingsForm
            kind="profile"
            name={
              profile.data?.display_name ||
              user.user_metadata?.display_name ||
              ""
            }
          />
        </section>
        <section>
          <h2>The people in your life</h2>
          <p className="muted">
            Keep their names close to the moments you share.
          </p>
          <Link className="button secondary" href="/settings/people">
            <Users size={17} />
            Manage people
            <ArrowUpRight size={16} />
          </Link>
        </section>
        <section>
          <h2>Account security</h2>
          <Link className="button secondary" href="/settings/password">
            <KeyRound size={17} />
            Change password
          </Link>
        </section>
        <section>
          <h2>Take your memories with you</h2>
          <p className="muted">
            Download a TAR archive containing your records as JSON and the
            original photographs. Keep it somewhere safe; the downloaded archive
            is unencrypted.
          </p>
          <a className="button secondary" href="/export" download>
            <Download size={17} />
            Export my archive
          </a>
        </section>
        <section className="danger-section">
          <h2>Close this chapter</h2>
          <p className="muted">
            Account deletion is permanent. Keep a copy of your archive before
            continuing.
          </p>
          <details>
            <summary>Delete my account</summary>
            <SettingsForm kind="delete" />
          </details>
        </section>
      </div>
    </>
  );
}
