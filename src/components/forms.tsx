/* Private signed images bypass shared image caches; originals remain private. */
/* eslint-disable @next/next/no-img-element */
"use client";

import {
  useActionState,
  useRef,
  useState,
  startTransition,
  type FormEvent,
} from "react";
import Link from "next/link";
import { PhotoSelection } from "./photo-selection";
import { SamplePhoto } from "./sample-photo";
import { useDirtyForm } from "./use-dirty-form";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { preparePhoto, finishPhoto, updateCaption } from "@/app/media-actions";
import { uploadExtension } from "@/lib/validation";
import {
  ArrowUpRight,
  LoaderCircle,
  Plus,
  X,
  Sun,
  Moon,
  Expand,
  Trash2,
} from "lucide-react";
import {
  authenticate,
  saveMemory,
  saveCollection,
  deleteRecord,
  removePhoto,
  updateProfile,
  updatePassword,
  deleteAccount,
} from "@/app/actions";
import type {
  ActionState,
  Memory,
  Album,
  Story,
  Place,
  Person,
  Media,
} from "@/lib/types";

type Action = (state: ActionState, form: FormData) => Promise<ActionState>;
// React resets action forms even when validation returns an error.
function preserveInputs(action: (form: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => action(form));
  };
}
export function Feedback({ state }: { state: ActionState }) {
  return (
    <>
      {state.error && (
        <p className="feedback error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="feedback success" role="status">
          {state.message}
        </p>
      )}
    </>
  );
}

export function ThemeToggle() {
  function toggle() {
    const next =
      document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("memochro-theme", next);
    } catch {}
  }
  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      onClick={toggle}
      aria-label="Switch color theme"
    >
      <Sun className="sun" size={19} />
      <Moon className="moon" size={19} />
    </button>
  );
}

function SaveButton({
  pending,
  children = "Save changes",
}: {
  pending: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button className="button primary" disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle size={17} className="spin" />
          Saving…
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" | "recover" }) {
  const [state, action, pending] = useActionState(authenticate, {});
  return (
    <form
      action={action}
      onSubmit={preserveInputs(action)}
      className="form-stack"
    >
      <input type="hidden" name="mode" value={mode} />
      {mode === "signup" && (
        <label>
          Your name
          <input
            name="display_name"
            autoComplete="name"
            required
            maxLength={80}
            placeholder="What should we call you?"
          />
        </label>
      )}
      <label>
        Email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="you@example.com"
        />
      </label>
      {mode !== "recover" && (
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            required
            minLength={mode === "signup" ? 12 : 1}
            maxLength={200}
            placeholder={
              mode === "signup" ? "At least 12 characters" : "Your password"
            }
          />
        </label>
      )}
      {mode === "login" && (
        <Link href="/recover" className="small-link">
          Forgot your password?
        </Link>
      )}
      <Feedback state={state} />
      <button className="button primary wide" disabled={pending}>
        {pending ? (
          <LoaderCircle className="spin" size={18} />
        ) : mode === "login" ? (
          "Sign in to your archive"
        ) : mode === "signup" ? (
          "Begin your chronicle"
        ) : (
          "Send recovery link"
        )}
        {!pending && <ArrowUpRight size={18} />}
      </button>
    </form>
  );
}

export function MemoryEditor({
  id: initialId,
  memory,
  places,
  people,
  albums,
  links,
}: {
  id: string;
  memory?: Memory;
  places: Place[];
  people: Person[];
  albums: Album[];
  links?: { people: string[]; albums: string[]; tags: string[] };
}) {
  // Server-action revalidation may generate another UUID for the /new page.
  // Keep this editing session's identity through partial uploads and retries.
  const [id] = useState(initialId);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const filesRef = useRef<File[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const allowLeave = useDirtyForm(formRef, filesRef);
  function selectFiles(next: File[]) { filesRef.current = next; setFiles(next); }
  const [progress, setProgress] = useState("");
  const [state, action, pending] = useActionState(
    async (_: ActionState, form: FormData): Promise<ActionState> => {
      let saved = false;
      try {
        const photos = [...filesRef.current];
        if (photos.length > 4)
          throw new Error("Choose up to 4 photographs at a time.");
        for (const photo of photos)
          uploadExtension(
            photo.type,
            new Uint8Array(await photo.slice(0, 12).arrayBuffer()),
            photo.size,
          );
        form.delete("photos");
        setProgress("Saving your memory…");
        const result = await saveMemory({}, form);
        if (result.error) return result;
        saved = true;
        const client = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        );
        for (const [index, photo] of photos.entries()) {
          setProgress(
            "Uploading photograph " +
              (index + 1) +
              " of " +
              photos.length +
              "…",
          );
          const hash = Array.from(
            new Uint8Array(
              await crypto.subtle.digest("SHA-256", await photo.arrayBuffer()),
            ),
          )
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          const prepared = await preparePhoto(id, hash, photo.type);
          if (prepared.exists) { selectFiles(filesRef.current.filter(f => f !== photo)); continue; }
          const upload = await client.storage
            .from("memory-media")
            .upload(prepared.path, photo, {
              contentType: photo.type,
              upsert: true,
            });
          if (upload.error)
            throw new Error(
              "The photo upload failed. Your remaining selections are ready to retry.",
            );
          setProgress(
            "Checking photograph " + (index + 1) + " of " + photos.length + "…",
          );
          const finished = await finishPhoto(id, prepared.path, photo.name);
          if (finished.error) throw new Error(finished.error);
          selectFiles(filesRef.current.filter(f => f !== photo));
        }
        allowLeave();
        router.push("/memories/" + id);
        router.refresh();
        return {};
      } catch (error) {
        return {
          error:
            (saved ? "Your memory text was saved. " : "") +
            (error instanceof Error ? error.message : "Please try again."),
        };
      } finally {
        setProgress("");
      }
    },
    {},
  );
  return (
    <form
      action={action}
      onSubmit={preserveInputs(action)}
      ref={formRef}
      className="editor memory-editor"
      aria-busy={pending}
    >
      <input type="hidden" name="id" value={id} />
      <div className="editor-fields" role="region" aria-label="Memory fields" tabIndex={0}>
      <div className="editor-main form-stack">
        <label className="title-label">
          Give this moment a name
          <input
            className="title-input"
            name="title"
            required
            maxLength={200}
            defaultValue={memory?.title}
            placeholder="A day worth remembering"
          />
        </label>
        <div className="form-row">
          <label>
            Memory date
            <input
              name="memory_date"
              type="date"
              required
              defaultValue={
                memory?.memory_date || new Date().toLocaleDateString("en-CA")
              }
            />
          </label>
          <label>
            <span className="field-label">Time <span className="optional">optional</span></span>
            <input
              name="memory_time"
              type="time"
              defaultValue={memory?.memory_time?.slice(0, 5)}
            />
          </label>
        </div>
        <label>
          <span className="field-label">The story behind it <span className="optional">optional</span></span>
          <textarea
            name="description"
            rows={9}
            maxLength={20000}
            defaultValue={memory?.description}
            placeholder="The little details. The people who were there. How it felt…"
          />
        </label>
        <PhotoSelection files={files} onChange={selectFiles} disabled={pending} />

      </div>
      <aside className="editor-side form-stack">
        <p className="eyebrow">The details</p>
        <label>
          Place
          <select
            aria-label="Place"
            name="place_id"
            defaultValue={memory?.place_id || ""}
          >
            <option value="">No place selected</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <Link className="small-link" href="/places/new">
          Add a place
        </Link>
        <label>
          A feeling
          <input
            name="mood"
            maxLength={60}
            defaultValue={memory?.mood}
            placeholder="Grateful, adventurous, peaceful…"
          />
        </label>
        <label>
          Tags
          <input
            aria-label="Tags"
            name="tags"
            maxLength={1000}
            defaultValue={links?.tags.join(", ")}
            placeholder="summer, family, little things"
          />
          <span className="hint">Separate tags with commas.</span>
        </label>
        <label className="check">
          <input
            name="favorite"
            type="checkbox"
            defaultChecked={memory?.favorite}
          />
          Keep among my favorites
        </label>
        <fieldset>
          <legend>People</legend>
          {people.length ? (
            people.map((p) => (
              <label className="check" key={p.id}>
                <input
                  type="checkbox"
                  name="people"
                  value={p.id}
                  defaultChecked={links?.people.includes(p.id)}
                />
                {p.name}
              </label>
            ))
          ) : (
            <p className="hint">Add the people in your life in settings.</p>
          )}
          <Link className="small-link" href="/settings/people/new">
            Add a person
          </Link>
        </fieldset>
        <fieldset>
          <legend>Albums</legend>
          {albums.length ? (
            albums.map((a) => (
              <label className="check" key={a.id}>
                <input
                  type="checkbox"
                  name="albums"
                  value={a.id}
                  defaultChecked={links?.albums.includes(a.id)}
                />
                {a.title}
              </label>
            ))
          ) : (
            <p className="hint">Create an album to collect related moments.</p>
          )}
        </fieldset>
        <p className="privacy-note">
          Only you can access this memory. Your photographs stay in private
          storage.
        </p>
      </aside>
      </div>
      <div className="memory-save">
        <Feedback state={state} />
        {progress && (
          <p className="hint" role="status">
            {progress}
          </p>
        )}

        <div className="form-actions">
          <Link
            href={memory ? `/memories/${id}` : "/memories"}
            className="button secondary"
          >
            Cancel
          </Link>
          <SaveButton pending={pending}>
            {memory ? "Save memory" : "Preserve this memory"}
            <ArrowUpRight size={17} />
          </SaveButton>
        </div>
      </div>
    </form>
  );
}

export function CollectionEditor({
  kind,
  id,
  record,
  memories,
  selected = [],
  media = [],
}: {
  kind: "albums" | "stories" | "places" | "people";
  id: string;
  record?: Partial<Album & Story & Place & Person>;
  memories?: Memory[];
  selected?: string[];
  media?: Media[];
}) {
  const [state, action, pending] = useActionState(saveCollection, {});
  const collection = kind === "albums" || kind === "stories";
  return (
    <form
      action={action}
      onSubmit={preserveInputs(action)}
      className="editor form-stack single-editor"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <label>
        {collection ? "Title" : kind === "places" ? "Place name" : "Name"}
        <input
          className="title-input"
          name={collection ? "title" : "name"}
          defaultValue={collection ? record?.title : record?.name}
          required
          maxLength={200}
          placeholder={
            kind === "stories"
              ? "A chapter of your life"
              : kind === "albums"
                ? "Moments that belong together"
                : kind === "places"
                  ? "Somewhere meaningful"
                  : "Someone in your story"
          }
        />
      </label>
      {kind === "stories" ? (
        <>
          <label>
            Your story
            <textarea
              className="story-writing"
              name="body"
              rows={18}
              maxLength={100000}
              defaultValue={record?.body}
              placeholder="Every story begins somewhere…"
            />
          </label>
          <label>
            State
            <select
              aria-label="State"
              name="status"
              defaultValue={record?.status || "draft"}
            >
              <option value="draft">Draft — still taking shape</option>
              <option value="saved">Saved — ready to revisit</option>
            </select>
          </label>
        </>
      ) : kind === "people" ? (
        <>
          <label>
            Relationship
            <input
              name="relationship"
              maxLength={100}
              defaultValue={record?.relationship}
              placeholder="Friend, family, fellow traveler…"
            />
          </label>
          <label>
            A note
            <textarea
              name="note"
              maxLength={5000}
              defaultValue={record?.note}
              rows={4}
            />
          </label>
        </>
      ) : (
        <label>
          Description
          <textarea
            name="description"
            maxLength={5000}
            defaultValue={record?.description}
            rows={4}
            placeholder="A little context, in your own words."
          />
        </label>
      )}
      {kind === "places" && (
        <>
          <label>
            Address <span className="optional">optional</span>
            <input
              name="address"
              maxLength={500}
              defaultValue={record?.address}
            />
          </label>
          <div className="form-row">
            <label>
              Latitude <span className="optional">optional</span>
              <input
                name="latitude"
                type="number"
                min={-90}
                max={90}
                step="any"
                defaultValue={record?.latitude ?? ""}
              />
            </label>
            <label>
              Longitude <span className="optional">optional</span>
              <input
                name="longitude"
                type="number"
                min={-180}
                max={180}
                step="any"
                defaultValue={record?.longitude ?? ""}
              />
            </label>
          </div>
          <p className="hint">
            A name is enough. Exact location is always optional.
          </p>
        </>
      )}
      {collection && (
        <>
          <label>
            Cover photograph
            <select
              aria-label="Cover photograph"
              name="cover_media_id"
              defaultValue={record?.cover_media_id || ""}
            >
              <option value="">No cover photograph</option>
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.caption || "Untitled photograph"}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>Connected memories</legend>
            <p className="hint">
              Memories appear in the order shown. Deleting this{" "}
              {kind === "albums" ? "album" : "story"} keeps the memories.
            </p>
            {memories?.length ? (
              <div className="memory-checks">
                {memories.map((m) => (
                  <label className="check" key={m.id}>
                    <input
                      type="checkbox"
                      name="memories"
                      value={m.id}
                      defaultChecked={selected.includes(m.id)}
                    />
                    <span>
                      {m.title}
                      <small>{m.memory_date}</small>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="muted">
                Save your first memory to connect it here.
              </p>
            )}
          </fieldset>
        </>
      )}
      <Feedback state={state} />
      <div className="form-actions">
        <Link
          className="button secondary"
          href={kind === "people" ? "/settings/people" : `/${kind}`}
        >
          Cancel
        </Link>
        <SaveButton pending={pending} />
      </div>
    </form>
  );
}

export function DeleteForm({
  id,
  kind,
  title,
}: {
  id: string;
  kind: string;
  title: string;
}) {
  const [state, action, pending] = useActionState(deleteRecord, {});
  return (
    <details className="danger-details">
      <summary>
        <Trash2 size={15} />
        Delete {kind === "memories" ? "memory" : kind.slice(0, -1)}
      </summary>
      <form
        action={action}
        onSubmit={preserveInputs(action)}
        className="form-stack"
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="kind" value={kind} />
        <p>
          Permanently delete “{title}”?{" "}
          {kind === "memories"
            ? "Its photographs will also be removed."
            : "Your memories will be kept."}{" "}
          This cannot be undone.
        </p>
        <label>
          Type DELETE to confirm
          <input
            name="confirmation"
            required
            pattern="DELETE"
            autoComplete="off"
          />
        </label>
        <Feedback state={state} />
        <button className="button danger" disabled={pending}>
          {pending ? "Deleting…" : "Delete permanently"}
        </button>
      </form>
    </details>
  );
}

export function PhotoGallery({
  media,
  editable = false,
  demo = false,
}: {
  media: Media[];
  editable?: boolean;
  demo?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const [state, action, pending] = useActionState(removePhoto, {});
  if (!media.length) return null;
  return (
    <>
      <div className="photo-gallery">
        {media.map((m, i) => (
          <figure key={m.id}>
            <button
              className="photo-open"
              type="button"
              aria-label={`View ${m.caption || "photograph"} full size`}
              onClick={() => {
                setActive(i);
                dialog.current?.showModal();
              }}
            >
              {demo ? <SamplePhoto name={m.url!.split("/").pop()!.replace("-1280.webp", "")} alt={m.caption} priority={!i} /> : <img
                src={m.preview_url || m.url}
                alt={m.caption || "Memory photograph"}
                loading={i ? "lazy" : "eager"}
              />}
              <Expand size={18} />
            </button>
            {m.caption && <figcaption>{m.caption}</figcaption>}
            {editable && !demo && (
              <>
                <CaptionForm media={m} />
                <form action={action} onSubmit={preserveInputs(action)}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="small-link" disabled={pending}>
                    Remove this photo
                  </button>
                </form>
              </>
            )}
          </figure>
        ))}
      </div>
      <Feedback state={state} />
      <dialog
        ref={dialog}
        className="lightbox"
        aria-label="Photograph viewer"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <button
          className="icon-button lightbox-close"
          type="button"
          aria-label="Close photograph"
          onClick={() => dialog.current?.close()}
        >
          <X />
        </button>
        <img
          src={media[active]?.url}
          alt={media[active]?.caption || "Memory photograph"}
          width={demo ? media[active]?.url?.includes("journey") ? 640 : 1280 : undefined}
          height={demo ? media[active]?.url?.includes("journey") ? 960 : media[active]?.url?.includes("beach") ? 721 : 854 : undefined}
        />
        <p>{media[active]?.caption}</p>
        <div className="lightbox-controls">
          {media.map((m, i) => (
            <button
              key={m.id}
              className={active === i ? "selected" : ""}
              onClick={() => setActive(i)}
              aria-label={`Photograph ${i + 1}`}
              aria-pressed={active === i}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </dialog>
    </>
  );
}

export function SettingsForm({
  kind,
  name,
}: {
  kind: "profile" | "password" | "delete";
  name?: string;
}) {
  const actionFn: Action =
    kind === "profile"
      ? updateProfile
      : kind === "password"
        ? updatePassword
        : deleteAccount;
  const [state, action, pending] = useActionState(actionFn, {});
  return (
    <form
      action={action}
      onSubmit={preserveInputs(action)}
      className="form-stack settings-form"
    >
      {kind === "profile" ? (
        <label>
          Your name
          <input
            name="display_name"
            required
            maxLength={80}
            defaultValue={name}
          />
        </label>
      ) : kind === "password" ? (
        <>
          <label>
            New password
            <input
              type="password"
              name="password"
              required
              minLength={12}
              maxLength={200}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              name="confirm_password"
              required
              minLength={12}
              maxLength={200}
              autoComplete="new-password"
            />
          </label>
        </>
      ) : (
        <>
          <p>
            All memories, photographs, albums, stories, places and people will
            be permanently deleted. Export your archive first. If cleanup fails,
            your account remains available so you can retry.
          </p>
          <label>
            Current password
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </label>
          <label>
            Type DELETE MY ACCOUNT
            <input
              name="confirmation"
              required
              pattern="DELETE MY ACCOUNT"
              autoComplete="off"
            />
          </label>
        </>
      )}
      <Feedback state={state} />
      {kind === "delete" ? (
        <button className="button danger" disabled={pending}>
          {pending ? "Deleting account…" : "Permanently delete my account"}
        </button>
      ) : (
        <SaveButton pending={pending} />
      )}
    </form>
  );
}

export function Tilt({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      onPointerMove={(e) => {
        if (
          !matchMedia(
            "(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)",
          ).matches
        )
          return;
        const r = e.currentTarget.getBoundingClientRect();
        ref.current?.style.setProperty(
          "--rx",
          `${((e.clientY - r.top) / r.height - 0.5) * -5}deg`,
        );
        ref.current?.style.setProperty(
          "--ry",
          `${((e.clientX - r.left) / r.width - 0.5) * 5}deg`,
        );
      }}
      onPointerLeave={() => {
        ref.current?.style.setProperty("--rx", "0deg");
        ref.current?.style.setProperty("--ry", "0deg");
      }}
    >
      {children}
    </div>
  );
}

export function MobileNav({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  function close() { dialog.current?.close(); }
  return <>
    <button ref={trigger} className="mobile-menu icon-button" type="button" aria-label="Open navigation"
      aria-expanded={open} aria-controls="archive-navigation" onClick={() => { dialog.current?.showModal(); setOpen(true); }}><Plus /></button>
    <dialog ref={dialog} id="archive-navigation" className="mobile-nav" aria-label="Archive navigation"
      onClose={() => { setOpen(false); trigger.current?.focus(); }}
      onKeyDown={e => {
        if (e.key !== "Tab") return;
        const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]')).filter(el => el.getClientRects().length);
        const first = items[0], last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }}
      onClick={e => { if (e.target === e.currentTarget || (e.target as Element).closest("a")) close(); }}>
      <button className="icon-button drawer-close" type="button" aria-label="Close navigation" onClick={close}><X /></button>
      {children}
    </dialog>
  </>;
}

function CaptionForm({ media }: { media: Media }) {
  const [state, action, pending] = useActionState(updateCaption, {});
  return (
    <form
      action={action}
      onSubmit={preserveInputs(action)}
      className="caption-form"
    >
      <input type="hidden" name="id" value={media.id} />
      <label>
        Caption
        <input name="caption" maxLength={500} defaultValue={media.caption} />
      </label>
      <button className="small-link" disabled={pending}>
        Save caption
      </button>
      <Feedback state={state} />
    </form>
  );
}
