/* Private signed images bypass shared image caches; originals remain private. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  MapPin,
  Heart,
  PenLine,
  LockKeyhole,
  CalendarDays,
} from "lucide-react";
import {
  getMemory,
  getCollection,
  getMemories,
  humanDate,
  memoryLinks,
  lookups,
} from "@/lib/data";
import { requireUser, check } from "@/lib/supabase";
import { uuid } from "@/lib/validation";
import { PhotoGallery, DeleteForm } from "@/components/forms";
import {
  MemoryGrid,
  Empty,
  SectionTitle,
  Pagination,
} from "@/components/archive";
import { favoriteMemory } from "@/app/actions";
import type { Place, Search } from "@/lib/types";

export default async function DetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string; id: string }>;
  searchParams: Promise<Search>;
}) {
  const { section, id } = await params;
  try {
    uuid(id);
  } catch {
    notFound();
  }
  if (!["memories", "albums", "stories", "places"].includes(section))
    notFound();
  if (section === "memories") {
    const [memory, links] = await Promise.all([getMemory(id), memoryLinks(id)]);
    const options = await lookups({
      places: memory.place_id ? [memory.place_id] : [],
      people: links.people,
      albums: links.albums,
    });
    const place = options.places.find((p) => p.id === memory.place_id);
    return (
      <>
        <div className="detail-toolbar">
          <Link href="/memories">
            <ArrowLeft size={16} />
            Back to memories
          </Link>
          <Link className="button secondary" href={`/memories/${id}/edit`}>
            <PenLine size={15} />
            Edit memory
          </Link>
        </div>
        <article className="memory-detail">
          <div className="detail-heading">
            <p className="eyebrow">
              <CalendarDays size={13} />
              {humanDate(memory.memory_date)}
              {memory.memory_time && ` · ${memory.memory_time.slice(0, 5)}`}
            </p>
            <h1>{memory.title}</h1>
            <div className="detail-meta">
              {place && (
                <Link href={`/places/${place.id}`}>
                  <MapPin size={14} />
                  {place.name}
                </Link>
              )}
              {memory.mood && <span>{memory.mood}</span>}
              <form action={favoriteMemory}>
                <input type="hidden" name="id" value={id} />
                <input
                  type="hidden"
                  name="favorite"
                  value={String(!memory.favorite)}
                />
                <button
                  className={`text-action ${memory.favorite ? "copper" : ""}`}
                >
                  <Heart
                    size={15}
                    fill={memory.favorite ? "currentColor" : "none"}
                  />
                  {memory.favorite ? "In your favorites" : "Add to favorites"}
                </button>
              </form>
            </div>
          </div>
          <PhotoGallery media={memory.media || []} editable />
          <div className="reflection">
            {memory.description ? (
              <p>{memory.description}</p>
            ) : (
              <p className="muted">Sometimes the moment says enough.</p>
            )}
          </div>
          <div className="memory-context">
            {links.tags.length > 0 && (
              <div>
                <h2>The little connections</h2>
                <div className="tags">
                  {links.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/memories?q=${encodeURIComponent(tag)}`}
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {links.people.length > 0 && (
              <div>
                <h2>Who was there</h2>
                {options.people
                  .filter((p) => links.people.includes(p.id))
                  .map((p) => (
                    <Link
                      className="context-link"
                      key={p.id}
                      href={`/memories?person=${p.id}`}
                    >
                      {p.name}
                      <ArrowUpRight size={14} />
                    </Link>
                  ))}
              </div>
            )}
            {links.albums.length > 0 && (
              <div>
                <h2>Part of a collection</h2>
                {options.albums
                  .filter((a) => links.albums.includes(a.id))
                  .map((a) => (
                    <Link
                      className="context-link"
                      key={a.id}
                      href={`/albums/${a.id}`}
                    >
                      {a.title}
                      <ArrowUpRight size={14} />
                    </Link>
                  ))}
              </div>
            )}
            {links.stories.length > 0 && (
              <div>
                <h2>The longer story</h2>
                {links.stories.map((s) => (
                  <Link
                    className="context-link"
                    key={s.id}
                    href={`/stories/${s.id}`}
                  >
                    {s.title}
                    <ArrowUpRight size={14} />
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="detail-bottom">
            <span>
              <LockKeyhole size={12} />
              Private, and only yours.
            </span>
            <span>Preserved {humanDate(memory.created_at)}</span>
          </div>
          <DeleteForm kind="memories" id={id} title={memory.title} />
        </article>
      </>
    );
  }
  if (section === "places") {
    const { db } = await requireUser();
    const place = await db
      .from("places")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    check(place.error);
    if (!place.data) notFound();
    const p = place.data as Place;
    const search = await searchParams;
    const result = await getMemories({ ...search, place: id });
    return (
      <>
        <div className="detail-toolbar">
          <Link href="/places">
            <ArrowLeft size={16} />
            All places
          </Link>
          <Link className="button secondary" href={`/places/${id}/edit`}>
            <PenLine size={15} />
            Edit place
          </Link>
        </div>
        <div className="place-heading">
          <MapPin size={34} strokeWidth={1} />
          <h1>{p.name}</h1>
          <p>{p.description}</p>
          {p.address && <p className="muted">{p.address}</p>}
          {p.latitude !== null && p.longitude !== null && (
            <span className="eyebrow">
              {p.latitude}°, {p.longitude}°
            </span>
          )}
        </div>
        <SectionTitle title="Moments from here" />
        {result.memories.length ? (
          <MemoryGrid memories={result.memories} />
        ) : (
          <Empty />
        )}
        <Pagination
          count={result.count}
          page={result.page}
          search={search}
          path={`/places/${id}`}
        />
        <DeleteForm kind="places" id={id} title={p.name} />
      </>
    );
  }
  const { record, memories } = await getCollection(
    section as "albums" | "stories",
    id,
  );
  let cover: string | undefined;
  if (record.cover_media_id) {
    const { db } = await requireUser();
    const photo = await db
      .from("memory_media")
      .select("path,preview_path")
      .eq("id", record.cover_media_id)
      .maybeSingle();
    check(photo.error);
    if (photo.data) {
      const signed = await db.storage
        .from("memory-media")
        .createSignedUrl(photo.data.preview_path || photo.data.path, 300);
      check(signed.error);
      cover = signed.data?.signedUrl;
    }
  }
  return (
    <>
      <div className="detail-toolbar">
        <Link href={`/${section}`}>
          <ArrowLeft size={16} />
          All {section}
        </Link>
        <Link className="button secondary" href={`/${section}/${id}/edit`}>
          <PenLine size={15} />
          Edit {section === "stories" ? "story" : "album"}
        </Link>
      </div>
      <article
        className={section === "stories" ? "story-detail" : "album-detail"}
      >
        <header className="detail-heading">
          <p className="eyebrow">
            {section === "stories"
              ? `${record.status === "draft" ? "A draft in progress" : "A story, preserved"} · ${humanDate(record.created_at)}`
              : `A collection · ${memories.length} ${memories.length === 1 ? "memory" : "memories"}`}
          </p>
          <h1>{record.title}</h1>
          {section === "albums" && (
            <p className="muted">{record.description}</p>
          )}
        </header>
        {cover && (
          <div className="detail-cover">
            <img src={cover} alt={`${record.title} cover`} />
          </div>
        )}
        {section === "stories" && (
          <div className="story-body">
            {record.body ? (
              <p>{record.body}</p>
            ) : (
              <p className="muted">A blank page, waiting for your words.</p>
            )}
          </div>
        )}
        <SectionTitle
          title={
            section === "stories"
              ? "The moments behind the words"
              : "Inside this collection"
          }
        />
        {memories.length ? (
          <MemoryGrid memories={memories} />
        ) : (
          <div className="small-empty">
            <p>
              This {section === "stories" ? "story" : "album"} has no memories
              yet.
            </p>
            <Link href={`/${section}/${id}/edit`}>
              Connect a memory
              <ArrowUpRight size={14} />
            </Link>
          </div>
        )}
        <DeleteForm kind={section} id={id} title={record.title} />
      </article>
    </>
  );
}
