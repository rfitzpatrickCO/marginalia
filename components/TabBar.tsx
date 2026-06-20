"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BooksIcon, ChartIcon, GearIcon, HomeIcon } from "./icons";

const TABS = [
  { href: "/home", label: "Home", Icon: HomeIcon, match: ["/home"] },
  { href: "/library", label: "Library", Icon: BooksIcon, match: ["/library", "/book"] },
  { href: "/stats", label: "Stats", Icon: ChartIcon, match: ["/stats"] },
  { href: "/settings", label: "Settings", Icon: GearIcon, match: ["/settings"] },
];

const HIDDEN = ["/login", "/signup", "/onboarding"];

export function TabBar() {
  const pathname = usePathname();
  if (HIDDEN.includes(pathname)) return null;
  return (
    <nav className="tabbar">
      {TABS.map(({ href, label, Icon, match }) => {
        const sel = match.some(
          (m) => pathname === m || pathname.startsWith(`${m}/`),
        );
        return (
          <Link key={href} href={href} className={`tab${sel ? " sel" : ""}`}>
            <Icon size={26} strokeWidth={sel ? 2.1 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
