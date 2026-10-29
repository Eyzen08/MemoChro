import Link from "next/link";
import {
  Plus,
  Search,
  Settings,
  LogOut,
  LockKeyhole,
  ArrowUpRight,
} from "lucide-react";
import { logout } from "@/app/actions";
import { Brand } from "@/components/archive";
import { Navigation } from "@/components/navigation";
import { ThemeToggle, MobileNav } from "@/components/forms";

export function ArchiveShell({children, name = "Sample archive", demo = false}: {children: React.ReactNode; name?: string; demo?: boolean}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand href={demo ? "/demo/home" : "/home"} />
        <div className="sidebar-label">{demo ? "A sample chronicle" : "Your chronicle"}</div>
        <Navigation basePath={demo ? "/demo" : ""} />
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
          {!demo && <Link href="/settings" className="settings-link">
            <Settings size={18} />
            Settings & account
            <ArrowUpRight size={14} />
          </Link>}
          <div className="sidebar-profile">
            <span className="avatar">
              {String(name).slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{name}</strong>
              <span>
                <LockKeyhole size={10} />
                {demo ? "Fictional people & memories" : "Private archive"}
              </span>
            </div>
            {!demo && <form action={logout}>
              <button className="icon-button" aria-label="Sign out">
                <LogOut size={16} />
              </button>
            </form>}
          </div>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand href={demo ? "/demo/home" : "/home"} />
          </div>
          <div className="desktop-top-label">
            <span className="status-dot" />{demo ? "Explore a life in moments" : "A space of your own"}
          </div>
          <div className="topbar-actions">
            <Link
              className="top-search"
              href={demo ? "/demo/memories" : "/memories"}
              aria-label="Search your archive"
            >
              <Search size={17} />
              <span>Find a memory</span>
            </Link>
            <ThemeToggle />
            <span className="topbar-divider" />
            <Link className="button primary create-top" href={demo ? "/signup" : "/memories/new"}>
              <Plus size={16} />
              <span>{demo ? "Start your own archive" : "Create memory"}</span>
            </Link>
            <MobileNav>
              <Navigation basePath={demo ? "/demo" : ""} />
              {!demo && <Link href="/settings" className="settings-link">
                <Settings size={18} />
                Settings & account
              </Link>}
              {!demo && <form action={logout}>
                <button className="button secondary">Sign out</button>
              </form>}
            </MobileNav>
          </div>
        </header>
        {demo && <div className="sample-banner"><strong>Sample archive — read only</strong><span>Fictional stories, licensed photography.</span><Link href="/home">Return to your archive</Link></div>}
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
