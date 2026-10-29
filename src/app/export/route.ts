import { requireUser, check } from "@/lib/supabase";
import { tarEntry } from "@/lib/tar";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const { db } = await requireUser();
  const manifest: Record<string, unknown> = {
    format: "memochro-archive-v1",
    exported_at: new Date().toISOString(),
  };
  const media: { path: string }[] = [];
  for (const table of [
    "profiles",
    "memories",
    "memory_media",
    "albums",
    "album_memories",
    "stories",
    "story_memories",
    "places",
    "people",
    "memory_people",
    "tags",
    "memory_tags",
  ]) {
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 500) {
      let query = db
        .from(table)
        .select("*")
        .order(
          table === "profiles"
            ? "user_id"
            : table === "album_memories"
              ? "album_id"
              : table === "story_memories"
                ? "story_id"
                : table.startsWith("memory_") && table !== "memory_media"
                  ? "memory_id"
                  : "id",
        );
      const child =
        table === "album_memories" || table === "story_memories"
          ? "memory_id"
          : table === "memory_people"
            ? "person_id"
            : table === "memory_tags"
              ? "tag_id"
              : null;
      if (child) query = query.order(child);
      const result = await query.range(offset, offset + 499);
      check(result.error);
      rows.push(...(result.data || []));
      if ((result.data || []).length < 500) break;
    }
    if (table === "memory_media")
      media.push(...rows.map((r) => ({ path: String(r.path) })));
    manifest[table] = rows.map(({ search_document: _search, ...row }) => {
      void _search;
      return row;
    });
  }
  async function* content() {
    yield* tarEntry(
      "archive.json",
      new TextEncoder().encode(JSON.stringify(manifest, null, 2)),
    );
    for (const photo of media) {
      const { data, error } = await db.storage
        .from("memory-media")
        .download(photo.path);
      check(error);
      if (!data)
        throw new Error(
          "An original could not be downloaded. Retry the export.",
        );
      yield* tarEntry(
        `photos/${photo.path.split("/").slice(1).join("/")}`,
        new Uint8Array(await data.arrayBuffer()),
      );
    }
    yield new Uint8Array(1024);
  }
  const iterator = content();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await iterator.next();
        if (next.done) controller.close();
        else controller.enqueue(next.value);
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await iterator.return(undefined);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-tar",
      "Content-Disposition": `attachment; filename="memochro-${new Date().toISOString().slice(0, 10)}.tar"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
