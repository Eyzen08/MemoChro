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
export function Navigation() {
  const path = usePathname();
  return (
    <nav className="primary-nav" aria-label="Main navigation">
      {destinations.map(([label, href, Icon]) => (
        <Link
          key={href}
          href={href}
          className={path.startsWith(href) ? "active" : ""}
          aria-current={path.startsWith(href) ? "page" : undefined}
        >
          <Icon size={19} />
          <span>{label}</span>
          {path.startsWith(href) && <i />}
        </Link>
      ))}
    </nav>
  );
}
