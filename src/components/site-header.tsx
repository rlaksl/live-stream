import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/current-user";
import { signOut } from "@/features/auth/actions";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex flex-col leading-none" aria-label="BRDCST 홈">
          <span className="font-pixel text-xl font-bold tracking-wider text-primary">BRDCST</span>
          <span className="font-pixel text-[10px] tracking-[0.3em] text-muted-foreground">
            broadcast
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link href="/broadcasts/new" className={buttonVariants({ size: "sm" })}>
                방송하기
              </Link>
              <span className="hidden text-muted-foreground sm:inline">{user.nickname}</span>
              <form action={signOut}>
                <button type="submit" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                로그인
              </Link>
              <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
