import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "./types";

/**
 * 카테고리 칩(전체 + 고정 카테고리). `basePath?category=game` 링크로 거른다.
 * 홈·전체 방송·다시보기 목록이 같이 쓴다.
 */
export function CategoryChips({ basePath, active }: { basePath: string; active?: Category }) {
  return (
    <nav aria-label="카테고리" className="flex flex-wrap gap-2">
      <Chip href={basePath} active={!active}>
        전체
      </Chip>
      {CATEGORIES.map((c) => (
        <Chip key={c} href={`${basePath}?category=${c}`} active={active === c}>
          {CATEGORY_LABEL[c]}
        </Chip>
      ))}
    </nav>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-[18px] py-2.5 text-sm",
        active ? "bg-foreground font-bold text-background" : "bg-secondary text-[#d4d4d8] hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
