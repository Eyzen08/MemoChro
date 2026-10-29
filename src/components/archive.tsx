/* Private signed images bypass shared image caches; originals remain private. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ArrowUpRight,
  Plus,
  Heart,
  MapPin,
  Image as ImageIcon,
  Search,
  ArrowRight,
  BookOpen,
  Layers,
  Clock3,
  Feather,
  LockKeyhole,
} from "lucide-react";
import { favoriteMemory } from "@/app/actions";
import { humanDate, PAGE_SIZE } from "@/lib/data";
import type {
  Memory,
  Search as SearchParams,
  Place,
  Person,
  Album,
  Tag,
} from "@/lib/types";
import { SamplePhoto } from "./sample-photo";
import { Tilt } from "./forms";
import { PhotoComposition } from "./editorial";

export function Brand({href = "/home"}: {href?: string}) {
  return (
    <Link href={href} className="brand" aria-label="MemoChro home">
      <span className="brand-mark">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>
        MemoChro<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="button primary">
          <Plus size={17} />
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Empty({
  kind = "memories",
  filtered = false,
}: {
  kind?: string;
  filtered?: boolean;
}) {
  const Icon =
    kind === "albums"
      ? Layers
      : kind === "stories"
        ? BookOpen
        : kind === "places"
          ? MapPin
          : kind === "people"
            ? Heart
            : ImageIcon;
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={28} strokeWidth={1.2} />
      </span>
      <h2>
        {filtered
          ? "A quieter corner of your archive."
          : kind === "memories"
            ? "Your story starts with a moment."
            : kind === "albums"
              ? "Some moments belong together."
              : kind === "stories"
                ? "There’s a story only you can tell."
                : kind === "places"
                  ? "Every place holds a memory."
                  : "The people who make it matter."}
      </h2>
      <p>
        {filtered
          ? "No results match these filters. Try a different search or clear them."
          : kind === "memories"
            ? "A photograph, a small detail, a day you don’t want to forget. Give it a home here."
            : kind === "albums"
              ? "Gather your memories into a collection you can return to."
              : kind === "stories"
                ? "Make room for the longer version. Save a draft and come back whenever you’re ready."
                : kind === "places"
                  ? "Keep the places that mean something to you. A name is all you need."
                  : "Add someone to connect them with your memories."}
      </p>
      <Link
        className="button secondary"
        href={
          filtered
            ? `/${kind}`
            : kind === "people"
              ? "/settings/people/new"
              : `/${kind}/new`
        }
      >
        {filtered
          ? "Clear filters"
          : `Create ${kind === "memories" ? "a memory" : kind === "stories" ? "a story" : kind === "albums" ? "an album" : kind === "places" ? "a place" : "a person"}`}
        <ArrowUpRight size={16} />
      </Link>
      {!filtered && <Link className="small-link" href="/demo">Explore the sample archive</Link>}
    </div>
  );
}

export function MemoryCard({ memory, demo = false }: { memory: Memory; demo?: boolean }) {
  return (
    <article className="memory-card">
      <Tilt>
        <Link
          href={`${demo ? "/demo" : ""}/memories/${memory.id}`}
          className={`memory-picture ${memory.media?.length ? "" : "written-picture"}`}
        >
          {demo && memory.media?.[0]?.url ? <SamplePhoto name={memory.media[0].url.split("/").pop()!.replace("-1280.webp", "")} alt={memory.media[0].caption || memory.title} /> : memory.media?.[0]?.url ? (
            <img
              src={memory.media[0].preview_url || memory.media[0].url}
              alt={memory.media[0].caption || memory.title}
              loading="lazy"
            />
          ) : (
            <>
              <Feather size={27} strokeWidth={1} />
              <p>{memory.description || memory.title}</p>
            </>
          )}
          <span className="picture-date">
            {humanDate(memory.memory_date, {
              month: "short",
              day: "2-digit",
              year: undefined,
            })}
          </span>
          {(memory.media?.length || 0) > 1 && (
            <span className="picture-count">
              <ImageIcon size={12} />
              {memory.media!.length}
            </span>
          )}
        </Link>
        {!demo && <form action={favoriteMemory} className="favorite-form">
          <input name="id" type="hidden" value={memory.id} />
          <input
            name="favorite"
            type="hidden"
            value={String(!memory.favorite)}
          />
          <button
            className={`favorite ${memory.favorite ? "is-favorite" : ""}`}
            aria-label={`${memory.favorite ? "Remove" : "Add"} ${memory.title} ${memory.favorite ? "from" : "to"} favorites`}
          >
            <Heart size={17} fill={memory.favorite ? "currentColor" : "none"} />
          </button>
        </form>}
      </Tilt>
      <div className="memory-caption">
        <span className="eyebrow">
          {humanDate(memory.memory_date, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <Link href={`${demo ? "/demo" : ""}/memories/${memory.id}`}>
          <h3>{memory.title}</h3>
        </Link>
        <p>{memory.description || "A moment, kept for you."}</p>
      </div>
    </article>
  );
}
export function MemoryGrid({ memories, demo = false }: { memories: Memory[]; demo?: boolean }) {
  return (
    <div className="memory-grid">
      {memories.map((m) => (
        <MemoryCard key={m.id} memory={m} demo={demo} />
      ))}
    </div>
  );
}

export function Filters({
  search,
  lookups,
  section,
}: {
  search: SearchParams;
  lookups: { places: Place[]; people: Person[]; albums: Album[]; tags: Tag[] };
  section: string;
}) {
  return (
    <form className="filters" action={`/${section}`}>
      <div className="filter-main">
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">Search memories</span>
          <input
            name="q"
            type="search"
            defaultValue={search.q}
            maxLength={200}
            placeholder="Search moments, people, places…"
          />
        </label>
        <label className="sr-only" htmlFor="order">
          Sort order
        </label>
        <select id="order" name="order" defaultValue={search.order || "newest"}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <button className="button secondary">Search</button>
      </div>
      <details
        open={
          Object.keys(search).some(
            (k) => !["q", "page", "order"].includes(k),
          ) || undefined
        }
      >
        <summary>Refine your archive</summary>
        <div className="filter-details">
          <label>
            From
            <input type="date" name="from" defaultValue={search.from} />
          </label>
          <label>
            Until
            <input type="date" name="to" defaultValue={search.to} />
          </label>
          {(["places", "people", "albums", "tags"] as const).map((kind, i) => (
            <label key={kind}>
              {["Place", "Person", "Album", "Tag"][i]}
              <select
                name={["place", "person", "album", "tag"][i]}
                defaultValue={
                  search[["place", "person", "album", "tag"][i]] || ""
                }
              >
                <option value="">All {kind}</option>
                {lookups[kind].map((r) => (
                  <option key={r.id} value={r.id}>
                    {"name" in r ? r.name : r.title}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label>
            Type
            <select name="type" defaultValue={search.type || ""}>
              <option value="">All memories</option>
              <option value="photos">With photographs</option>
              <option value="written">Written moments</option>
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              name="favorites"
              value="true"
              defaultChecked={search.favorites === "true"}
            />
            Favorites only
          </label>
        </div>
      </details>
      {Object.values(search).some(Boolean) && (
        <Link className="small-link" href={`/${section}`}>
          Reset filters
        </Link>
      )}
    </form>
  );
}

export function Pagination({
  page,
  count,
  search,
  path,
}: {
  page: number;
  count: number;
  search: SearchParams;
  path: string;
}) {
  if (count <= PAGE_SIZE) return null;
  const pages = Math.ceil(count / PAGE_SIZE);
  const href = (n: number) => {
    const params = new URLSearchParams();
    Object.entries(search).forEach(([k, v]) => {
      if (v && k !== "page") params.set(k, v);
    });
    params.set("page", String(n));
    return `${path}?${params}`;
  };
  return (
    <nav aria-label="Result pages" className="pagination">
      {page > 1 ? (
        <Link className="button secondary" href={href(page - 1)}>
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span>
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link className="button secondary" href={href(page + 1)}>
          Next
          <ArrowRight size={16} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function SectionTitle({
  title,
  href,
  label = "View all",
}: {
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {href && (
        <Link href={href}>
          {label}
          <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function PrivateNote() {
  return (
    <span className="private-note">
      <LockKeyhole size={12} />
      Your life. Your eyes only.
    </span>
  );
}
export function HomeIntro() {
  return (
    <div className="home-intro">
      <div className="intro-copy">
        <p className="eyebrow">
          <span className="tiny-line" />
          Your life, through time
        </p>
        <h2>
          Life moves.
          <br />
          Keep what matters.
        </h2>
        <p>
          The big adventures. The ordinary Tuesdays.
          <br />A home for everything that makes you, you.
        </p>
        <Link className="button paper" href="/memories/new">
          <Plus size={17} />
          Create your first memory
          <ArrowUpRight size={17} />
        </Link>
        <PrivateNote />
      </div>
      <PhotoComposition />
    </div>
  );
}
export function OnboardingLinks() {
  return (
    <div className="onboarding-links">
      {[
        {
          Icon: Clock3,
          title: "Follow your thread",
          text: "Every moment, in its own time.",
          href: "/timeline",
        },
        {
          Icon: Layers,
          title: "Keep them together",
          text: "Collections for the chapters of life.",
          href: "/albums",
        },
        {
          Icon: BookOpen,
          title: "Tell the whole story",
          text: "Some moments need a few more words.",
          href: "/stories",
        },
      ].map(({ Icon, title, text, href }) => (
        <Link href={href} key={href}>
          <Icon size={23} strokeWidth={1.3} />
          <div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
          <ArrowUpRight size={17} />
        </Link>
      ))}
    </div>
  );
}
