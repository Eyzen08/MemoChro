import Link from "next/link";
import { Brand } from "@/components/archive";
export default function Privacy() {
  return (
    <main id="main" className="legal-content">
      <Brand />
      <p className="eyebrow">Privacy notice · Initial release draft</p>
      <h1>Your life belongs to you.</h1>
      <p>
        MemoChro stores the account information and content you choose to
        provide: your email, profile name, memories, photographs, stories,
        albums, people and places. The application uses Supabase for
        authentication, database records and media storage.
      </p>
      <h2>Private by default</h2>
      <p>
        Archive pages require sign-in. Database and storage policies restrict
        access to the account that owns each record. Photographs are held in a
        private bucket and displayed using links that expire after five minutes.
        Anyone you give a valid signed link to can access it until it expires.
        This is not end-to-end encryption.
      </p>
      <h2>Your choices</h2>
      <p>
        Exact locations, names of people, photographs and reflections are
        optional. No GPS permission, facial recognition, contact importing,
        social features or AI analysis is used. You can edit or remove your
        content, download a records-and-photographs archive, and delete your
        account in settings.
      </p>
      <h2>Sessions and device storage</h2>
      <p>
        Authentication uses session cookies. Your color-theme choice is saved on
        your device. Sign out when using a shared device. Downloaded exports are
        unencrypted and remain your responsibility.
      </p>
      <h2>Deletion and retention</h2>
      <p>
        Deleting a memory removes its photographs and database associations.
        Deleting an album, place, person or story keeps the underlying memories.
        Account deletion requires your password and removes active records and
        media. Service-provider backups may retain data according to their
        configured retention; backup retention and operator contact details must
        be finalized before public launch.
      </p>
      <h2>Service operation</h2>
      <p>
        Server errors may be logged for maintenance. Archive content must not be
        included in analytics. Public artwork and fonts are bundled with the
        app. No font requests are sent to third parties. User photographs are
        never used as public artwork.
      </p>
      <p>
        This initial notice describes the implementation and is a draft pending
        the operator’s contact details, jurisdiction, hosting details and
        retention configuration. <Link href="/terms">Read the terms draft</Link>{" "}
        or <Link href="/settings">manage your archive</Link>.
      </p>
    </main>
  );
}
