import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "./icons";

/** Inline iOS-style nav bar. `back` renders a leading back button; `right`
 *  renders trailing controls. The large title lives in the page content. */
export function Nav({
  title,
  back,
  right,
}: {
  title?: string;
  back?: { href: string; label?: string };
  right?: ReactNode;
}) {
  return (
    <header className="nav">
      {back && (
        <div className="nav-left">
          <Link href={back.href} className="nav-btn">
            <ChevronLeftIcon />
            {back.label ?? "Back"}
          </Link>
        </div>
      )}
      {title && <span className="nav-title-inline">{title}</span>}
      {right && <div className="nav-right">{right}</div>}
    </header>
  );
}
