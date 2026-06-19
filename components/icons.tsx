import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function BooksIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H9a1 1 0 0 1 1 1v14a1 1 0 0 0-1-1H5.5A1.5 1.5 0 0 1 4 16.5z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H15a1 1 0 0 0-1 1v14a1 1 0 0 1 1-1h3.5a1.5 1.5 0 0 0 1.5-1.5z" />
    </svg>
  );
}

export function ChartIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 20V10" />
      <path d="M12 20V4" />
      <path d="M18 20v-7" />
    </svg>
  );
}

export function GearIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <svg {...base({ size: 17, ...p })}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function TrashIcon(p: IconProps) {
  return (
    <svg {...base({ size: 18, ...p })}>
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

export function ChevronRightIcon(p: IconProps) {
  return (
    <svg {...base({ size: 18, strokeWidth: 2.4, ...p })}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronLeftIcon(p: IconProps) {
  return (
    <svg {...base({ size: 22, strokeWidth: 2.4, ...p })}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function HeadphonesIcon(p: IconProps) {
  return (
    <svg {...base({ size: 14, ...p })}>
      <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
      <path d="M21 16a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2zM3 16a2 2 0 0 0 2 2h1v-5H5a2 2 0 0 0-2 2z" />
    </svg>
  );
}

export function StarIcon({
  fill = "none",
  size = 14,
  ...p
}: IconProps & { fill?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      {...p}
    >
      <path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.5 1.3 6.5L12 17.8 6.1 20.8l1.3-6.5L2.5 9.3l6.6-.7z" />
    </svg>
  );
}

export function StarHalfIcon({ size = 14, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      <defs>
        <linearGradient id="half">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.9 6.1 6.6.7-4.9 4.5 1.3 6.5L12 17.8 6.1 20.8l1.3-6.5L2.5 9.3l6.6-.7z"
        fill="url(#half)"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}
