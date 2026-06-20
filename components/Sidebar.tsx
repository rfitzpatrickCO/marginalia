"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BooksIcon, ChartIcon, GearIcon } from "./icons";

const ITEMS = [
  { href: "/library", label: "Library", Icon: BooksIcon, match: ["/library", "/book"] },
  { href: "/stats", label: "Stats", Icon: ChartIcon, match: ["/stats"] },
  { href: "/settings", label: "Settings", Icon: GearIcon, match: ["/settings"] },
];

/** Left navigation rail shown on desktop (≥900px). Hidden on mobile via CSS,
 *  where the bottom TabBar is used instead. */
export function Sidebar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Marginalia</div>
      <nav className="sidebar-nav">
        {ITEMS.map(({ href, label, Icon, match }) => {
          const sel = match.some(
            (m) => pathname === m || pathname.startsWith(`${m}/`),
          );
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-item${sel ? " sel" : ""}`}
            >
              <Icon size={22} strokeWidth={sel ? 2.1 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
