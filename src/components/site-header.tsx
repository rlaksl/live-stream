import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex flex-col leading-none" aria-label="BRDCST 홈">
          <span className="font-pixel text-xl font-bold tracking-wider text-primary">BRDCST</span>
          <span className="font-pixel text-[10px] tracking-[0.3em] text-muted-foreground">
            broadcast
          </span>
        </Link>
      </div>
    </header>
  );
}
