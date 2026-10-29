import "server-only";
import { requireUser, check } from "./supabase";
import { date, uuid } from "./validation";
import type {
  Memory,
  Media,
  Album,
  Story,
  Place,
  Person,
  Tag,
  Search,
} from "./types";
import { notFound } from "next/navigation";

export const PAGE_SIZE = 18;
export function pageNumber(value?: string) {
  return Math.max(1, Math.min(100000, Number.parseInt(value || "1", 10) || 1));
}
export function humanDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(value.length === 10 ? `${value}T12:00:00` : value));
}

export async function withMedia(memories: Memory[]) {
  if (!memories.length) return memories;
  const { db } = await requireUser();
  const { data, error } = await db
    .from("memory_media")
    .select("*")
    .in(
      "memory_id",
      memories.map((m) => m.id),
    )
    .order("position")
    .order("created_at");
  check(error);
  const media = (data || []) as Media[];
  if (media.length) {
    const paths = media.flatMap((m) => [
      m.path,
      ...(m.preview_path ? [m.preview_path] : []),
    ]);
    const signed = await db.storage
      .from("memory-media")
      .createSignedUrls(paths, 300);
    check(signed.error);
    const urls = new Map((signed.data || []).map((p) => [p.path, p.signedUrl]));
    media.forEach((m) => {
      m.url = urls.get(m.path) || undefined;
      m.preview_url = urls.get(m.preview_path || "") || undefined;
    });
  }
  return memories.map((m) => ({
    ...m,
    media: media.filter((photo) => photo.memory_id === m.id),
  }));
}

export async function getMemories(search: Search = {}) {
  const { db } = await requireUser();
  const page = pageNumber(search.page);
  const filterId = (key: string) => {
    try {
      return search[key] ? uuid(search[key]) : null;
    } catch {
      return null;
    }
  };
  const filterDate = (key: string) => {
    try {
      return search[key] ? date(search[key]) : null;
    } catch {
      return null;
    }
  };
  const { data, error, count } = await db
    .rpc(
      "search_memories",
      {
        q: (search.q || "").slice(0, 200),
        after_date: filterDate("from"),
        before_date: filterDate("to"),
        only_favorites: search.favorites === "true",
        filter_place: filterId("place"),
        filter_person: filterId("person"),
        filter_album: filterId("album"),
        filter_tag: filterId("tag"),
        filter_type: ["photos", "written"].includes(search.type || "")
          ? search.type
          : "",
      },
      { count: "exact" },
    )
    .order("memory_date", { ascending: search.order === "oldest" })
    .order("id")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  check(error);
  return {
    memories: await withMedia((data || []) as Memory[]),
    count: count || 0,
    page,
  };
}

export async function getMemory(id: string) {
  try {
    uuid(id);
  } catch {
    notFound();
  }
  const { db } = await requireUser();
  const result = await db
    .from("memories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  check(result.error);
  if (!result.data) notFound();
  return (await withMedia([result.data as Memory]))[0];
}

export async function lookups(
  selected: Partial<
    Record<"places" | "people" | "albums" | "tags", string[]>
  > = {},
) {
  const { db } = await requireUser();
  const results = await Promise.all([
    db.from("places").select("*").order("name").limit(500),
    db.from("people").select("*").order("name").limit(500),
    db.from("albums").select("*").order("title").limit(500),
    db.from("tags").select("*").order("name").limit(500),
  ]);
  results.forEach((r) => check(r.error));
  const tables = ["places", "people", "albums", "tags"] as const;
  await Promise.all(
    tables.map(async (table, i) => {
      const missing = (selected[table] || []).filter((id) => {
        try {
          uuid(id);
          return !results[i].data?.some((row) => row.id === id);
        } catch {
          return false;
        }
      });
      if (missing.length) {
        const extra = await db.from(table).select("*").in("id", missing);
        check(extra.error);
        results[i].data?.push(...(extra.data || []));
      }
    }),
  );
  return {
    places: results[0].data as Place[],
    people: results[1].data as Person[],
    albums: results[2].data as Album[],
    tags: results[3].data as Tag[],
  };
}

export async function memoryLinks(id: string) {
  const { db } = await requireUser();
  const results = await Promise.all([
    db.from("memory_people").select("person_id").eq("memory_id", id),
    db.from("album_memories").select("album_id").eq("memory_id", id),
    db.from("memory_tags").select("tags(name)").eq("memory_id", id),
    db.from("story_memories").select("stories(id,title)").eq("memory_id", id),
  ]);
  results.forEach((r) => check(r.error));
  return {
    people: (results[0].data || []).map((x) => x.person_id as string),
    albums: (results[1].data || []).map((x) => x.album_id as string),
    tags: (
      (results[2].data as unknown as { tags: { name: string } }[]) || []
    ).map((x) => x.tags.name),
    stories: (
      (results[3].data as unknown as {
        stories: { id: string; title: string };
      }[]) || []
    ).map((x) => x.stories),
  };
}

export async function getCollection(kind: "albums" | "stories", id: string) {
  try {
    uuid(id);
  } catch {
    notFound();
  }
  const { db } = await requireUser();
  const { data, error } = await db
    .from(kind)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  check(error);
  if (!data) notFound();
  const links = await db
    .from(kind === "albums" ? "album_memories" : "story_memories")
    .select("memory_id")
    .eq(kind === "albums" ? "album_id" : "story_id", id)
    .order(kind === "albums" ? "position" : "memory_id");
  check(links.error);
  const ids = (links.data || []).map((l) => l.memory_id as string);
  let memories: Memory[] = [];
  if (ids.length) {
    const r = await db.from("memories").select("*").in("id", ids);
    check(r.error);
    memories = await withMedia((r.data || []) as Memory[]);
    memories.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  }
  return { record: data as Album & Story, memories };
}
