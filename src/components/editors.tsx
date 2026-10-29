import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { requireUser, check } from "@/lib/supabase";
import { getMemory, lookups, memoryLinks, getCollection } from "@/lib/data";
import type { Memory, Media, Album, Story, Place, Person } from "@/lib/types";
import { PageHeading } from "./archive";
import { MemoryEditor, CollectionEditor } from "./forms";
import { uuid } from "@/lib/validation";

export async function EditorPage({ kind, id }: { kind: string; id?: string }) {
  if (!["memories", "albums", "stories", "places", "people"].includes(kind))
    notFound();
  const recordId = id || randomUUID();
  const editing = !!id;
  if (kind === "memories") {
    const [memory, links] = await Promise.all([
      id ? getMemory(id) : undefined,
      id ? memoryLinks(id) : undefined,
    ]);
    const options = await lookups({
      places: memory?.place_id ? [memory.place_id] : [],
      people: links?.people,
      albums: links?.albums,
    });
    return (
      <>
        <PageHeading
          eyebrow="A moment, preserved"
          title={editing ? "Return to the details." : "What will you remember?"}
          description="Start with a title and a date. The rest is yours to tell."
        />
        <MemoryEditor
          key={id || "new-memory"}
          id={recordId}
          memory={memory}
          {...options}
          links={links}
        />
      </>
    );
  }
  const { db } = await requireUser();
  let record: Partial<Album & Story & Place & Person> | undefined;
  let selected: string[] = [];
  let memories: Memory[] = [];
  let media: Media[] = [];
  if (kind === "albums" || kind === "stories") {
    if (id) {
      const collection = await getCollection(kind, id);
      record = collection.record;
      selected = collection.memories.map((m) => m.id);
      memories = collection.memories;
    }
    const available = await db
      .from("memories")
      .select("*")
      .order("memory_date", { ascending: false })
      .limit(500);
    check(available.error);
    const included = new Set(memories.map((m) => m.id));
    memories = [
      ...memories,
      ...((available.data as Memory[]) || []).filter(
        (m) => !included.has(m.id),
      ),
    ];
    if (memories.length) {
      const photos = await db
        .from("memory_media")
        .select("*")
        .in(
          "memory_id",
          memories.map((m) => m.id),
        )
        .limit(1000);
      check(photos.error);
      media = (photos.data || []) as Media[];
    }
    if (
      record?.cover_media_id &&
      !media.some((m) => m.id === record!.cover_media_id)
    ) {
      const cover = await db
        .from("memory_media")
        .select("*")
        .eq("id", record.cover_media_id)
        .maybeSingle();
      check(cover.error);
      if (cover.data) media.push(cover.data as Media);
    }
  } else if (id) {
    try {
      uuid(id);
    } catch {
      notFound();
    }
    const existing = await db.from(kind).select("*").eq("id", id).maybeSingle();
    check(existing.error);
    if (!existing.data) notFound();
    record = existing.data;
  }
  return (
    <>
      <PageHeading
        eyebrow={
          kind === "stories"
            ? "A chapter of your life"
            : kind === "albums"
              ? "Collected, with care"
              : kind === "places"
                ? "A sense of place"
                : "Part of your story"
        }
        title={`${editing ? "Edit" : "Create"} ${kind === "stories" ? "a story" : kind === "albums" ? "an album" : kind === "places" ? "a place" : "a person"}.`}
      />
      <CollectionEditor
        kind={kind as "albums" | "stories" | "places" | "people"}
        id={recordId}
        record={record}
        memories={memories}
        selected={selected}
        media={media}
      />
      {(kind === "albums" || kind === "stories") && (
        <p className="hint">
          The editor offers your latest 500 memories, plus all existing
          connections.
        </p>
      )}
    </>
  );
}
