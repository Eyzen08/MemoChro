"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser, supabase, check } from "@/lib/supabase";
import { memoryInput, text, uuid, passwordInput } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

const fail = (error: unknown): ActionState => ({
  error:
    error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.",
});
const ids = (form: FormData, key: string, max = 50) => {
  const list = [...new Set(form.getAll(key).map(uuid))];
  if (list.length > max) throw new Error(`Choose at most ${max} items.`);
  return list;
};
const site = () =>
  new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").origin;

export async function authenticate(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  let destination = "/home";
  try {
    const db = await supabase();
    const mode = text(form.get("mode"), "Action", 20, true);
    const email = text(form.get("email"), "Email", 254, true).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Enter a valid email address.");
    if (mode === "recover") {
      const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: `${site()}/auth/callback?next=/settings/password`,
      });
      if (error)
        throw new Error(
          "Recovery is unavailable right now. Please try again later.",
        );
      return {
        message:
          "If an account exists for this email, a recovery link is on its way. Check your inbox.",
      };
    }
    const password = passwordInput(form.get("password"));
    if (mode === "signup") {
      if (password.length < 12)
        throw new Error("Use a password with at least 12 characters.");
      const name = text(form.get("display_name"), "Your name", 80, true);
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
          emailRedirectTo: `${site()}/auth/callback`,
        },
      });
      if (error)
        throw new Error(
          "The account could not be created. Please try again later.",
        );
      if (!data.session)
        return {
          message:
            "Check your inbox to confirm your email, then sign in. If you already have an account, use Sign in.",
        };
      destination = "/home";
    } else {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error)
        throw new Error("Email or password is incorrect. Please try again.");
    }
  } catch (error) {
    return fail(error);
  }
  redirect(destination);
}

export async function logout() {
  const db = await supabase();
  const { error } = await db.auth.signOut();
  check(error);
  redirect("/");
}

export async function saveMemory(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  let id = "";
  let persisted = false;
  try {
    const { db } = await requireUser();
    id = uuid(form.get("id"));
    const input = memoryInput(Object.fromEntries(form));
    const people = ids(form, "people"),
      albums = ids(form, "albums");
    const tags = [
      ...new Set(
        text(form.get("tags"), "Tags", 1000)
          .split(",")
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    if (tags.length > 20 || tags.some((t) => t.length > 50))
      throw new Error("Use up to 20 tags, each 50 characters or fewer.");
    const saved = await db.rpc("save_memory", {
      p_id: id,
      p_data: input,
      p_people: people,
      p_albums: albums,
      p_tags: tags,
    });
    check(saved.error);
    persisted = true;
  } catch (error) {
    return {
      error: `${persisted ? "Your memory text was saved. " : ""}${fail(error).error}`,
    };
  }
  revalidatePath("/", "layout");
  return { memoryId: id };
}

export async function favoriteMemory(form: FormData) {
  const { db } = await requireUser();
  const id = uuid(form.get("id"));
  const { error } = await db
    .from("memories")
    .update({ favorite: form.get("favorite") === "true" })
    .eq("id", id);
  check(error);
  revalidatePath("/", "layout");
}

export async function saveCollection(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  let destination = "";
  try {
    const { db, user } = await requireUser();
    const kind = text(form.get("kind"), "Type", 20, true);
    const id = uuid(form.get("id"));
    if (kind === "albums" || kind === "stories") {
      const input = {
        title: text(form.get("title"), "Title", 200, true),
        description: text(form.get("description"), "Description", 5000),
        body: text(form.get("body"), "Story", 100000),
        status: form.get("status") === "saved" ? "saved" : "draft",
        cover_media_id: form.get("cover_media_id")
          ? uuid(form.get("cover_media_id"))
          : null,
      };
      const { error } = await db.rpc("save_collection", {
        p_kind: kind,
        p_id: id,
        p_data: input,
        p_memories: ids(form, "memories", 500),
      });
      check(error);
      destination = `/${kind}/${id}`;
    } else if (kind === "places") {
      const coordinate = (key: string, min: number, max: number) => {
        const raw = text(form.get(key), key, 30);
        if (!raw) return null;
        const n = Number(raw);
        if (!Number.isFinite(n) || n < min || n > max)
          throw new Error(`Check the ${key}.`);
        return n;
      };
      const { error } = await db.from("places").upsert({
        id,
        user_id: user.id,
        name: text(form.get("name"), "Place name", 200, true),
        description: text(form.get("description"), "Description", 5000),
        address: text(form.get("address"), "Address", 500),
        latitude: coordinate("latitude", -90, 90),
        longitude: coordinate("longitude", -180, 180),
      });
      check(error);
      destination = "/places";
    } else if (kind === "people") {
      const { error } = await db.from("people").upsert({
        id,
        user_id: user.id,
        name: text(form.get("name"), "Name", 200, true),
        relationship: text(form.get("relationship"), "Relationship", 100),
        note: text(form.get("note"), "Note", 5000),
      });
      check(error);
      destination = "/settings/people";
    } else throw new Error("Unknown record type.");
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/", "layout");
  redirect(destination);
}

export async function deleteRecord(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  let destination = "";
  try {
    const { db } = await requireUser();
    const kind = text(form.get("kind"), "Type", 20, true);
    const id = uuid(form.get("id"));
    if (!["memories", "albums", "stories", "places", "people"].includes(kind))
      throw new Error("Invalid record type.");
    if (form.get("confirmation") !== "DELETE")
      throw new Error("Type DELETE to confirm.");
    if (kind === "memories") {
      const { user } = await requireUser();
      const marked = await db
        .from("memories")
        .update({ deleting: true })
        .eq("id", id);
      check(marked.error);
      const bucket = db.storage.from("memory-media");
      for (;;) {
        const files = await bucket.list(`${user.id}/${id}`, { limit: 100 });
        check(files.error);
        if (!files.data?.length) break;
        const removed = await bucket.remove(
          files.data.map((file) => `${user.id}/${id}/${file.name}`),
        );
        check(removed.error);
      }
    }
    const { error } = await db.from(kind).delete().eq("id", id);
    check(error);
    destination = kind === "people" ? "/settings/people" : `/${kind}`;
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/", "layout");
  redirect(destination);
}

export async function removePhoto(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db } = await requireUser();
    const id = uuid(form.get("id"));
    const photo = await db
      .from("memory_media")
      .select("path,preview_path,memory_id")
      .eq("id", id)
      .single();
    check(photo.error);
    const removed = await db.storage
      .from("memory-media")
      .remove([
        photo.data!.path,
        ...(photo.data!.preview_path ? [photo.data!.preview_path] : []),
      ]);
    check(removed.error);
    const deleted = await db.from("memory_media").delete().eq("id", id);
    check(deleted.error);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/", "layout");
  return { message: "Photo removed." };
}

export async function updateProfile(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db, user } = await requireUser();
    const name = text(form.get("display_name"), "Name", 80, true);
    const { error } = await db
      .from("profiles")
      .upsert({ user_id: user.id, display_name: name });
    check(error);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/", "layout");
  return { message: "Profile saved." };
}

export async function updatePassword(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db } = await requireUser();
    const password = passwordInput(form.get("password"));
    if (password.length < 12) throw new Error("Use at least 12 characters.");
    if (password !== form.get("confirm_password"))
      throw new Error("Passwords do not match.");
    const { error } = await db.auth.updateUser({ password });
    if (error)
      throw new Error(
        "Password could not be updated. Request a fresh recovery link and retry.",
      );
  } catch (error) {
    return fail(error);
  }
  return { message: "Password updated. You can now use it to sign in." };
}

export async function deleteAccount(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { db, user } = await requireUser();
    if (form.get("confirmation") !== "DELETE MY ACCOUNT")
      throw new Error("Type DELETE MY ACCOUNT to confirm.");
    const password = passwordInput(form.get("password"));
    const login = await db.auth.signInWithPassword({
      email: user.email!,
      password,
    });
    if (login.error) throw new Error("Your password is incorrect.");
    const bucket = db.storage.from("memory-media");
    const folders: string[] = [];
    for (let offset = 0; ; offset += 100) {
      const list = await bucket.list(user.id, { limit: 100, offset });
      check(list.error);
      for (const f of list.data || []) folders.push(f.name);
      if ((list.data || []).length < 100) break;
    }
    for (const folder of folders) {
      for (;;) {
        const list = await bucket.list(`${user.id}/${folder}`, { limit: 100 });
        check(list.error);
        if (!list.data?.length) break;
        const removed = await bucket.remove(
          list.data.map((f) => `${user.id}/${folder}/${f.name}`),
        );
        check(removed.error);
      }
    }
    const deleted = await db.rpc("delete_own_account");
    check(deleted.error);
    await db.auth.signOut({ scope: "local" });
  } catch (error) {
    return fail(error);
  }
  redirect("/?deleted=true");
}
