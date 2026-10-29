"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Clock3, Images, Layers, BookOpen, MapPin } from "lucide-react";
const destinations = [
  ["Home", "/home", House],
  ["Timeline", "/timeline", Clock3],
  ["Memories", "/memories", Images],
  ["Albums", "/albums", Layers],
  ["Stories", "/stories", BookOpen],
  ["Places", "/places", MapPin],
] as const;
export function Navigation({basePath = ""}: {basePath?: string}) {
  const path = usePathname();
  return (
    <nav className="primary-nav" aria-label="Main navigation">
      {destinations.map(([label, href, Icon]) => (
        <Link
          key={href}
          href={basePath + href}
          className={path.startsWith(basePath + href) ? "active" : ""}
          aria-current={path.startsWith(basePath + href) ? "page" : undefined}
        >
          <Icon size={19} />
          <span>{label}</span>
          {path.startsWith(basePath + href) && <i />}
        </Link>
      ))}
    </nav>
  );
}
