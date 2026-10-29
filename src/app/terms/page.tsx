import Link from "next/link";
import { Brand } from "@/components/archive";
export default function Terms() {
  return (
    <main id="main" className="legal-content">
      <Brand />
      <p className="eyebrow">Terms · Initial release draft</p>
      <h1>A home for your memories.</h1>
      <p>
        MemoChro is a private personal archive. Keep your password secure and
        upload only material you have the right to store. You retain ownership
        of your content.
      </p>
      <h2>Keep a copy</h2>
      <p>
        Use archive export to maintain an independent backup. Do not rely on a
        single copy of irreplaceable memories. Deleting content or your account
        is permanent in the active application.
      </p>
      <h2>Responsible use</h2>
      <p>
        Do not use the service to store unlawful content, access another
        person’s archive, bypass access controls, or disrupt the service.
        Storage and upload limits apply.
      </p>
      <h2>Release status</h2>
      <p>
        This is an initial release. Service availability, support, operator
        identity, applicable jurisdiction, and any commercial terms must be
        finalized before public launch. No availability guarantee is made by
        this draft.
      </p>
      <p>
        Read the <Link href="/privacy">privacy notice</Link> for how the
        application handles your information.{" "}
        <Link href="/home">Return to MemoChro</Link>.
      </p>
    </main>
  );
}
