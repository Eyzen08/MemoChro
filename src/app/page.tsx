import Link from "next/link";
import { ArrowUpRight, Plus, LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { configured, supabase } from "@/lib/supabase";
import { Brand } from "@/components/archive";
import { PhotoComposition, SampleMemories, FeaturePreviews } from "@/components/editorial";
import { ThemeToggle } from "@/components/forms";
import styles from "@/components/editorial.module.css";

export default async function Welcome({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  if (configured()) {
    const db = await supabase();
    const { data: { user } } = await db.auth.getUser();
    if (user) redirect("/home");
  }
  const deleted = (await searchParams).deleted;
  return (
    <div className={`public-page ${styles.landing}`}>
      <header className="public-header">
        <Brand href="/" />
        <nav aria-label="Discover MemoChro" className={styles.discoverNav}>
          <a href="#how-it-works">How it works</a>
          <a href="#sample-archive">A sample life</a>
        </nav>
        <nav aria-label="Account">
          <ThemeToggle />
          <Link href="/login">Sign in</Link>
          <Link className="button paper" href="/signup">Begin your chronicle <ArrowUpRight size={16} /></Link>
        </nav>
      </header>
      <main id="main">
        {deleted && <p className="feedback success">Your account and archive have been deleted.</p>}
        <section className={styles.hero} aria-labelledby="welcome-title">
          <div className={styles.heroCopy}>
            <p className={styles.kicker}><span className="tiny-line" />A private chronicle of you</p>
            <h1 id="welcome-title">Your life,<br /><em>through time.</em></h1>
            <p>The journeys. The people. The ordinary days.<br />A beautiful home for the moments that make your life yours.</p>
            <div className={styles.actions}>
              <Link className="button paper" href="/signup"><Plus size={18} />Start preserving <ArrowUpRight size={17} /></Link>
              <Link className={styles.textLink} href="/demo">Explore sample archive <ArrowUpRight size={17} /></Link>
            </div>
            <span className="private-note"><LockKeyhole size={13} />Your life. Your eyes only.</span>
          </div>
          <PhotoComposition />
        </section>
        <div className={styles.heroFootnote}><span>A place for the big days. And the days in between.</span><span>Photographs / People / Places / Stories</span></div>
        <SampleMemories />
        <FeaturePreviews />
        <section className={styles.closing} aria-labelledby="closing-title">
          <span className={styles.kicker}>Begin with one moment</span>
          <h2 id="closing-title">Someday, these will be<br /><em>the days you come back to.</em></h2>
          <p>Make a little room for them.</p>
          <Link className="button paper" href="/signup">Begin your chronicle <ArrowUpRight size={17} /></Link>
        </section>
      </main>
      <footer className="public-footer">
        <span>MemoChro · Made for a life worth remembering.</span>
        <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </footer>
    </div>
  );
}
