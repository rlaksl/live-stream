"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** 헤더 주 메뉴. 지금 보고 있는 메뉴는 배경을 밝게 한다. */
const LINKS = [
  { href: "/", label: "홈" },
  { href: "/recordings", label: "다시보기" },
  { href: "/schedule", label: "편성표" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="주 메뉴" className="order-last flex w-full gap-1 sm:order-none sm:w-auto">
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-sm px-3 py-2 text-[15px] text-muted-foreground hover:text-foreground sm:px-4",
              active && "bg-secondary font-medium text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
