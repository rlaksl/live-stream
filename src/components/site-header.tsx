import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/current-user";
import { signOut } from "@/features/auth/actions";
import { MainNav } from "./main-nav";

const headerButton = "h-10 px-4 text-[15px]";

/** 로고 · 주 메뉴 · 로그인/방송하기. 좁은 화면에서는 메뉴가 아랫줄로 내려간다. */
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-10">
        <Link href="/" className="flex flex-col leading-none" aria-label="BRDCST 홈">
          <span className="font-pixel text-[22px] tracking-wider text-primary">BRDCST</span>
          <span className="mt-1 font-pixel text-[10px] tracking-[0.3em] text-muted-foreground">broadcast</span>
        </Link>

        <MainNav />

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/me" className={cn(buttonVariants({ variant: "ghost" }), headerButton, "px-3")}>
                마이페이지
              </Link>
              <form action={signOut}>
                <button type="submit" className={cn(buttonVariants({ variant: "ghost" }), headerButton, "px-3")}>
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), headerButton)}>
              로그인
            </Link>
          )}
          {/* 비로그인이면 방송 만들기 화면이 로그인으로 보내고, 로그인 후 다시 돌아온다 */}
          <Link href="/broadcasts/new" className={cn(buttonVariants(), headerButton, "font-bold")}>
            방송하기
          </Link>
        </div>
      </div>
    </header>
  );
}
