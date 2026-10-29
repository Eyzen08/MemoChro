import Link from "next/link";
import {
  ArrowUpRight,
  Plus,
  LockKeyhole,
  Clock3,
  BookOpen,
  Layers,
} from "lucide-react";
import { redirect } from "next/navigation";
import { configured, supabase } from "@/lib/supabase";
import { Brand, PrintStack } from "@/components/archive";
import { SamplePhoto } from "@/components/sample-photo";
import { ThemeToggle } from "@/components/forms";
export default async function Welcome({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  if (configured()) {
    const db = await supabase();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (user) redirect("/home");
  }
  const deleted = (await searchParams).deleted;
  return (
    <div className="public-page">
      <header className="public-header">
        <Brand />
        <nav aria-label="Account">
          <ThemeToggle />
          <Link href="/login">Sign in</Link>
          <Link className="button paper" href="/signup">
            Begin your chronicle
            <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>
      <main id="main">
        {deleted && (
          <p className="feedback success">
            Your account and archive have been deleted.
          </p>
        )}
        <section className="welcome-hero">
          <div className="welcome-copy">
            <p className="eyebrow">
              <span className="tiny-line" />A private chronicle of you
            </p>
            <h1>
              Your life,
              <br />
              through time.
            </h1>
            <p>
              The journeys. The people. The ordinary days.
              <br />A beautiful, private home for the moments
              <br className="desktop-break" /> that make your life yours.
            </p>
            <Link className="button paper" href="/signup">
              <Plus size={18} />
              Start preserving
              <ArrowUpRight size={18} />
            </Link>
            <span className="private-note">
              <LockKeyhole size={12} />
              Personal by nature. Private by default.
            </span>
          </div>
          <PrintStack />
        </section>
        <section className="public-sample" aria-labelledby="sample-title">
          <div className="sample-section-heading"><div><h2 id="sample-title">A little life, ready to explore.</h2><p>A sample archive with fictional memories and licensed photography. Follow the moments, meet the people, read the stories.</p></div><Link className="button secondary" href="/demo">Explore the sample archive <ArrowUpRight size={18} /></Link></div>
          <div className="sample-strip">{[["dinner", "Sunday, with room for everyone", "sunday-table"], ["baking", "The beautiful ordinary", "flour-everywhere"], ["beach", "We stayed for the last light", "last-light"]].map(([name,title,id]) => <Link key={id} href={"/demo/memories/"+id}><SamplePhoto name={name} alt={title} /><span>Sample memory</span><h3>{title}</h3></Link>)}</div>
        </section>
        <section className="public-features">
          <div>
            <Clock3 strokeWidth={1.2} />
            <h2>A thread through time.</h2>
            <p>
              Revisit your life as it happened, one meaningful moment at a time.
            </p>
          </div>
          <div>
            <Layers strokeWidth={1.2} />
            <h2>The chapters, collected.</h2>
            <p>
              Bring photographs, places and people together into albums that
              feel like you.
            </p>
          </div>
          <div>
            <BookOpen strokeWidth={1.2} />
            <h2>Room for the whole story.</h2>
            <p>
              Keep the details a photograph can’t hold. In your words, at your
              own pace.
            </p>
          </div>
        </section>
      </main>
      <footer className="public-footer">
        <span>MemoChro · Made for a life worth remembering.</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
