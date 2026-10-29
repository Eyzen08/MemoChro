/* Private signed images bypass shared image caches; originals remain private. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, MapPin, BookOpen, Layers, Plus } from "lucide-react";
import { requireUser, check } from "@/lib/supabase";
import {
  getMemories,
  lookups,
  humanDate,
  pageNumber,
  PAGE_SIZE,
  withMedia,
} from "@/lib/data";
import type { Search, Memory, Album, Story, Place } from "@/lib/types";
import { SampleMemories } from "@/components/editorial";
import editorial from "@/components/editorial.module.css";
import {
  PageHeading,
  Empty,
  MemoryGrid,
  MemoryCard,
  Filters,
  Pagination,
  HomeIntro,
  SectionTitle,
  OnboardingLinks,
} from "@/components/archive";

const titles: Record<string, [string, string]> = {
  timeline: [
    "Through the years.",
    "Follow the thread of your life, one moment at a time.",
  ],
  memories: [
    "The moments you keep.",
    "Big days, small details, and everything in between.",
  ],
  albums: ["Better, together.", "A few moments. A whole chapter."],
  stories: [
    "In your own words.",
    "For the stories a photograph can’t quite tell.",
  ],
  places: [
    "Somewhere meaningful.",
    "The places that stay with you, wherever you go.",
  ],
};

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { section } = await params;
  if (!["home", ...Object.keys(titles)].includes(section)) notFound();
  const raw = await searchParams;
  const search: Search = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const { db, user } = await requireUser();
  if (section === "home") {
    const [result, profile, albums, stories] = await Promise.all([
      getMemories(),
      db
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle(),
      db
        .from("albums")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(3),
      db
        .from("stories")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(3),
    ]);
    [profile, albums, stories].forEach((r) => check(r.error));
    const name = String(
      profile.data?.display_name ||
        user.user_metadata?.display_name ||
        "friend",
    ).split(" ")[0];
    const featured = result.memories[0];
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    });
    const anniversary = await db
      .from("memories")
      .select("*")
      .lt("memory_date", today)
      .filter("memory_date", "not.is", null)
      .order("memory_date", { ascending: false })
      .limit(1);
    check(anniversary.error);
    return (
      <div className={editorial.home} data-editorial-home>
        <PageHeading
          eyebrow={new Date().toLocaleDateString("en", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "Asia/Manila",
          })}
          title={`Welcome back, ${name}.`}
          description="This is your life. A little more remembered."
        />
        {featured ? (
          <Link
            className={`featured-memory ${featured.media?.[0] ? "has-photo" : ""}`}
            href={`/memories/${featured.id}`}
          >
            {featured.media?.[0] && (
              <img
                src={featured.media[0].preview_url || featured.media[0].url}
                alt={featured.media[0].caption || featured.title}
              />
            )}
            <div>
              <span className="eyebrow">
                Your latest chapter · {humanDate(featured.memory_date)}
              </span>
              <h2>{featured.title}</h2>
              <p>
                {featured.description.slice(0, 160) ||
                  "A moment worth coming back to."}
              </p>
              <span className="button paper">
                Revisit this moment
                <ArrowUpRight size={16} />
              </span>
            </div>
          </Link>
        ) : (
          <HomeIntro />
        )}
        <section className="home-section">
          <SectionTitle title="Recently preserved" href="/memories" />
          {result.memories.length ? (
            <MemoryGrid memories={result.memories.slice(0, 3)} />
          ) : (
            <div className="first-memory">
              <div className="first-memory-icon">
                <Plus size={26} strokeWidth={1} />
              </div>
              <div>
                <h3>A blank page. A beautiful beginning.</h3>
                <p>
                  Your memories will find their home here. Start with something
                  small.
                </p>
              </div>
              <Link className="text-action" href="/memories/new">
                Add a moment
                <ArrowUpRight size={16} />
              </Link>
            </div>
          )}
        </section>
        {!result.memories.length && <SampleMemories home />}
        <OnboardingLinks />
        {result.memories.length > 0 && (
          <section className="home-section">
            <SectionTitle title="A thread through time" href="/timeline" />
            <div className="timeline-preview">
              {result.memories.slice(0, 5).map((m) => (
                <Link href={`/memories/${m.id}`} key={m.id}>
                  <span>
                    {humanDate(m.memory_date, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <i />
                  <h3>{m.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}
        {anniversary.data?.[0] && anniversary.data[0].id !== featured?.id && (
          <section className="home-section">
            <SectionTitle title="A moment to return to" />
            <MemoryCard
              memory={(await withMedia(anniversary.data as Memory[]))[0]}
            />
          </section>
        )}
        <div className="home-columns">
          <section>
            <SectionTitle title="Your collections" href="/albums" />
            {albums.data?.length ? (
              albums.data.map((a) => (
                <Link className="list-row" key={a.id} href={`/albums/${a.id}`}>
                  <Layers size={20} />
                  <div>
                    <h3>{a.title}</h3>
                    <p>{a.description || "An album of your life"}</p>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              ))
            ) : (
              <div className="small-empty">
                <Layers size={24} strokeWidth={1} />
                <p>Give your moments a place together.</p>
                <Link href="/albums/new">
                  Create an album
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            )}
          </section>
          <section>
            <SectionTitle title="Stories taking shape" href="/stories" />
            {stories.data?.length ? (
              stories.data.map((s) => (
                <Link className="list-row" key={s.id} href={`/stories/${s.id}`}>
                  <BookOpen size={20} />
                  <div>
                    <h3>{s.title}</h3>
                    <p>
                      {s.status === "draft"
                        ? "A work in progress"
                        : "Ready to revisit"}
                    </p>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              ))
            ) : (
              <div className="small-empty">
                <BookOpen size={24} strokeWidth={1} />
                <p>There’s more to the story.</p>
                <Link href="/stories/new">
                  Start writing
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            )}
          </section>
        </div>
        <div className="closing-note">
          <span />
          “We do not remember days, we remember moments.”
          <small>Cesare Pavese</small>
        </div>
      </div>
    );
  }
  const [title, description] = titles[section];
  if (section === "memories" || section === "timeline") {
    const [result, options] = await Promise.all([
      getMemories(search),
      lookups({
        places: search.place ? [search.place] : [],
        people: search.person ? [search.person] : [],
        albums: search.album ? [search.album] : [],
        tags: search.tag ? [search.tag] : [],
      }),
    ]);
    return (
      <>
        <PageHeading title={title} description={description} />
        <Filters section={section} search={search} lookups={options} />
        <div className="results-heading">
          <span>
            {result.count} {result.count === 1 ? "memory" : "memories"}
          </span>
          <span>
            {section === "timeline"
              ? "A life, in sequence"
              : "Your personal archive"}
          </span>
        </div>
        {result.memories.length ? (
          section === "timeline" ? (
            <div className="timeline">
              {result.memories.map((m, i) => (
                <div className="timeline-entry" key={m.id}>
                  <div className="timeline-date">
                    {(i === 0 ||
                      m.memory_date.slice(0, 7) !==
                        result.memories[i - 1].memory_date.slice(0, 7)) && (
                      <>
                        <strong>{m.memory_date.slice(0, 4)}</strong>
                        <span>
                          {humanDate(m.memory_date, {
                            month: "long",
                            day: undefined,
                            year: undefined,
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  <i className="timeline-dot" />
                  <MemoryCard memory={m} />
                </div>
              ))}
            </div>
          ) : (
            <MemoryGrid memories={result.memories} />
          )
        ) : (
          <Empty
            kind="memories"
            filtered={Object.values(search).some(Boolean)}
          />
        )}
        <Pagination
          page={result.page}
          count={result.count}
          path={`/${section}`}
          search={search}
        />
      </>
    );
  }
  const kind = section as "albums" | "stories" | "places";
  const page = pageNumber(search.page);
  let query = db
    .from(kind)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  if (search.q) {
    if (kind === "stories")
      query = query.textSearch("search_document", search.q.slice(0, 200), {
        type: "websearch",
        config: "english",
      });
    else
      query = query.ilike(
        kind === "places" ? "name" : "title",
        `%${search.q.slice(0, 200)}%`,
      );
  }
  const { data, error, count } = await query.range(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE - 1,
  );
  check(error);
  const records = (data || []) as (Album & Story & Place)[];
  const covers = new Map<string, string>();
  const coverIds = records.map((r) => r.cover_media_id).filter(Boolean);
  if (coverIds.length) {
    const photos = await db.from("memory_media").select("*").in("id", coverIds);
    check(photos.error);
    if (photos.data?.length) {
      const signed = await db.storage.from("memory-media").createSignedUrls(
        photos.data.map((m) => m.preview_path || m.path),
        300,
      );
      check(signed.error);
      photos.data.forEach((m, i) =>
        covers.set(m.id, signed.data?.[i]?.signedUrl || ""),
      );
    }
  }
  return (
    <>
      <PageHeading
        title={title}
        description={description}
        action={{
          href: `/${kind}/new`,
          label: `Create ${kind === "stories" ? "story" : kind === "albums" ? "album" : "place"}`,
        }}
      />
      <form className="collection-search" action={`/${kind}`}>
        <label className="search-field">
          <SearchIcon />
          <span className="sr-only">Search {kind}</span>
          <input
            type="search"
            name="q"
            defaultValue={search.q}
            placeholder={`Find ${kind} in your archive…`}
            maxLength={200}
          />
        </label>
        <button className="button secondary">Search</button>
        {search.q && (
          <Link className="small-link" href={`/${kind}`}>
            Reset
          </Link>
        )}
      </form>
      {records.length ? (
        <div className={`collection-grid ${kind}`}>
          {records.map((r, i) => (
            <article className="collection-card" key={r.id}>
              <Link href={`/${kind}/${r.id}`}>
                {kind === "places" ? (
                  <div className="place-map">
                    <MapPin size={34} strokeWidth={1} />
                    <span>
                      {r.latitude !== null && r.longitude !== null
                        ? `${r.latitude}°, ${r.longitude}°`
                        : "A place in your story"}
                    </span>
                  </div>
                ) : covers.get(r.cover_media_id || "") ? (
                  <div className="collection-cover">
                    <img
                      src={covers.get(r.cover_media_id!)}
                      alt={`${r.title} cover`}
                    />
                  </div>
                ) : (
                  <div
                    className={`collection-cover paper-cover cover-${i % 3}`}
                  >
                    {kind === "stories" ? (
                      <BookOpen size={28} strokeWidth={1} />
                    ) : (
                      <Layers size={28} strokeWidth={1} />
                    )}
                    <span>{r.title}</span>
                  </div>
                )}
                <div className="collection-caption">
                  <span className="eyebrow">
                    {kind === "stories"
                      ? r.status
                      : kind === "albums"
                        ? "A collection of moments"
                        : "A sense of place"}
                  </span>
                  <h2>{kind === "places" ? r.name : r.title}</h2>
                  <p>
                    {kind === "stories"
                      ? r.body.slice(0, 110)
                      : r.description ||
                        r.address ||
                        "Waiting for your next chapter."}
                  </p>
                  <span className="circle-arrow">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <Empty kind={kind} filtered={!!search.q} />
      )}
      <Pagination
        page={page}
        count={count || 0}
        search={search}
        path={`/${kind}`}
      />
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}
