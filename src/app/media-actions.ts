"use server";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { requireUser, check } from "@/lib/supabase";
import { uuid, text, uploadExtension } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

export async function preparePhoto(
  memoryId: string,
  hash: string,
  mime: string,
) {
  const { db, user } = await requireUser();
  uuid(memoryId);
  if (!/^[a-f0-9]{64}$/.test(hash))
    throw new Error("Invalid photo fingerprint.");
  const extension = (
    { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<
      string,
      string
    >
  )[mime];
  if (!extension) throw new Error("Choose a JPEG, PNG or WebP photograph.");
  const memory = await db
    .from("memories")
    .select("id,deleting")
    .eq("id", memoryId)
    .single();
  check(memory.error);
  if (memory.data?.deleting)
    throw new Error(
      "This memory is being deleted. Finish deletion before adding photos.",
    );
  const path = `${user.id}/${memoryId}/${hash}.${extension}`;
  const existing = await db
    .from("memory_media")
    .select("id")
    .eq("path", path)
    .maybeSingle();
  check(existing.error);
  return { path, exists: !!existing.data };
}

export async function finishPhoto(
  memoryId: string,
  path: string,
  caption: string,
): Promise<ActionState> {
  const { db, user } = await requireUser();
  uuid(memoryId);
  if (
    !new RegExp(`^${user.id}/${memoryId}/[a-f0-9]{64}\\.(jpg|png|webp)$`).test(
      path,
    )
  )
    return { error: "Invalid photo path." };
  const bucket = db.storage.from("memory-media");
  let previewPath = "";
  try {
    const existing = await db
      .from("memory_media")
      .select("id")
      .eq("path", path)
      .maybeSingle();
    check(existing.error);
    if (existing.data) return {};
    const original = await bucket.download(path);
    check(original.error);
    if (!original.data) throw new Error("The photo upload is incomplete.");
    const bytes = new Uint8Array(await original.data.arrayBuffer());
    const mime = path.endsWith(".jpg")
      ? "image/jpeg"
      : path.endsWith(".png")
        ? "image/png"
        : "image/webp";
    uploadExtension(mime, bytes, bytes.length);
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (!path.includes(`/${hash}.`))
      throw new Error("The photograph did not match its upload. Retry it.");
    const preview = await sharp(bytes, {
      limitInputPixels: 40_000_000,
      animated: false,
    })
      .rotate()
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
    const previewHash = createHash("sha256")
      .update(`preview-${hash}`)
      .digest("hex");
    previewPath = `${user.id}/${memoryId}/${previewHash}.webp`;
    const uploaded = await bucket.upload(previewPath, preview, {
      contentType: "image/webp",
      upsert: true,
    });
    check(uploaded.error);
    const order = await db
      .from("memory_media")
      .select("position")
      .eq("memory_id", memoryId)
      .order("position", { ascending: false })
      .limit(1);
    check(order.error);
    const saved = await db.from("memory_media").upsert(
      {
        user_id: user.id,
        memory_id: memoryId,
        path,
        preview_path: previewPath,
        caption: text(caption, "Caption", 500),
        position: (order.data?.[0]?.position ?? -1) + 1,
      },
      { onConflict: "path", ignoreDuplicates: true },
    );
    check(saved.error);
  } catch (error) {
    // A concurrent finalizer may still need these paths; deletion cleans the folder.
    return {
      error:
        error instanceof Error
          ? error.message
          : "This photo could not be saved. Select it again and retry.",
    };
  }
  revalidatePath("/", "layout");
  return {};
}

export async function updateCaption(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db } = await requireUser();
    const { error } = await db
      .from("memory_media")
      .update({ caption: text(form.get("caption"), "Caption", 500) })
      .eq("id", uuid(form.get("id")));
    check(error);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Caption could not be saved.",
    };
  }
  revalidatePath("/", "layout");
  return { message: "Caption saved." };
}
