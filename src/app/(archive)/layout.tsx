import Link from "next/link";
import {
  Plus,
  Search,
  Settings,
  LogOut,
  LockKeyhole,
  ArrowUpRight,
} from "lucide-react";
import { requireUser, check } from "@/lib/supabase";
import { logout } from "@/app/actions";
import { Brand } from "@/components/archive";
import { Navigation } from "@/components/navigation";
import { ThemeToggle, MobileNav } from "@/components/forms";
export const dynamic = "force-dynamic";

export default async function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { db, user } = await requireUser();
  const profile = await db
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  check(profile.error);
  const name =
    profile.data?.display_name ||
    user.user_metadata?.display_name ||
    "Your archive";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-label">Your chronicle</div>
        <Navigation />
        <div className="sidebar-bottom">
          <div className="archive-note">
            <span className="note-orbit" />
            <p>
              A little of your life.
              <br />
              Kept for a lifetime.
            </p>
            <span>Make it a habit. Make it yours.</span>
          </div>
          <Link href="/settings" className="settings-link">
            <Settings size={18} />
            Settings & account
            <ArrowUpRight size={14} />
          </Link>
          <div className="sidebar-profile">
            <span className="avatar">
              {String(name).slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{name}</strong>
              <span>
                <LockKeyhole size={10} />
                Private archive
              </span>
            </div>
            <form action={logout}>
              <button className="icon-button" aria-label="Sign out">
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="desktop-top-label">
            <span className="status-dot" />A space of your own
          </div>
          <div className="topbar-actions">
            <Link
              className="top-search"
              href="/memories"
              aria-label="Search your archive"
            >
              <Search size={17} />
              <span>Find a memory</span>
            </Link>
            <ThemeToggle />
            <span className="topbar-divider" />
            <Link className="button primary create-top" href="/memories/new">
              <Plus size={16} />
              <span>Create memory</span>
            </Link>
            <MobileNav>
              <Navigation />
              <Link href="/settings" className="settings-link">
                <Settings size={18} />
                Settings & account
              </Link>
              <form action={logout}>
                <button className="button secondary">Sign out</button>
              </form>
            </MobileNav>
          </div>
        </header>
        <main id="main" className="main-content">
          {children}
        </main>
        <footer className="app-footer">
          <span>MemoChro · Your life, through time.</span>
          <Link href="/privacy">
            A note on privacy
            <LockKeyhole size={11} />
          </Link>
        </footer>
      </div>
    </div>
  );
}
