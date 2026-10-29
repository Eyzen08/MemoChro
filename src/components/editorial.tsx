import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock3, Layers, LockKeyhole } from "lucide-react";
import { sampleMemories } from "@/lib/sample-archive";
import { SamplePhoto } from "./sample-photo";
import styles from "./editorial.module.css";

export function PhotoComposition() {
  return (
    <div className={styles.composition}>
      <div className={styles.photoFrame}>
        <SamplePhoto name="picnic" alt="Friends sharing a picnic as the afternoon turns to evening" priority />
        <div className={styles.photoCaption}><span>An afternoon with nothing planned</span><span>June ’26</span></div>
      </div>
      <div className={styles.insetFrame}>
        <SamplePhoto name="beach" alt="Friends walking along the beach at sunset" />
        <span>We stayed for the last light.</span>
      </div>
      <span className={styles.photoIndex}>A glimpse of what you could keep</span>
    </div>
  );
}

export function SampleMemories({ home = false }: { home?: boolean }) {
  const title = home ? "Imagine your archive" : "The ordinary. The unforgettable.";
  return (
    <section className={styles.sampleSection} aria-labelledby={home ? "home-sample-title" : "sample-title"} id={home ? undefined : "sample-archive"}>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.kicker}>{home ? "A little inspiration" : "Every life has its moments"}</span>
          <h2 id={home ? "home-sample-title" : "sample-title"}>{title}</h2>
          <p>{home ? "Fictional memories to inspire your first chapter. Your own memories will live above." : "A Sunday table. A flour-covered kitchen. An evening you wished would last. There’s a place for all of it."}</p>
        </div>
        <Link className={styles.textLink} href="/demo">Explore the sample archive <ArrowUpRight size={17} /></Link>
      </div>
      <div className={styles.sampleGrid}>
        {(["dinner", "baking", "beach"] as const).map((photo, index) => {
          const memory = sampleMemories[index === 2 ? 3 : index];
          return (
            <Link className={styles.sampleCard} href={`/demo/memories/${memory.id}`} key={memory.id}>
              <div className={styles.sampleImage}><SamplePhoto name={photo} alt={memory.media?.[0]?.caption || memory.title} /><span>Sample memory</span></div>
              <div className={styles.sampleMeta}><span>{index === 2 ? "Along the coast" : "At home"}</span><span>{new Date(`${memory.memory_date}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</span></div>
              <h3>{memory.title}<ArrowUpRight size={18} /></h3>
              <p>{memory.description.split(". ")[0]}.</p>
            </Link>
          );
        })}
      </div>
      {!home && <p className={styles.sampleDisclosure}>A fictional archive, brought to life with licensed photography. Take a look around.</p>}
    </section>
  );
}

export function FeaturePreviews() {
  return (
    <section className={styles.features} id="how-it-works" aria-labelledby="features-title">
      <div className={styles.sectionHeading}>
        <div><span className={styles.kicker}>More than a camera roll</span><h2 id="features-title">A little order.<br />A lot of meaning.</h2></div>
        <p>Keep the moment, the people, and the story behind it. Then find your way back whenever you like.</p>
      </div>
      <div className={styles.featureGrid}>
        <Link href="/demo/timeline" className={styles.feature}>
          <div className={`${styles.featureVisual} ${styles.timelineVisual}`}>
            <span className={styles.previewLabel}>Your life, unfolding</span>
            <div><span>SEP<br /><strong>20</strong></span><SamplePhoto name="dinner" alt="A shared meal in the sample timeline" /><p>Sunday, with room<br />for everyone</p></div>
            <div><span>SEP<br /><strong>06</strong></span><SamplePhoto name="baking" alt="Baking together in the sample timeline" /><p>Flour on the counter,<br />laughter in the kitchen</p></div>
          </div>
          <div className={styles.featureTitle}><Clock3 size={19} strokeWidth={1.4} /><h3>A thread through time.</h3><ArrowUpRight size={18} /></div>
          <p>One moment leads to another. See your memories in the order life happened.</p>
        </Link>
        <Link href="/demo/albums" className={styles.feature}>
          <div className={`${styles.featureVisual} ${styles.albumVisual}`}>
            <span className={styles.previewLabel}>The chapters, collected</span>
            <div><SamplePhoto name="beach" alt="A beach memory collected in a sample album" /><SamplePhoto name="dinner" alt="Friends gathered around a table in a sample album" /></div>
            <span>The people, the days <small>A sample collection</small></span>
          </div>
          <div className={styles.featureTitle}><Layers size={19} strokeWidth={1.4} /><h3>Better, together.</h3><ArrowUpRight size={18} /></div>
          <p>Gather the places, faces, and photographs that belong to the same chapter.</p>
        </Link>
        <Link href="/demo/stories/room-at-the-table" className={styles.feature}>
          <div className={`${styles.featureVisual} ${styles.storyVisual}`}>
            <span className={styles.previewLabel}>A page from your life</span>
            <h4>There is always<br />room at the table.</h4>
            <p>“I used to think the days worth remembering would announce themselves. But so much of a life happens between those days…”</p>
            <span className={styles.storySignature}>In your own words.</span>
          </div>
          <div className={styles.featureTitle}><BookOpen size={19} strokeWidth={1.4} /><h3>The whole story.</h3><ArrowUpRight size={18} /></div>
          <p>How it felt. What they said. Save the things a photograph can’t quite hold.</p>
        </Link>
      </div>
      <div className={styles.privacyLine}><LockKeyhole size={16} /><p>Personal by nature. Private by default. <span>Your archive is yours to keep.</span></p></div>
    </section>
  );
}
